// Data for /icons/tag/<tag>/ pages and the /icons/tag/ index. Everything here
// is derived from icon frontmatter, so a tag page links to what its icons are
// actually related to rather than the same site-wide list on every page.
import { getCollection } from 'astro:content';
import { COMPARISONS, compareSlug } from '../data/comparisons';
import { TAG_CONTENT } from '../data/tag-content';
import { USE_CASES } from '../data/use-cases';
import {
  getActiveIcons,
  getUniqueTags,
  toListItem,
  type IconListItem,
} from './icons-query';
import { MIN_INDEXABLE_TAG_COUNT, formatTagLabel, slugifyTag } from './tags';

export interface TagLink {
  tag: string;
  slug: string;
  label: string;
  count: number;
}

export interface TagPageData {
  tag: string;
  slug: string;
  label: string;
  count: number;
  indexable: boolean;
  icons: IconListItem[];
  relatedTags: TagLink[];
  comparisons: Array<{ slug: string; a: string; b: string }>;
  packs: Array<{ id: string; title: string; overlap: number }>;
  useCases: Array<{ slug: string; title: string }>;
}

// Recommended and popular icons lead, so the first row (and the first images
// Google sees) are the brands people search for. Alphabetical after that.
const byProminence = (a: IconListItem, b: IconListItem) => {
  const score = (x: IconListItem) =>
    (x.recommended ? 2 : 0) + (x.popular ? 1 : 0);
  return (
    score(b) - score(a) ||
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );
};

const RELATED_TAG_LIMIT = 12;
const PACK_MIN_OVERLAP = 3;

export const toTagLink = ({ tag, count }: { tag: string; count: number }) => ({
  tag,
  slug: slugifyTag(tag),
  label: formatTagLabel(tag),
  count,
});

/** Tags with enough icons to get an indexable page, largest first. */
export async function getIndexableTags(): Promise<TagLink[]> {
  return (await getUniqueTags())
    .filter(t => t.count >= MIN_INDEXABLE_TAG_COUNT)
    .map(toTagLink);
}

export async function getTagPages(): Promise<TagPageData[]> {
  const [tags, icons, packs] = await Promise.all([
    getUniqueTags(),
    getActiveIcons(),
    getCollection('packs'),
  ]);
  const items = icons.map(toListItem);
  const countByTag = new Map(tags.map(t => [t.tag, t.count]));
  const membersByTag = new Map<string, Set<string>>();
  for (const icon of items) {
    for (const tag of icon.tags) {
      if (!membersByTag.has(tag)) membersByTag.set(tag, new Set());
      membersByTag.get(tag)!.add(icon.slug);
    }
  }

  return tags.map(({ tag, count }) => {
    const members = membersByTag.get(tag)!;
    // Curated lead icons (TAG_CONTENT) first, in their listed order.
    const featured = TAG_CONTENT[tag]?.featured ?? [];
    const rank = (i: IconListItem) => {
      const at = featured.indexOf(i.slug);
      return at === -1 ? featured.length : at;
    };
    const tagIcons = items
      .filter(i => members.has(i.slug))
      .sort((a, b) => rank(a) - rank(b) || byProminence(a, b));

    // Related tags by co-occurrence, damped by tag size so broad tags like
    // "open-source" don't top every list. Only indexable tags are linked.
    const coCounts = new Map<string, number>();
    for (const icon of tagIcons) {
      for (const other of icon.tags) {
        if (other === tag) continue;
        coCounts.set(other, (coCounts.get(other) ?? 0) + 1);
      }
    }
    const relatedTags = [...coCounts]
      .filter(([other]) => countByTag.get(other)! >= MIN_INDEXABLE_TAG_COUNT)
      .map(([other, co]) => ({
        other,
        score: co / Math.sqrt(countByTag.get(other)!),
      }))
      .sort((a, b) => b.score - a.score || a.other.localeCompare(b.other))
      .slice(0, RELATED_TAG_LIMIT)
      .map(({ other }) => toTagLink({ tag: other, count: countByTag.get(other)! }));

    const comparisons = COMPARISONS.filter(
      c => members.has(c.a) && members.has(c.b),
    ).map(c => {
      const name = (id: string) => tagIcons.find(i => i.slug === id)!.name;
      return { slug: compareSlug(c.a, c.b), a: name(c.a), b: name(c.b) };
    });

    const tagPacks = packs
      .map(p => ({
        id: p.id,
        title: p.data.title,
        overlap: p.data.iconIds.filter(id => members.has(id)).length,
      }))
      .filter(p => p.overlap >= PACK_MIN_OVERLAP)
      .sort((a, b) => b.overlap - a.overlap);

    const useCases = USE_CASES.filter(u => u.tagMatches.includes(tag)).map(
      u => ({ slug: u.slug, title: u.title }),
    );

    return {
      tag,
      slug: slugifyTag(tag),
      label: formatTagLabel(tag),
      count,
      indexable: count >= MIN_INDEXABLE_TAG_COUNT,
      icons: tagIcons,
      relatedTags,
      comparisons,
      packs: tagPacks,
      useCases,
    };
  });
}
