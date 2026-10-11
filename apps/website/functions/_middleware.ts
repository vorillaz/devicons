/**
 * Cloudflare Pages Function: global middleware
 *
 * Implements Markdown-for-Agents content negotiation. When a client sends
 * `Accept: text/markdown` (or prefers it over `text/html` via q-values), this
 * middleware rewrites the request to fetch the sibling `.md` asset that was
 * pre-rendered at build time by the Astro `.md.ts` endpoints:
 *
 *   GET /            Accept: text/markdown  →  serves /index.md
 *   GET /docs/cdn    Accept: text/markdown  →  serves /docs/cdn.md
 *   GET /icons/react Accept: text/markdown  →  serves /icons/react.md
 *
 * Browsers (which send `Accept: text/html,...`) always continue to receive
 * HTML. Paths without a `.md` counterpart fall back to HTML.
 */

import { TAG_ALIASES, slugifyTag } from '../src/lib/tags';

interface MiddlewareContext {
  request: Request;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
}

/**
 * Returns true if the client prefers `text/markdown` over `text/html`
 * per RFC 9110 q-value comparison. A catch-all Accept (browsers' `*` fallback)
 * does NOT trigger conversion — we don't want to break default browsing.
 */
function prefersMarkdown(accept: string | null): boolean {
  if (!accept) return false;
  let mdQ = -1;
  let htmlQ = -1;
  for (const raw of accept.split(',')) {
    const parts = raw.trim().split(';').map(s => s.trim());
    const type = parts[0]?.toLowerCase();
    if (!type) continue;
    let q = 1;
    for (let i = 1; i < parts.length; i++) {
      const m = parts[i].match(/^q=([0-9.]+)$/i);
      if (m) q = parseFloat(m[1]);
    }
    if (type === 'text/markdown' || type === 'text/x-markdown') {
      mdQ = Math.max(mdQ, q);
    } else if (type === 'text/html') {
      htmlQ = Math.max(htmlQ, q);
    }
  }
  return mdQ > 0 && mdQ >= htmlQ;
}

function resolveMarkdownPath(pathname: string): string | null {
  if (pathname === '/' || pathname === '') return '/index.md';
  // Already a .md URL — pass through.
  if (pathname.endsWith('.md')) return null;
  const trimmed = pathname.replace(/\/$/, '');
  // Skip /og/ (dynamic PNG endpoint) and /api/ style paths.
  if (trimmed.startsWith('/og/')) return null;
  // Skip paths that don't have MD counterparts — let them fall through.
  if (
    trimmed.startsWith('/icons/tag/') ||
    trimmed.startsWith('/icons/color/') ||
    trimmed === '/icons/popular'
  ) {
    return null;
  }
  return `${trimmed}.md`;
}

function approxTokens(text: string): number {
  return Math.max(1, Math.round(text.length / 4));
}

async function withMarkdownHeaders(
  res: Response,
  isHead: boolean,
): Promise<Response> {
  const body = await res.text();
  const headers = new Headers(res.headers);
  headers.set('Content-Type', 'text/markdown; charset=utf-8');
  headers.set('Vary', appendVary(headers.get('Vary'), 'Accept'));
  if (body) headers.set('x-markdown-tokens', String(approxTokens(body)));
  headers.delete('Content-Length');
  headers.delete('Content-Encoding');
  return new Response(isHead ? null : body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

function appendVary(existing: string | null, value: string): string {
  if (!existing) return value;
  const parts = existing.split(',').map(s => s.trim().toLowerCase());
  if (parts.includes(value.toLowerCase())) return existing;
  return `${existing}, ${value}`;
}

/**
 * Removed pages whose content still lives on a parent page. Only consulted
 * after a 404, so it never shadows a page that exists:
 *
 *   /icons/<slug>/variants/  →  /icons/<slug>/  (icon is down to one variant)
 *   /icons/tag/<alias>/      →  /icons/tag/<canonical>/  (see TAG_ALIASES)
 *   /icons/tag/<tag>/        →  /icons/<tag>/   (tag dropped, icon of that name)
 *
 * Generic rules instead of `_redirects` entries because the set changes
 * whenever icon variants or tags are edited.
 */
const TAG_ALIAS_SLUGS = new Map(
  Object.entries(TAG_ALIASES).map(([alias, tag]) => [
    slugifyTag(alias),
    slugifyTag(tag),
  ]),
);

function removedPageFallback(pathname: string): string | null {
  const variants = pathname.match(/^\/icons\/([^/]+)\/variants\/?$/);
  if (variants) return `/icons/${variants[1]}/`;
  const tag = pathname.match(/^\/icons\/tag\/([^/]+)\/?$/);
  if (tag) {
    const canonical = TAG_ALIAS_SLUGS.get(tag[1]);
    return canonical ? `/icons/tag/${canonical}/` : `/icons/${tag[1]}/`;
  }
  return null;
}

async function redirectRemovedPage(
  request: Request,
  next: MiddlewareContext['next'],
): Promise<Response | null> {
  const target = removedPageFallback(new URL(request.url).pathname);
  if (!target) return null;
  const targetUrl = new URL(target, request.url).toString();
  const check = await next(
    new Request(targetUrl, { method: 'HEAD', headers: request.headers }),
  );
  return check.ok ? Response.redirect(targetUrl, 301) : null;
}

export const onRequest = async (
  context: MiddlewareContext,
): Promise<Response> => {
  const { request, next } = context;

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return next();
  }

  const accept = request.headers.get('Accept');
  const wantsMd = prefersMarkdown(accept);

  if (!wantsMd) {
    // Still advertise that we can vary on Accept so intermediaries cache
    // HTML and MD separately once we do flip.
    const res = await next();
    if (res.status === 404) {
      const redirect = await redirectRemovedPage(request, next);
      if (redirect) return redirect;
    }
    const headers = new Headers(res.headers);
    headers.set('Vary', appendVary(headers.get('Vary'), 'Accept'));
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  }

  const url = new URL(request.url);
  const mdPath = resolveMarkdownPath(url.pathname);
  if (!mdPath) return next();

  const mdUrl = new URL(mdPath, url);
  const mdRequest = new Request(mdUrl.toString(), {
    method: request.method,
    headers: request.headers,
  });
  const mdResponse = await next(mdRequest);

  // If the .md variant doesn't exist (404), fall back to the HTML page so
  // agents still get *something* instead of a hard error.
  if (mdResponse.status === 404) {
    return next();
  }
  if (!mdResponse.ok) return mdResponse;

  return await withMarkdownHeaders(mdResponse, request.method === 'HEAD');
};
