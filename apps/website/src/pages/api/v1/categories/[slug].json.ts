import type { APIRoute, GetStaticPaths } from 'astro';
import { getCategoryPages, jsonResponse, toCategoryDetail } from '../../../../lib/api/build';
import type { TagPageData } from '../../../../lib/tag-pages';

export const prerender = true;

export const getStaticPaths = (async () =>
  (await getCategoryPages()).map(page => ({
    params: { slug: page.slug },
    props: { page },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
  jsonResponse(toCategoryDetail((props as { page: TagPageData }).page));
