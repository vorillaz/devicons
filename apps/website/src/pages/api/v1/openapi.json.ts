import type { APIRoute } from 'astro';
import { API_VERSION, jsonResponse } from '../../../lib/api/build';
import { buildOpenApi } from '../../../lib/api/openapi';

export const prerender = true;

export const GET: APIRoute = () => jsonResponse(buildOpenApi(API_VERSION));
