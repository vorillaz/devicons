import type { APIRoute } from 'astro';
import { getIcons } from '../lib/icons-query';
import { COMPARISONS, compareSlug } from '../data/comparisons';
import { markdownResponse } from '../lib/agent-md/response';

export const prerender = true;

export const GET: APIRoute = async () => {
  const icons = await getIcons();
  const byId = new Map(icons.map(i => [i.id, i]));

  const resolved = COMPARISONS.flatMap(cmp => {
    const a = byId.get(cmp.a);
    const b = byId.get(cmp.b);
    if (!a || !b) return [];
    return [{ a, b, category: cmp.category }];
  });

  const grouped = resolved.reduce<Map<string, typeof resolved>>(
    (acc, pair) => {
      const list = acc.get(pair.category) ?? [];
      list.push(pair);
      acc.set(pair.category, list);
      return acc;
    },
    new Map(),
  );

  const md: string[] = [];
  md.push('[Home](/index.md) › Compare');
  md.push('');
  md.push('# Compare');
  md.push('');
  md.push(
    `${resolved.length} curated pairs of popular developer tools — frontend frameworks, databases, cloud providers, and more. Each page lines up both logos side-by-side.`,
  );
  md.push('');

  for (const [category, items] of grouped) {
    md.push(`## ${category}`);
    md.push('');
    for (const { a, b } of items) {
      md.push(
        `- [${a.data.name} vs ${b.data.name}](/compare/${compareSlug(a.id, b.id)}.md)`,
      );
    }
    md.push('');
  }

  md.push('[← Home](/index.md)');

  return markdownResponse(md.join('\n'));
};
