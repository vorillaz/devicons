import type { APIRoute } from 'astro';
import type { CollectionEntry } from 'astro:content';
import { markdownResponse } from '../../lib/agent-md/response';
import {
  buildDocMarkdown,
  getSortedDocPages,
} from '../../lib/agent-md/docs-md';

export const prerender = true;

export async function getStaticPaths() {
  const docs = await getSortedDocPages();
  return docs.map(entry => ({
    params: { slug: entry.id },
    props: { entry },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { entry } = props as { entry: CollectionEntry<'docs'> };
  return markdownResponse(await buildDocMarkdown(entry));
};
