// Icon search shared by the website search UI, the /api/v1/search Function,
// and the hosted MCP server, so every surface ranks results the same way.
import MiniSearch, { type AsPlainObject, type Options } from 'minisearch';
import type { IconSummary, SearchIndexEntry } from './schema.ts';

export const MAX_QUERY_LENGTH = 100;

export const SEARCH_OPTIONS = {
  idField: 'id',
  fields: ['name', 'tags', 'aliases', 'description'],
  storeFields: [],
  searchOptions: {
    boost: { name: 10, aliases: 8, tags: 5, description: 1 },
    fuzzy: 0.2,
    prefix: true,
  },
} satisfies Options<SearchIndexEntry>;

// Mirrors slugifyTag in apps/website/src/lib/tags.ts: `+` and `#` are spelled
// out so `c++` and `c#` don't collapse onto `c`.
export const slugifyTag = (tag: string) =>
  tag
    .toLowerCase()
    .replace(/\+/g, '-plus')
    .replace(/#/g, '-sharp')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export function buildSearchIndex(
  entries: SearchIndexEntry[],
): MiniSearch<SearchIndexEntry> {
  const index = new MiniSearch<SearchIndexEntry>(SEARCH_OPTIONS);
  index.addAll(entries);
  return index;
}

/** What search needs per icon once the index is built (no description). */
export type IndexedEntry = Omit<SearchIndexEntry, 'description'>;

export function toSummary(entry: IndexedEntry, site: string): IconSummary {
  return {
    slug: entry.id,
    name: entry.name,
    tags: entry.tags,
    popular: entry.popular,
    url: `${site}/icons/${entry.id}/`,
    svg: `${site}/devicons/icons/${entry.icons[0] ?? entry.id}.svg`,
  };
}

/**
 * Re-ranks MiniSearch hits the way people expect from a logo search: exact
 * name or slug first, then exact alias, then name/slug prefix, then the
 * fuzzy rest in relevance order. Ties inside a tier sort by name.
 */
export function rankByMatch<T extends Pick<SearchIndexEntry, 'id' | 'name' | 'aliases'>>(
  ranked: T[],
  query: string,
): T[] {
  const needle = query.trim().toLowerCase();
  const exact: T[] = [];
  const aliasExact: T[] = [];
  const startsWith: T[] = [];
  const rest: T[] = [];
  for (const item of ranked) {
    const name = item.name.toLowerCase();
    const id = item.id.toLowerCase();
    if (name === needle || id === needle) exact.push(item);
    else if (item.aliases?.some(a => a.toLowerCase() === needle)) aliasExact.push(item);
    else if (name.startsWith(needle) || id.startsWith(needle)) startsWith.push(item);
    else rest.push(item);
  }
  const byName = (a: T, b: T) => a.name.localeCompare(b.name);
  return [
    ...exact.sort(byName),
    ...aliasExact.sort(byName),
    ...startsWith.sort(byName),
    ...rest,
  ];
}

export function searchIcons(
  index: MiniSearch<SearchIndexEntry>,
  entries: Map<string, IndexedEntry>,
  q: string,
  opts: { limit: number; category?: string; site: string },
): { results: IconSummary[]; total: number } {
  const matches: IndexedEntry[] = [];
  for (const hit of index.search(q)) {
    const entry = entries.get(String(hit.id));
    if (!entry || entry.deprecated) continue;
    if (opts.category && !entry.tags.some(t => slugifyTag(t) === opts.category)) {
      continue;
    }
    matches.push(entry);
  }
  const results = rankByMatch(matches, q)
    .slice(0, opts.limit)
    .map(entry => toSummary(entry, opts.site));
  return { results, total: matches.length };
}

/**
 * Index built at deploy time and loaded by the search Function. Loading is
 * ~3x cheaper than re-indexing on every cold start, and ranking is identical
 * because the same documents and options produce it.
 */
export interface PrebuiltSearchIndex {
  version: 1;
  entries: IndexedEntry[];
  index: AsPlainObject;
}

export function serializeSearchIndex(entries: SearchIndexEntry[]): PrebuiltSearchIndex {
  return {
    version: 1,
    entries: entries.map(({ description: _drop, ...rest }) => rest),
    index: buildSearchIndex(entries).toJSON(),
  };
}

export function loadSearchIndex(prebuilt: PrebuiltSearchIndex): {
  index: MiniSearch<SearchIndexEntry>;
  byId: Map<string, IndexedEntry>;
} {
  return {
    index: MiniSearch.loadJS<SearchIndexEntry>(prebuilt.index, SEARCH_OPTIONS),
    byId: new Map(prebuilt.entries.map(e => [e.id, e])),
  };
}

export type ParsedSearchParams =
  | { ok: true; q: string; limit: number; category?: string }
  | { ok: false; message: string };

export function parseSearchParams(
  params: URLSearchParams,
  max: number,
  def: number,
): ParsedSearchParams {
  const q = (params.get('q') ?? '').trim();
  if (!q) return { ok: false, message: 'Query parameter `q` is required.' };
  if (q.length > MAX_QUERY_LENGTH) {
    return {
      ok: false,
      message: `Query parameter \`q\` must be at most ${MAX_QUERY_LENGTH} characters.`,
    };
  }

  let limit = def;
  const rawLimit = params.get('limit');
  if (rawLimit !== null) {
    limit = Number(rawLimit);
    if (!Number.isInteger(limit) || limit < 1 || limit > max) {
      return {
        ok: false,
        message: `Query parameter \`limit\` must be an integer from 1 to ${max}.`,
      };
    }
  }

  const category = params.get('category')?.trim().toLowerCase();
  return category ? { ok: true, q, limit, category } : { ok: true, q, limit };
}
