// `devicons` command line: a thin client of https://devicons.io/api/v1.
// All I/O goes through CliIO so the commands are testable without a network
// or a real filesystem. Only `add` writes files.
import path from 'node:path';
import { parseArgs } from 'node:util';
import type { McpServer } from '@modelcontextprotocol/server';
import type { Category, IconSummary } from './schema.ts';
import { createDeviconsServer } from './server.ts';
import {
  ApiRequestError,
  createHttpSource,
  isValidSlug,
  normalizeSlug,
  type DataSource,
} from './source.ts';

export interface CliIO {
  stdout(s: string): void;
  stderr(s: string): void;
  /** Overrides the HTTP source (tests). */
  source?: DataSource;
  cwd: string;
  /** Environment for DEVICONS_API (defaults to process.env). */
  env?: Record<string, string | undefined>;
  version: string;
  writeFile(p: string, data: string): Promise<void>;
  exists(p: string): Promise<boolean>;
  mkdir(p: string): Promise<void>;
  serveMcp?(factory: () => McpServer): Promise<void>;
}

export const EXIT = { ok: 0, usage: 1, notFound: 2, network: 3, fs: 4 } as const;

const USAGE = `Usage: devicons <command> [options]

Commands:
  search <query>        Search icons by name, alias, or tag
  info <slug>           Show an icon's details, variants, and components
  svg <slug>            Print an icon's SVG to stdout
  add <slug...>         Save icons as SVG files (default: ./icons)
  categories            List icon categories
  category <slug>       List the icons in a category
  mcp                   Run the Devicons MCP server over stdio

Options:
  --json                Print JSON (search, info, categories, category)
  --category <slug>     Filter search results by category
  --limit <n>           Maximum results (search: 1-100, category: 1-200)
  --variant <file>      Pick a variant file (svg)
  --mono                Use the monochrome variant (svg, add)
  --out <dir>           Output directory for add (default: icons)
  --force               Overwrite existing files (add)
  --api <url>           API base URL (default: https://devicons.io, or DEVICONS_API)
  -h, --help            Show this help
  -v, --version         Show the version

Docs: https://devicons.io/docs/cli/
`;

class UsageError extends Error {}
class NotFoundError extends Error {}
class FsError extends Error {}

const OPTIONS = {
  json: { type: 'boolean' },
  category: { type: 'string' },
  limit: { type: 'string' },
  variant: { type: 'string' },
  mono: { type: 'boolean' },
  out: { type: 'string' },
  force: { type: 'boolean' },
  api: { type: 'string' },
  help: { type: 'boolean', short: 'h' },
  version: { type: 'boolean', short: 'v' },
} as const;

type Flags = {
  json?: boolean;
  category?: string;
  limit?: string;
  variant?: string;
  mono?: boolean;
  out?: string;
  force?: boolean;
  api?: string;
};

const parseLimit = (raw: string | undefined, max: number): number | undefined => {
  if (raw === undefined) return undefined;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > max) {
    throw new UsageError(`--limit must be an integer from 1 to ${max}`);
  }
  return n;
};

const requireSlug = (raw: string | undefined, what = 'slug'): string => {
  const slug = raw === undefined ? '' : normalizeSlug(raw);
  if (!slug) throw new UsageError(`Missing ${what}`);
  if (!isValidSlug(slug)) {
    throw new UsageError(`Invalid ${what} "${raw}": use letters, digits, ".", "_" or "-"`);
  }
  return slug;
};

const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

const pad = (rows: string[][]) => {
  const widths = rows[0]?.map((_, i) => Math.max(...rows.map(r => r[i].length))) ?? [];
  return rows.map(r => r.map((cell, i) => cell.padEnd(widths[i])).join('  ').trimEnd()).join('\n');
};

const iconTable = (icons: IconSummary[]) =>
  `${pad(icons.map(i => [i.slug, i.name, i.svg]))}\n`;

const categoryTable = (categories: Category[]) =>
  `${pad(categories.map(c => [c.slug, c.label, String(c.count)]))}\n`;

