import type { APIRoute } from 'astro';
import type { CollectionEntry } from 'astro:content';
import { getIcons } from '../../lib/icons-query';
import { COMPARISONS, compareSlug } from '../../data/comparisons';
import { markdownResponse } from '../../lib/agent-md/response';

export const prerender = true;

type IconEntry = CollectionEntry<'icons'>;

interface PageProps {
  a: IconEntry;
  b: IconEntry;
  category: string;
}

export async function getStaticPaths() {
  const icons = await getIcons();
  const byId = new Map(icons.map(i => [i.id, i]));
  return COMPARISONS.flatMap(cmp => {
    const a = byId.get(cmp.a);
    const b = byId.get(cmp.b);
    if (!a || !b) return [];
    const props: PageProps = { a, b, category: cmp.category };
    return [{ params: { slug: compareSlug(cmp.a, cmp.b) }, props }];
  });
}

function card(entry: IconEntry): string[] {
  const { data, id } = entry;
  const lines: string[] = [];
  lines.push(`## ${data.name}`);
  if (data.description) lines.push('', data.description);
  const meta: string[] = [];
  if (data.tags?.length) meta.push(`- **Tags**: ${data.tags.join(', ')}`);
  if (data.website) meta.push(`- **Website**: ${data.website}`);
  if (data.license) meta.push(`- **License**: ${data.license}`);
  if (data.aliases?.length)
    meta.push(`- **Also known as**: ${data.aliases.join(', ')}`);
  if (meta.length) lines.push('', ...meta);
  lines.push('', `[Full page: ${data.name}](/icons/${id}.md)`);
  return lines;
}

export const GET: APIRoute = async ({ props }) => {
  const { a, b, category } = props as unknown as PageProps;
  const title = `${a.data.name} vs ${b.data.name}`;

  const md: string[] = [];
  md.push(`[Home](/index.md) › Compare › ${title}`);
  md.push('');
  md.push(`# ${title}`);
  md.push(
    '',
    `Two popular ${category} options side-by-side. Grab either logo for stack diagrams, comparison pages, or docs.`,
  );
  md.push('');
  md.push(...card(a));
  md.push('');
  md.push(...card(b));
  md.push('', '## See also', '');
  md.push('- [All icons](/icons.md)');
  md.push('- [Packs](/packs.md)');

  return markdownResponse(md.join('\n'));
};
