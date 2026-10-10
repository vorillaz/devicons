/**
 * Cloudflare Pages Function: /og/icons/tag/<tag>.png
 *
 * Renders tag OG cards on demand instead of prerendering 1,000+ PNGs during
 * the Astro build. Labels and counts come from /og/tags.json, which the build
 * emits from the same content-collection helpers the tag pages use.
 */

import { ogShell } from '../../../../src/lib/og/layout';
import {
  ogErrorResponse,
  ogPngResponse,
  renderOgPng,
} from '../../../../src/lib/og/edge';

type TagTable = Record<string, { label: string; count: number }>;

// Module scope — reused across requests on the same isolate.
let tagsCache: TagTable | null = null;

async function loadTags(origin: string) {
  if (tagsCache) return tagsCache;
  const res = await fetch(`${origin}/og/tags.json`);
  if (!res.ok) throw new Error(`tags.json fetch failed (${res.status})`);
  tagsCache = (await res.json()) as TagTable;
  return tagsCache;
}

interface PagesContext {
  request: Request;
  params: { tag?: string };
}

export const onRequestGet = async (context: PagesContext): Promise<Response> => {
  const slug = context.params.tag;
  if (!slug) {
    return new Response('Not found', { status: 404 });
  }

  const origin = new URL(context.request.url).origin;

  try {
    const entry = (await loadTags(origin))[slug];
    if (!entry) {
      return new Response('Not found', { status: 404 });
    }

    const { label, count } = entry;
    const png = await renderOgPng(
      ogShell({
        eyebrow: 'devicons.io / tags',
        category: `${label} · ${count} icons`,
        title: `${label} icons`,
        description: `Browse ${count} free ${label.toLowerCase()} icons and logos. Optimized SVGs plus React, Vue, and Svelte components — MIT licensed.`,
      }),
      origin,
    );
    // Counts change as icons land, so let the edge refresh daily.
    return ogPngResponse(png, 86400);
  } catch (err) {
    return ogErrorResponse(err);
  }
};
