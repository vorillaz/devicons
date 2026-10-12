import { getCollection, type CollectionEntry } from 'astro:content';

export type IconEntry = CollectionEntry<'icons'>;

export interface IconListItem {
  slug: string;
  name: string;
  iconFile: string;
  tags: string[];
  popular: boolean;
  recommended: boolean;
  mainColor?: string;
  badInDark: boolean;
  badInLight: boolean;
}

export const STICKY_TAGS = ['ai', 'llm', 'javascript'];

export const toListItem = (entry: IconEntry): IconListItem => ({
  slug: entry.id,
  name: entry.data.name,
  iconFile: entry.data.icons[0] ?? entry.id,
  tags: entry.data.tags,
  popular: entry.data.popular === true,
  recommended: entry.data.recommended === true,
  mainColor: entry.data.mainColor,
  badInDark: entry.data.badInDark === true,
  badInLight: entry.data.badInLight === true,
});

// getCollection() walks every entry's data on each call (to resolve image
// references), and pages call it several times each. Across ~3,600 static
// pages that was most of the build, so a production build reads the icons
// once. Dev keeps calling through so content edits show up without a restart.
// Callers get a fresh array but shared entries: treat entries as read-only.
let iconsCache: Promise<IconEntry[]> | undefined;

/** Every icon entry, deprecated ones included. */
export async function getIcons(): Promise<IconEntry[]> {
  if (!import.meta.env.PROD) return getCollection('icons');
  iconsCache ??= getCollection('icons');
  return [...(await iconsCache)];
}

export async function getActiveIcons(): Promise<IconEntry[]> {
  const all = await getIcons();
  return all.filter(icon => !icon.data.deprecated);
}

export async function getIconsSortedByName(): Promise<IconListItem[]> {
  const active = await getActiveIcons();
  return active
    .map(toListItem)
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    );
}

export async function getPopularIcons(): Promise<IconListItem[]> {
  const active = await getActiveIcons();
  return active
    .filter(icon => icon.data.popular)
    .map(toListItem)
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    );
}

type TagCount = { tag: string; count: number };
let uniqueTagsCache: Promise<TagCount[]> | undefined;

// Rendered in the footer of every page, so cached like getIcons().
export async function getUniqueTags(): Promise<TagCount[]> {
  if (!import.meta.env.PROD) return countTags();
  uniqueTagsCache ??= countTags();
  return [...(await uniqueTagsCache)];
}

async function countTags(): Promise<TagCount[]> {
  const active = await getActiveIcons();
  const counts = new Map<string, number>();
  for (const icon of active) {
    for (const tag of icon.data.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export async function getFooterTags(): Promise<
  Array<{ tag: string; count: number }>
> {
  const uniqueTags = await getUniqueTags();
  const tags = [
    ...(STICKY_TAGS.map(tag => ({
      tag,
      count: 1,
    })) as Array<{ tag: string; count: number }>),
    ...uniqueTags.filter(t => !STICKY_TAGS.includes(t.tag)),
  ];

  const topTags = tags.slice(0, 6);
  return topTags;
}

export { slugifyTag, formatTagLabel, MIN_INDEXABLE_TAG_COUNT } from './tags';
