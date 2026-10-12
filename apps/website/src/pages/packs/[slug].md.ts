import type { APIRoute } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { getIcons } from '../../lib/icons-query';
import { markdownResponse } from '../../lib/agent-md/response';
import { buildPackMarkdown } from '../../lib/agent-md/pack-md';

export const prerender = true;

type PackEntry = CollectionEntry<'packs'>;
type IconEntry = CollectionEntry<'icons'>;

interface PageProps {
  pack: PackEntry;
  icons: { slug: string; name: string; description?: string }[];
}

export async function getStaticPaths() {
  const packs: PackEntry[] = await getCollection('packs');
  const allIcons: IconEntry[] = await getIcons();
  const byId = new Map(allIcons.map(i => [i.id, i]));
  return packs.map(pack => {
    const resolved = pack.data.iconIds
      .map(id => byId.get(id))
      .filter((i): i is IconEntry => Boolean(i) && !i!.data.deprecated)
      .map(i => ({
        slug: i.id,
        name: i.data.name,
        description: i.data.description,
      }));
    const props: PageProps = { pack, icons: resolved };
    return { params: { slug: pack.id }, props };
  });
}

export const GET: APIRoute = async ({ props }) => {
  const { pack, icons } = props as unknown as PageProps;
  return markdownResponse(buildPackMarkdown({ pack, icons }));
};
