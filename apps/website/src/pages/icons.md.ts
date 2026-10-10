import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { markdownResponse } from '../lib/agent-md/response';
import { formatTagLabel, slugifyTag } from '../lib/icons-query';
import { formatCount } from '../lib/package-facts';

export const prerender = true;

export const GET: APIRoute = async () => {
  const icons = await getCollection('icons');
  const active = icons.filter(i => !i.data.deprecated);

  const popular = active
    .filter(i => i.data.popular)
    .sort((a, b) => a.data.name.localeCompare(b.data.name));
  const recommended = active
    .filter(i => i.data.recommended)
    .sort((a, b) => a.data.name.localeCompare(b.data.name));

  // Tag histogram
  const tagCounts = new Map<string, number>();
  for (const i of active) {
    for (const t of i.data.tags) {
      tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    }
  }
  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 30);

  const packs = await getCollection('packs');

  const md: string[] = [];
  md.push('[Home](/index.md) › Icons');
  md.push('');
  md.push('# Icons catalog');
  md.push('');
  md.push(
    `The Devicons catalog has ${formatCount(active.length)} developer, brand, framework, and tooling logos. Every icon has a stable slug and a matching Markdown page at \`/icons/<slug>.md\`.`,
  );
  md.push('');
  md.push('## Full list as JSON');
  md.push('');
  md.push(
    '- [/search-index.json](/search-index.json) — one record per icon entry: `{ id, name, description, icons, tags, deprecated, popular, badInDark, badInLight, version?, aliases? }`. `id` is the slug; `icons` lists the file names used for components and SVG URLs. Includes deprecated entries (`deprecated: true`). Fetch once, search locally.',
  );

  md.push('', '## Popular', '');
  for (const i of popular.slice(0, 40)) {
    md.push(`- [${i.data.name}](/icons/${i.id}.md)`);
  }
  if (popular.length > 40) {
    md.push(`- …and ${popular.length - 40} more popular icons in the JSON index`);
  }

  if (recommended.length) {
    md.push('', '## Recommended', '');
    for (const i of recommended.slice(0, 40)) {
      md.push(`- [${i.data.name}](/icons/${i.id}.md)`);
    }
  }

  md.push('', '## Browse by tag', '');
  for (const [tag, count] of topTags) {
    md.push(
      `- [${formatTagLabel(tag)}](/icons/tag/${slugifyTag(tag)}/) — ${count} icon${count === 1 ? '' : 's'}`,
    );
  }

  md.push('', '## Curated packs', '');
  for (const p of packs) {
    md.push(`- [${p.data.title}](/packs/${p.id}.md) — ${p.data.description}`);
  }

  md.push('', '[← Home](/index.md)');

  return markdownResponse(md.join('\n'));
};
