// Builds the /api/v1 payloads from the content collections. Shapes are the
// zod schemas in @dev.icons/agent/schema; scripts/check-api.ts validates the
// built files against them.
import { getCollection, type CollectionEntry } from 'astro:content';
import type {
  Category,
  CategoryDetail,
  ComponentRef,
  IconDetail,
  IconList,
  IconSummary,
} from '@dev.icons/agent/schema';
import { SITE_URL } from '../../consts';
import { toComponentName } from '../component-name';
import { getIndexableTags, getTagPages, type TagPageData } from '../tag-pages';
import { variantLabel } from '../variant-label';
import type { IconListItem } from '../icons-query';

type IconEntry = CollectionEntry<'icons'>;

export const API_VERSION = '1.0.0';

const colorSvg = (file: string) => `${SITE_URL}/devicons/icons/${file}.svg`;
const monoSvg = (file: string) => `${SITE_URL}/devicons/font/${file}.svg`;
const pageUrl = (slug: string) => `${SITE_URL}/icons/${slug}/`;
const categoryUrl = (slug: string) => `${SITE_URL}/icons/tag/${slug}/`;

const primaryFile = (entry: IconEntry) => entry.data.icons[0] ?? entry.id;

export function toIconSummary(entry: IconEntry): IconSummary {
  return {
    slug: entry.id,
    name: entry.data.name,
    tags: entry.data.tags,
    popular: entry.data.popular === true,
    url: pageUrl(entry.id),
    svg: colorSvg(primaryFile(entry)),
  };
}

const listItemSummary = (item: IconListItem): IconSummary => ({
  slug: item.slug,
  name: item.name,
  tags: item.tags,
  popular: item.popular,
  url: pageUrl(item.slug),
  svg: colorSvg(item.iconFile),
});

const component = (framework: 'react' | 'vue' | 'svelte', file: string): ComponentRef => ({
  package: `@dev.icons/${framework}`,
  mono: `@dev.icons/${framework}/mono`,
  name: toComponentName(file),
});

export function toIconDetail(entry: IconEntry): IconDetail {
  const { data } = entry;
  const file = primaryFile(entry);
  return {
    ...toIconSummary(entry),
    description: data.description ?? null,
    aliases: data.aliases ?? [],
    website: data.website ?? null,
    license: data.license ?? null,
    brandGuidelines: data.brandGuidelines ?? null,
    mainColor: data.mainColor ?? null,
    badInDark: data.badInDark === true,
    badInLight: data.badInLight === true,
    deprecated: data.deprecated === true,
    recommended: data.recommended === true,
    variants: data.icons.map(f => ({
      file: f,
      label: variantLabel(entry.id, f, data.icons),
      svg: colorSvg(f),
      mono: monoSvg(f),
    })),
    components: {
      react: component('react', file),
      vue: component('vue', file),
      svelte: component('svelte', file),
    },
  };
}

const byName = (a: IconEntry, b: IconEntry) =>
  a.data.name.localeCompare(b.data.name, undefined, { sensitivity: 'base' });

/** All icons, deprecated included: their detail files keep old links working. */
export async function getAllIcons(): Promise<IconEntry[]> {
  return (await getCollection('icons')).sort(byName);
}

export async function getIconList(): Promise<IconList> {
  const icons = (await getAllIcons()).filter(i => !i.data.deprecated).map(toIconSummary);
  return { count: icons.length, icons };
}

export async function getCategoryList(): Promise<Category[]> {
  return (await getIndexableTags()).map(t => ({
    slug: t.slug,
    label: t.label,
    count: t.count,
    url: categoryUrl(t.slug),
  }));
}

/** Indexable categories only, matching /api/v1/categories.json. */
export async function getCategoryPages(): Promise<TagPageData[]> {
  return (await getTagPages()).filter(p => p.indexable);
}

export function toCategoryDetail(page: TagPageData): CategoryDetail {
  return {
    slug: page.slug,
    label: page.label,
    count: page.count,
    url: categoryUrl(page.slug),
    icons: page.icons.map(listItemSummary),
  };
}

export const jsonResponse = (data: unknown) =>
  new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
