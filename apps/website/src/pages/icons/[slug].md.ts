import type { APIRoute } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { getIcons } from '../../lib/icons-query';
import { markdownResponse } from '../../lib/agent-md/response';
import { buildIconMarkdown } from '../../lib/agent-md/icon-md';

export const prerender = true;

type IconEntry = CollectionEntry<'icons'>;
type PackEntry = CollectionEntry<'packs'>;

interface PageProps {
  entry: IconEntry;
  packs: { slug: string; title: string }[];
  prev: { slug: string; name: string } | null;
  next: { slug: string; name: string } | null;
}

export async function getStaticPaths() {
  const icons = await getIcons();
  const active: IconEntry[] = icons.filter(i => !i.data.deprecated);
  const sorted: IconEntry[] = [...active].sort((a, b) =>
    a.data.name.localeCompare(b.data.name, undefined, { sensitivity: 'base' }),
  );

  const packs: PackEntry[] = await getCollection('packs');
  const packsByIcon = new Map<string, { slug: string; title: string }[]>();
  for (const pack of packs) {
    for (const iconId of pack.data.iconIds) {
      const arr = packsByIcon.get(iconId) ?? [];
      arr.push({ slug: pack.id, title: pack.data.title });
      packsByIcon.set(iconId, arr);
    }
  }

  return sorted.map((entry, index) => {
    const prevEntry = sorted[index - 1];
    const nextEntry = sorted[index + 1];
    const props: PageProps = {
      entry,
      packs: packsByIcon.get(entry.id) ?? [],
      prev: prevEntry
        ? { slug: prevEntry.id, name: prevEntry.data.name }
        : null,
      next: nextEntry
        ? { slug: nextEntry.id, name: nextEntry.data.name }
        : null,
    };
    return {
      params: { slug: entry.id },
      props,
    };
  });
}

export const GET: APIRoute = async ({ props }) => {
  const { entry, packs, prev, next } = props as unknown as PageProps;
  const md = await buildIconMarkdown({ entry, packs, prev, next });
  return markdownResponse(md);
};
