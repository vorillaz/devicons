// Prebuilt MiniSearch index for the /api/v1/search Function: loading it is
// ~3x cheaper than indexing on every cold start, with identical ranking.
import type { APIRoute } from 'astro';
import { serializeSearchIndex } from '@dev.icons/agent/search';
import { jsonResponse } from '../../../lib/api/build';
import { getSearchIndexEntries } from '../../../lib/search-entries';

export const prerender = true;

export const GET: APIRoute = async () =>
  jsonResponse(serializeSearchIndex(await getSearchIndexEntries()));
