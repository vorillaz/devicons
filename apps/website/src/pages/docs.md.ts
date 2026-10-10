import type { APIRoute } from 'astro';
import { markdownResponse } from '../lib/agent-md/response';
import { buildDocsIndexMarkdown } from '../lib/agent-md/docs-md';

export const prerender = true;

export const GET: APIRoute = async () => {
  const md = await buildDocsIndexMarkdown();
  if (!md) return new Response('Not found', { status: 404 });
  return markdownResponse(md);
};
