// The Devicons agent tools. Registered on every MCP server instance, hosted or
// local, and exposed in the browser through WebMCP (webmcp.ts); the
// DataSource decides where the data comes from.
import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import {
  CategoryDetailSchema,
  CategorySchema,
  IconDetailSchema,
  SearchResultSchema,
} from './schema.ts';
import { MAX_QUERY_LENGTH } from './search.ts';
import { FRAMEWORKS, usageFor } from './snippets.ts';
import { ApiRequestError, type DataSource } from './source.ts';

export const TOOL_NAMES = [
  'search_icons',
  'get_icon',
  'list_categories',
  'get_category',
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];

export const READ_ONLY = { readOnlyHint: true, openWorldHint: false } as const;

export const TOOL_INFO: Record<ToolName, { title: string; description: string }> = {
  search_icons: {
    title: 'Search icons',
    description:
      'Search Devicons for developer, brand, framework, and tool logos by name, alias, or tag. Returns ranked icons with their slug, page URL, and SVG URL. Use the slug with get_icon.',
  },
  get_icon: {
    title: 'Get icon',
    description:
      'Get one icon by slug: metadata, every variant (color and monochrome SVG URLs), the SVG markup of the primary variant, and an install command plus code for React, Vue, Svelte, or plain HTML.',
  },
  list_categories: {
    title: 'List categories',
    description:
      'List Devicons categories (languages, frameworks, databases, cloud, AI, and more) with their slugs and icon counts.',
  },
  get_category: {
    title: 'Get category',
    description:
      'Get the icons in one category, most recognizable first. Use a slug from list_categories.',
  },
};

export const TOOL_INPUTS = {
  search_icons: z.object({
    query: z
      .string()
      .trim()
      .min(1)
      .max(MAX_QUERY_LENGTH)
      .describe('What to look for, e.g. "react", "postgres", "vector database".'),
    category: z
      .string()
      .trim()
      .toLowerCase()
      .optional()
      .describe('Only return icons in this category slug (see list_categories).'),
    limit: z.number().int().min(1).max(50).default(10),
  }),
  get_icon: z.object({
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(1)
      .describe('Icon slug from search_icons, e.g. "react".'),
    framework: z.enum(FRAMEWORKS).default('react'),
    include_svg: z.boolean().default(true),
  }),
  list_categories: z.object({}),
  get_category: z.object({
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(1)
      .describe('Category slug, e.g. "database" or "llm".'),
    limit: z.number().int().min(1).max(200).default(50),
  }),
} satisfies Record<ToolName, z.ZodObject>;

type ToolInput<N extends ToolName> = z.output<(typeof TOOL_INPUTS)[N]>;

const GetIconOutputSchema = IconDetailSchema.extend({
  svg_markup: z.string().optional(),
  usage: z.object({ install: z.string(), code: z.string() }),
});

export type ToolResult = {
  content: Array<{ type: 'text'; text: string }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};

const ok = (text: string, structuredContent: Record<string, unknown>): ToolResult => ({
  content: [{ type: 'text', text }],
  structuredContent,
});

export const fail = (text: string): ToolResult => ({
  content: [{ type: 'text', text }],
  isError: true,
});

// Upstream failures become tool errors the model can read, not protocol errors.
async function guarded(run: () => Promise<ToolResult>): Promise<ToolResult> {
  try {
    return await run();
  } catch (err) {
    if (err instanceof ApiRequestError) return fail(`Devicons API error: ${err.message}`);
    throw err;
  }
}

/** Runs a tool on input already parsed by its TOOL_INPUTS schema. */
export const TOOL_HANDLERS: {
  [N in ToolName]: (source: DataSource, input: ToolInput<N>) => Promise<ToolResult>;
} = {
  search_icons: (source, { query, category, limit }) =>
    guarded(async () => {
      const result = await source.search(query, { limit, category });
      const lines = result.results.map(r => `- ${r.name} (${r.slug}): ${r.svg}`);
      const found =
        result.total > result.count
          ? `Showing ${result.count} of ${result.total} icons for "${query}" (raise limit for more):`
          : `Found ${result.count} icon${result.count === 1 ? '' : 's'} for "${query}":`;
      const text = result.count
        ? `${found}\n${lines.join('\n')}`
        : `No icons match "${query}". Try a shorter or broader query.`;
      return ok(text, result);
    }),

  get_icon: (source, { slug, framework, include_svg }) =>
    guarded(async () => {
      const detail = await source.icon(slug);
      if (!detail) {
        return fail(`No icon with slug "${slug}". Call search_icons to find the right slug.`);
      }
      const usage = usageFor(detail, framework);
      const svg_markup = include_svg ? await source.svg(detail.svg) : undefined;
      const header = [
        `${detail.name} (${detail.slug})${detail.deprecated ? ' [deprecated]' : ''}`,
        `Page: ${detail.url}`,
        `SVG: ${detail.svg}`,
      ];
      if (usage.install) header.push(`Install: ${usage.install}`);
      const variants = detail.variants.map(
        v => `- ${v.file} (${v.label}): color ${v.svg} | mono ${v.mono}`,
      );
      const sections = [
        header.join('\n'),
        `Variants:\n${variants.join('\n')}`,
        usage.code,
        ...(svg_markup !== undefined ? [`SVG markup:\n${svg_markup}`] : []),
      ];
      const text = sections.join('\n\n');
      return ok(text, {
        ...detail,
        usage,
        ...(svg_markup !== undefined && { svg_markup }),
      });
    }),

  list_categories: source =>
    guarded(async () => {
      const categories = await source.categories();
      const text = categories.map(c => `- ${c.label} (${c.slug}): ${c.count}`).join('\n');
      return ok(`${categories.length} categories:\n${text}`, { categories });
    }),

  get_category: (source, { slug, limit }) =>
    guarded(async () => {
      const detail = await source.category(slug, limit);
      if (!detail) {
        return fail(`No category "${slug}". Call list_categories for valid slugs.`);
      }
      const lines = detail.icons.map(i => `- ${i.name} (${i.slug})`);
      return ok(`${detail.label}: ${detail.count} icons\n${lines.join('\n')}`, detail);
    }),
};

export function registerDeviconsTools(server: McpServer, source: DataSource): void {
  server.registerTool(
    'search_icons',
    {
      ...TOOL_INFO.search_icons,
      inputSchema: TOOL_INPUTS.search_icons,
      outputSchema: SearchResultSchema,
      annotations: READ_ONLY,
    },
    input => TOOL_HANDLERS.search_icons(source, input),
  );

  server.registerTool(
    'get_icon',
    {
      ...TOOL_INFO.get_icon,
      inputSchema: TOOL_INPUTS.get_icon,
      outputSchema: GetIconOutputSchema,
      annotations: READ_ONLY,
    },
    input => TOOL_HANDLERS.get_icon(source, input),
  );

  server.registerTool(
    'list_categories',
    {
      ...TOOL_INFO.list_categories,
      inputSchema: TOOL_INPUTS.list_categories,
      outputSchema: z.object({ categories: z.array(CategorySchema) }),
      annotations: READ_ONLY,
    },
    input => TOOL_HANDLERS.list_categories(source, input),
  );

  server.registerTool(
    'get_category',
    {
      ...TOOL_INFO.get_category,
      inputSchema: TOOL_INPUTS.get_category,
      outputSchema: CategoryDetailSchema,
      annotations: READ_ONLY,
    },
    input => TOOL_HANDLERS.get_category(source, input),
  );
}
