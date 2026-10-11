// The Devicons MCP tools. Registered on every server instance, hosted or
// local; the DataSource decides where the data comes from.
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

const READ_ONLY = { readOnlyHint: true, openWorldHint: false } as const;

const GetIconOutputSchema = IconDetailSchema.extend({
  svg_markup: z.string().optional(),
  usage: z.object({ install: z.string(), code: z.string() }),
});

type ToolResult = {
  content: Array<{ type: 'text'; text: string }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};

const ok = (text: string, structuredContent: Record<string, unknown>): ToolResult => ({
  content: [{ type: 'text', text }],
  structuredContent,
});

const fail = (text: string): ToolResult => ({
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

export function registerDeviconsTools(server: McpServer, source: DataSource): void {
  server.registerTool(
    'search_icons',
    {
      title: 'Search icons',
      description:
        'Search Devicons for developer, brand, framework, and tool logos by name, alias, or tag. Returns ranked icons with their slug, page URL, and SVG URL. Use the slug with get_icon.',
      inputSchema: z.object({
        query: z
          .string()
          .trim()
          .min(1)
          .max(MAX_QUERY_LENGTH)
          .describe('What to look for, e.g. "react", "postgres", "vector database".'),
        category: z
          .string()
          .optional()
          .describe('Only return icons in this category slug (see list_categories).'),
        limit: z.number().int().min(1).max(50).default(10),
      }),
      outputSchema: SearchResultSchema,
      annotations: READ_ONLY,
    },
    ({ query, category, limit }) =>
      guarded(async () => {
        const result = await source.search(query, { limit, category });
        const lines = result.results.map(r => `- ${r.name} (${r.slug}): ${r.svg}`);
        const text = result.count
          ? `Found ${result.count} icon${result.count === 1 ? '' : 's'} for "${query}":\n${lines.join('\n')}`
          : `No icons match "${query}". Try a shorter or broader query.`;
        return ok(text, result);
      }),
  );

  server.registerTool(
    'get_icon',
    {
      title: 'Get icon',
      description:
        'Get one icon by slug: metadata, every variant (color and monochrome SVG URLs), the SVG markup of the primary variant, and an install command plus code for React, Vue, Svelte, or plain HTML.',
      inputSchema: z.object({
        slug: z.string().min(1).describe('Icon slug from search_icons, e.g. "react".'),
        framework: z.enum(FRAMEWORKS).default('react'),
        include_svg: z.boolean().default(true),
      }),
      outputSchema: GetIconOutputSchema,
      annotations: READ_ONLY,
    },
    ({ slug, framework, include_svg }) =>
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
        const text = `${header.join('\n')}\n\n${usage.code}`;
        return ok(text, {
          ...detail,
          usage,
          ...(svg_markup !== undefined && { svg_markup }),
        });
      }),
  );

  server.registerTool(
    'list_categories',
    {
      title: 'List categories',
      description:
        'List Devicons categories (languages, frameworks, databases, cloud, AI, and more) with their slugs and icon counts.',
      inputSchema: z.object({}),
      outputSchema: z.object({ categories: z.array(CategorySchema) }),
      annotations: READ_ONLY,
    },
    () =>
      guarded(async () => {
        const categories = await source.categories();
        const text = categories.map(c => `- ${c.label} (${c.slug}): ${c.count}`).join('\n');
        return ok(`${categories.length} categories:\n${text}`, { categories });
      }),
  );

  server.registerTool(
    'get_category',
    {
      title: 'Get category',
      description:
        'Get the icons in one category, most recognizable first. Use a slug from list_categories.',
      inputSchema: z.object({
        slug: z.string().min(1).describe('Category slug, e.g. "database" or "llm".'),
        limit: z.number().int().min(1).max(200).default(50),
      }),
      outputSchema: CategoryDetailSchema,
      annotations: READ_ONLY,
    },
    ({ slug, limit }) =>
      guarded(async () => {
        const detail = await source.category(slug, limit);
        if (!detail) {
          return fail(`No category "${slug}". Call list_categories for valid slugs.`);
        }
        const lines = detail.icons.map(i => `- ${i.name} (${i.slug})`);
        return ok(`${detail.label}: ${detail.count} icons\n${lines.join('\n')}`, detail);
      }),
  );
}
