// DataSource for code running inside the Pages project (search Function,
// hosted MCP): reads the prebuilt /api/v1 JSON and SVGs through the ASSETS
// binding, an in-process call, and searches /search-index.json in memory.
import type MiniSearch from 'minisearch';
import type {
  Category,
  CategoryDetail,
  IconDetail,
  SearchIndexEntry,
} from '@dev.icons/agent/schema';
import { buildSearchIndex, searchIcons } from '@dev.icons/agent/search';
import {
  ApiRequestError,
  DEFAULT_BASE_URL,
  isValidSlug,
  type DataSource,
} from '@dev.icons/agent/source';

export interface AssetFetcher {
  fetch(input: Request | string): Promise<Response>;
}

interface SearchState {
  index: MiniSearch<SearchIndexEntry>;
  byId: Map<string, SearchIndexEntry>;
}

// One index per isolate: built on first search, reused until the isolate is
// recycled (a new deploy always gets a new isolate).
let searchState: Promise<SearchState> | undefined;

export function createAssetSource(assets: AssetFetcher, origin: string): DataSource {
  const get = (pathname: string) => assets.fetch(new Request(new URL(pathname, origin)));

  async function getJson<T>(pathname: string): Promise<T | null> {
    const res = await get(pathname);
    if (res.status === 404) return null;
    if (!res.ok) throw new ApiRequestError('http', `${pathname} returned HTTP ${res.status}`, res.status);
    return (await res.json()) as T;
  }

  function loadSearch(): Promise<SearchState> {
    searchState ??= (async () => {
      const entries = await getJson<SearchIndexEntry[]>('/search-index.json');
      if (!entries) throw new ApiRequestError('http', 'search index missing', 500);
      return { index: buildSearchIndex(entries), byId: new Map(entries.map(e => [e.id, e])) };
    })();
    // Don't cache a failure: the next request retries.
    searchState.catch(() => {
      searchState = undefined;
    });
    return searchState;
  }

  return {
    async search(q, { limit = 20, category } = {}) {
      const { index, byId } = await loadSearch();
      const results = searchIcons(index, byId, q, { limit, category, site: DEFAULT_BASE_URL });
      return { query: q, count: results.length, results };
    },
    async icon(slug) {
      if (!isValidSlug(slug)) return null;
      return getJson<IconDetail>(`/api/v1/icons/${slug}.json`);
    },
    async categories() {
      return (await getJson<Category[]>('/api/v1/categories.json')) ?? [];
    },
    async category(slug, limit) {
      if (!isValidSlug(slug)) return null;
      const detail = await getJson<CategoryDetail>(`/api/v1/categories/${slug}.json`);
      if (!detail || limit === undefined) return detail;
      return { ...detail, icons: detail.icons.slice(0, limit) };
    },
    async svg(href) {
      // Payload URLs are absolute production URLs; serve them from this
      // deployment's assets so previews and local dev stay self-contained.
      const url = new URL(href, origin);
      const allowed = url.origin === origin || url.origin === DEFAULT_BASE_URL;
      if (!allowed || !url.pathname.startsWith('/devicons/')) {
        throw new ApiRequestError('invalid', `Refusing to fetch SVG from ${url.href}`);
      }
      const res = await get(url.pathname);
      if (!res.ok) throw new ApiRequestError('http', `${url.pathname} returned HTTP ${res.status}`, res.status);
      return res.text();
    },
  };
}
