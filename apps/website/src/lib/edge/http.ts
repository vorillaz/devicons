// Response helpers for the /api Pages Functions. Kept free of astro:content
// so the Functions bundle stays small.
import type { ApiErrorCode } from '@dev.icons/agent/schema';

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'content-type, accept, authorization, mcp-protocol-version, mcp-session-id, mcp-method, mcp-name, last-event-id',
  'Access-Control-Expose-Headers': 'mcp-session-id, mcp-protocol-version',
  'Access-Control-Max-Age': '86400',
} as const;

export const API_HEADERS = {
  ...CORS_HEADERS,
  'X-Robots-Tag': 'noindex',
} as const;

export const json = (data: unknown, init: { status?: number; headers?: HeadersInit } = {}) =>
  new Response(JSON.stringify(data), {
    status: init.status ?? 200,
    headers: {
      ...API_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
      ...Object.fromEntries(new Headers(init.headers)),
    },
  });

export const apiError = (status: number, code: ApiErrorCode, message: string) =>
  json({ error: { code, message } }, { status, headers: { 'Cache-Control': 'no-store' } });

// Echo the requested headers so newer MCP clients (e.g. Mcp-Param-* headers)
// pass preflight without this list having to track the spec.
export const preflight = (request?: Request) => {
  const requested = request?.headers.get('access-control-request-headers');
  return new Response(null, {
    status: 204,
    headers: requested
      ? { ...CORS_HEADERS, 'Access-Control-Allow-Headers': requested }
      : CORS_HEADERS,
  });
};

/** Returns `res` with the API headers added (streaming bodies pass through). */
export function withApiHeaders(res: Response): Response {
  const headers = new Headers(res.headers);
  for (const [key, value] of Object.entries(API_HEADERS)) headers.set(key, value);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}
