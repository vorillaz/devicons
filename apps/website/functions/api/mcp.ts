/**
 * Hosted Devicons MCP server: POST https://devicons.io/api/mcp
 *
 * Streamable HTTP, stateless, read-only. createMcpHandler serves both the
 * 2026-07-28 protocol and 2025-era clients and builds a fresh McpServer per
 * request, so no session or tool state carries over between requests.
 */
import { createMcpHandler, type McpHttpHandler } from '@modelcontextprotocol/server';
import { createDeviconsServer } from '@dev.icons/agent/server';
import { createAssetSource, type AssetFetcher } from '../../src/lib/edge/asset-source';
import { apiError, preflight, withApiHeaders } from '../../src/lib/edge/http';

const SERVER_VERSION = '1.0.0';

interface Context {
  request: Request;
  env: { ASSETS: AssetFetcher };
}

// The ASSETS binding is stable for the life of the isolate, so the handler
// is created once and reused.
let handler: McpHttpHandler | undefined;

const getHandler = (env: Context['env']) =>
  (handler ??= createMcpHandler(
    () => createDeviconsServer(createAssetSource(env.ASSETS), SERVER_VERSION),
    { legacy: 'stateless', responseMode: 'auto', maxRequestBodySize: 64 * 1024 },
  ));

export const onRequest = async ({ request, env }: Context): Promise<Response> => {
  if (request.method === 'OPTIONS') return preflight(request);

  // People opening the URL in a browser get a pointer to the setup docs
  // instead of a protocol error.
  const accept = request.headers.get('accept') ?? '';
  if (request.method === 'GET' && !accept.includes('text/event-stream')) {
    return apiError(
      405,
      'method_not_allowed',
      'This is an MCP endpoint: POST JSON-RPC to it from an MCP client. Setup: https://devicons.io/docs/mcp/',
      { Allow: 'POST, OPTIONS' },
    );
  }

  try {
    const res = await getHandler(env).fetch(request);
    return withApiHeaders(res);
  } catch (err) {
    console.error('mcp request failed', err);
    return apiError(500, 'internal', 'The MCP server hit an unexpected error.');
  }
};
