import type { APIRoute, GetStaticPaths } from 'astro';
import type { CollectionEntry } from 'astro:content';
import { getAllIcons, jsonResponse, toIconDetail } from '../../../../lib/api/build';

export const prerender = true;

export const getStaticPaths = (async () =>
  (await getAllIcons()).map(entry => ({
    params: { slug: entry.id },
    props: { entry },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
  jsonResponse(toIconDetail((props as { entry: CollectionEntry<'icons'> }).entry));
