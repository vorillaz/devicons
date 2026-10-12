import type { APIRoute } from 'astro';
import { getIconList, jsonResponse } from '../../../lib/api/build';

export const prerender = true;

export const GET: APIRoute = async () => jsonResponse(await getIconList());
