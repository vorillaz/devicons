/**
 * GET /api/v1/search?q=<query>&limit=<1-100>&category=<slug>
 *
 * Same ranking as the site search and the MCP `search_icons` tool. The index
 * is built once per isolate from /search-index.json.
 */
import { parseSearchParams } from '@dev.icons/agent/search';
import { createAssetSource, type AssetFetcher } from '../../../src/lib/edge/asset-source';
import { apiError, json, preflight } from '../../../src/lib/edge/http';

interface Context {
  request: Request;
  env: { ASSETS: AssetFetcher };
}

export const onRequestGet = async ({ request, env }: Context): Promise<Response> => {
  const url = new URL(request.url);
  const params = parseSearchParams(url.searchParams, 100, 20);
  if (!params.ok) return apiError(400, 'invalid_param', params.message);

  try {
    const source = createAssetSource(env.ASSETS, url.origin);
    const result = await source.search(params.q, {
      limit: params.limit,
      category: params.category,
    });
    return json(result, { headers: { 'Cache-Control': 'public, max-age=300' } });
  } catch (err) {
    console.error('search failed', err);
    return apiError(500, 'internal', 'Search is temporarily unavailable.');
  }
};

export const onRequestOptions = async (): Promise<Response> => preflight();
