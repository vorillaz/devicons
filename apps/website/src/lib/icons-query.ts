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

export async function getActiveIcons(): Promise<IconEntry[]> {
  const all = await getCollection('icons');
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

export async function getUniqueTags(): Promise<
  Array<{ tag: string; count: number }>
> {
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

export { slugifyTag, MIN_INDEXABLE_TAG_COUNT } from './tags';

const TAG_LABEL_OVERRIDES: Record<string, string> = {
  ui: 'UI',
  ai: 'AI',
  ml: 'ML',
  api: 'API',
  ios: 'iOS',
  macos: 'macOS',
  aws: 'AWS',
  gcp: 'GCP',
  cicd: 'CI/CD',
  devops: 'DevOps',
  jamstack: 'JAMstack',
  cms: 'CMS',
  css: 'CSS',
  html: 'HTML',
  sql: 'SQL',
  nosql: 'NoSQL',
};

export const formatTagLabel = (tag: string) => {
  const lower = tag.toLowerCase();
  if (TAG_LABEL_OVERRIDES[lower]) return TAG_LABEL_OVERRIDES[lower];
  return lower
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};
