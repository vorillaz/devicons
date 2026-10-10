import type { APIRoute } from 'astro';
import {
  getUniqueTags,
  slugifyTag,
  formatTagLabel,
} from '../../lib/icons-query';

// Lookup table for the edge OG renderer at
// functions/og/icons/tag/[tag].png.ts — keeps tag labels and counts derived
// from the content collection at build time, so the Function never has to
// re-implement the tag rules.
export const GET: APIRoute = async () => {
  const tags = await getUniqueTags();
  const table = Object.fromEntries(
    tags.map(({ tag, count }) => [
      slugifyTag(tag),
      { label: formatTagLabel(tag), count },
    ]),
  );

  return new Response(JSON.stringify(table), {
    headers: { 'Content-Type': 'application/json' },
  });
};
