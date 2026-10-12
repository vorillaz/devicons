import type { APIRoute } from 'astro';
import { getSearchIndexEntries } from '../lib/search-entries';

export const GET: APIRoute = async () =>
  new Response(JSON.stringify(await getSearchIndexEntries()), {
    headers: { 'Content-Type': 'application/json' },
  });
