import type { CollectionEntry } from 'astro:content';
import { getIcons } from './icons-query';

type IconEntry = CollectionEntry<'icons'>;

export interface RelatedIcon {
  slug: string;
  name: string;
  iconFile: string;
  score: number;
  badInDark: boolean;
  badInLight: boolean;
  recommended: boolean;
}

export async function getRelatedIcons(
  currentSlug: string,
  tags: string[] | undefined,
  limit = 8,
): Promise<RelatedIcon[]> {
  if (!tags || tags.length === 0) return [];
  const tagSet = new Set(tags);
  // Brand family prefix: aws-s3 → aws, google-cloud → google.
  const head = currentSlug.split('-')[0];
  const family = head.length >= 3 ? head : null;
  const all = await getIcons();
  const scored: RelatedIcon[] = [];
  for (const entry of all) {
    if (entry.id === currentSlug) continue;
    if (entry.data.deprecated) continue;
    const overlap = entry.data.tags.filter((t) => tagSet.has(t)).length;
    if (overlap === 0) continue;
    scored.push({
      slug: entry.id,
      name: entry.data.name,
      iconFile: entry.data.icons[0] ?? entry.id,
      // Shared tags drive relevance; the same family (aws-s3 → aws-*) is a
      // strong signal; popular/recommended only break ties.
      score:
        overlap +
        (family && (entry.id === family || entry.id.startsWith(`${family}-`)) ? 2 : 0) +
        (entry.data.recommended ? 0.2 : 0) +
        (entry.data.popular ? 0.1 : 0),
      badInDark: entry.data.badInDark === true,
      badInLight: entry.data.badInLight === true,
      recommended: entry.data.recommended === true,
    });
  }
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.name.localeCompare(b.name);
  });
  return scored.slice(0, limit);
}