async function runCommand(
  command: string,
  args: string[],
  flags: Flags,
  io: CliIO,
  source: DataSource,
): Promise<number> {
  switch (command) {
    case 'search': {
      const query = args.join(' ').trim();
      if (!query) throw new UsageError('Missing search query');
      const limit = parseLimit(flags.limit, 100);
      const result = await source.search(query, { limit, category: flags.category });
      if (flags.json) io.stdout(json(result));
      else if (!result.count) io.stdout(`No icons match "${query}".\n`);
      else io.stdout(iconTable(result.results));
      return EXIT.ok;
    }

    case 'info': {
      const slug = requireSlug(args[0]);
      const detail = await source.icon(slug);
      if (!detail) throw new NotFoundError(`Icon "${slug}" not found. Try: devicons search ${slug}`);
      if (flags.json) {
        io.stdout(json(detail));
        return EXIT.ok;
      }
      const lines = [
        `${detail.name} (${detail.slug})${detail.deprecated ? ' — deprecated' : ''}`,
        detail.description ?? '',
        '',
        `Page:     ${detail.url}`,
        `Tags:     ${detail.tags.join(', ')}`,
        detail.website ? `Website:  ${detail.website}` : '',
        `React:    import { ${detail.components.react.name} } from "${detail.components.react.package}"`,
        '',
        'Variants:',
        ...detail.variants.map(v => `  ${v.file.padEnd(28)} ${v.svg}`),
      ];
      io.stdout(`${lines.filter((l, i) => l || lines[i - 1]).join('\n')}\n`);
      return EXIT.ok;
    }

    case 'svg': {
      const slug = requireSlug(args[0]);
      const detail = await source.icon(slug);
      if (!detail) throw new NotFoundError(`Icon "${slug}" not found. Try: devicons search ${slug}`);
      const variant = flags.variant
        ? detail.variants.find(v => v.file === flags.variant)
        : detail.variants[0];
      if (!variant) {
        throw new NotFoundError(
          `Variant "${flags.variant}" not found for ${slug}. Available: ${detail.variants.map(v => v.file).join(', ')}`,
        );
      }
      io.stdout(await source.svg(flags.mono ? variant.mono : variant.svg));
      return EXIT.ok;
    }

    case 'add': {
      if (!args.length) throw new UsageError('Missing slug');
      const slugs = args.map(s => requireSlug(s));
      const outDir = path.resolve(io.cwd, flags.out ?? 'icons');
      let missing = 0;
      for (const slug of slugs) {
        const detail = await source.icon(slug);
        if (!detail) {
          io.stderr(`devicons: icon "${slug}" not found, skipping\n`);
          missing++;
          continue;
        }
        const variant = detail.variants[0];
        const file = path.resolve(outDir, `${slug}.svg`);
        const inside = path.relative(outDir, file);
        if (!inside || inside.startsWith('..') || path.isAbsolute(inside)) {
          throw new UsageError(`Refusing to write outside ${outDir}`);
        }
        const rel = path.relative(io.cwd, file) || file;
        try {
          if (!flags.force && (await io.exists(file))) {
            io.stdout(`skipped ${rel} (exists, use --force to overwrite)\n`);
            continue;
          }
          const svg = await source.svg(flags.mono ? variant.mono : variant.svg);
          await io.mkdir(outDir);
          await io.writeFile(file, svg);
        } catch (err) {
          if (err instanceof ApiRequestError) throw err;
          throw new FsError(err instanceof Error ? err.message : String(err));
        }
        io.stdout(`wrote ${rel}\n`);
      }
      return missing ? EXIT.notFound : EXIT.ok;
    }

    case 'categories': {
      const categories = await source.categories();
      io.stdout(flags.json ? json(categories) : categoryTable(categories));
      return EXIT.ok;
    }

    case 'category': {
      const slug = requireSlug(args[0], 'category');
      const limit = parseLimit(flags.limit, 200);
      const detail = await source.category(slug, limit);
      if (!detail) {
        throw new NotFoundError(`Category "${slug}" not found. Try: devicons categories`);
      }
      io.stdout(
        flags.json ? json(detail) : `${detail.label} (${detail.count} icons)\n${iconTable(detail.icons)}`,
      );
      return EXIT.ok;
    }

    case 'mcp': {
      if (!io.serveMcp) throw new UsageError('The MCP server is not available in this build');
      await io.serveMcp(() => createDeviconsServer(source, io.version));
      return EXIT.ok;
    }

    default:
      throw new UsageError(`Unknown command "${command}"`);
  }
}

export async function run(argv: string[], io: CliIO): Promise<number> {
  let parsed: ReturnType<typeof parseArgs<{ options: typeof OPTIONS; allowPositionals: true }>>;
  try {
    parsed = parseArgs({ args: argv, options: OPTIONS, allowPositionals: true, strict: true });
  } catch (err) {
    io.stderr(`devicons: ${err instanceof Error ? err.message : String(err)}\n\n${USAGE}`);
    return EXIT.usage;
  }

  const { values, positionals } = parsed;
  if (values.version) {
    io.stdout(`${io.version}\n`);
    return EXIT.ok;
  }
  if (values.help) {
    io.stdout(USAGE);
    return EXIT.ok;
  }
  const [command, ...args] = positionals;
  if (!command) {
    io.stderr(USAGE);
    return EXIT.usage;
  }

  let source: DataSource;
  try {
    const env = io.env ?? (typeof process !== 'undefined' ? process.env : {});
    source = io.source ?? createHttpSource({ baseUrl: values.api ?? env.DEVICONS_API });
  } catch (err) {
    if (!(err instanceof ApiRequestError)) throw err;
    io.stderr(`devicons: ${err.message}\n`);
    return EXIT.usage;
  }

  try {
    return await runCommand(command, args, values, io, source);
  } catch (err) {
    if (err instanceof UsageError) {
      io.stderr(`devicons: ${err.message}\n\n${USAGE}`);
      return EXIT.usage;
    }
    if (err instanceof NotFoundError) {
      io.stderr(`devicons: ${err.message}\n`);
      return EXIT.notFound;
    }
    if (err instanceof ApiRequestError) {
      io.stderr(`devicons: ${err.message}\n`);
      return err.status === 404 ? EXIT.notFound : EXIT.network;
    }
    if (err instanceof FsError) {
      io.stderr(`devicons: ${err.message}\n`);
      return EXIT.fs;
    }
    throw err;
  }
}
