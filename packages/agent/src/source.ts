// Where the MCP tools and CLI get their data. The CLI and the local stdio MCP
// server use the public HTTP API; the hosted MCP server (a Pages Function)
// provides its own DataSource over static assets.
import type * as z from 'zod/v4';
import {
  ApiErrorSchema,
  CategoryDetailSchema,
  CategorySchema,
  IconDetailSchema,
  SearchResultSchema,
  type Category,
  type CategoryDetail,
  type IconDetail,
  type SearchResult,
} from './schema.ts';

export const DEFAULT_BASE_URL = 'https://devicons.io';
const DEFAULT_TIMEOUT_MS = 10_000;

export interface SearchOptions {
  limit?: number;
  category?: string;
}

export interface DataSource {
  search(q: string, opts?: SearchOptions): Promise<SearchResult>;
  icon(slug: string): Promise<IconDetail | null>;
  categories(): Promise<Category[]>;
  category(slug: string, limit?: number): Promise<CategoryDetail | null>;
  svg(url: string): Promise<string>;
}

export type ApiRequestErrorKind = 'network' | 'http' | 'invalid';

export class ApiRequestError extends Error {
  readonly kind: ApiRequestErrorKind;
  readonly status?: number;

  constructor(kind: ApiRequestErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.kind = kind;
    this.status = status;
  }
}

/** Icon and category slugs: lowercase, no path separators, no `..`. */
export const isValidSlug = (slug: string) =>
  /^[a-z0-9][a-z0-9._-]*$/.test(slug) && !slug.includes('..');

const envBaseUrl = () =>
  typeof process !== 'undefined' ? process.env?.DEVICONS_API : undefined;

export interface HttpSourceOptions {
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
  timeoutMs?: number;
}

export function createHttpSource(opts: HttpSourceOptions = {}): DataSource {
  const base = new URL(opts.baseUrl ?? envBaseUrl() ?? DEFAULT_BASE_URL);
  const doFetch = opts.fetch ?? globalThis.fetch;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  async function request(url: URL): Promise<Response> {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(
          new ApiRequestError('network', `Request to ${url.origin} timed out after ${timeoutMs} ms`),
        );
      }, timeoutMs);
    });
    try {
      return await Promise.race([
        doFetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } }),
        timeout,
      ]);
    } catch (err) {
      if (err instanceof ApiRequestError) throw err;
      const reason = err instanceof Error ? err.message : String(err);
      throw new ApiRequestError('network', `Could not reach ${url.origin}: ${reason}`);
    } finally {
      clearTimeout(timer);
    }
  }

  async function errorMessage(res: Response, url: URL): Promise<string> {
    try {
      const body = ApiErrorSchema.safeParse(await res.json());
      if (body.success) return body.data.error.message;
    } catch {
      // Not a JSON error body; fall through to the generic message.
    }
    return `${url.pathname} returned HTTP ${res.status}`;
  }

  async function getJson<T>(path: string, schema: z.ZodType<T>): Promise<T | null> {
    const url = new URL(path, base);
    const res = await request(url);
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new ApiRequestError('http', await errorMessage(res, url), res.status);
    }
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      throw new ApiRequestError('invalid', `${url.pathname} did not return JSON`);
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new ApiRequestError('invalid', `${url.pathname} returned an unexpected shape`);
    }
    return parsed.data;
  }

  const required = <T>(value: T | null, path: string): T => {
    if (value === null) throw new ApiRequestError('http', `${path} was not found`, 404);
    return value;
  };

  return {
    async search(q, { limit, category } = {}) {
      const params = new URLSearchParams({ q });
      if (limit !== undefined) params.set('limit', String(limit));
      if (category) params.set('category', category);
      const path = `/api/v1/search?${params}`;
      return required(await getJson(path, SearchResultSchema), path);
    },
    async icon(slug) {
      if (!isValidSlug(slug)) return null;
      return getJson(`/api/v1/icons/${slug}.json`, IconDetailSchema);
    },
    async categories() {
      const path = '/api/v1/categories.json';
      return required(await getJson(path, CategorySchema.array()), path);
    },
    async category(slug, limit) {
      if (!isValidSlug(slug)) return null;
      const detail = await getJson(`/api/v1/categories/${slug}.json`, CategoryDetailSchema);
      if (!detail || limit === undefined) return detail;
      return { ...detail, icons: detail.icons.slice(0, limit) };
    },
    async svg(href) {
      const url = new URL(href, base);
      if (url.origin !== base.origin) {
        throw new ApiRequestError('invalid', `Refusing to fetch SVG from ${url.origin}`);
      }
      const res = await request(url);
      if (!res.ok) {
        throw new ApiRequestError('http', `${url.pathname} returned HTTP ${res.status}`, res.status);
      }
      return res.text();
    },
  };
}
