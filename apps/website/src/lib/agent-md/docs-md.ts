import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { mdxToMd } from './mdx-to-md';

type DocEntry = CollectionEntry<'docs'>;

const INDEX_ID = 'introduction';

/** Docs sorted by category order → category name → order (introduction excluded). */
export async function getSortedDocPages(): Promise<DocEntry[]> {
  const all = await getCollection('docs');
  return all
    .filter(e => e.id !== INDEX_ID)
    .sort((a, b) => {
      const catDelta = a.data.categoryOrder - b.data.categoryOrder;
      if (catDelta !== 0) return catDelta;
      if (a.data.category !== b.data.category)
        return a.data.category.localeCompare(b.data.category);
      return a.data.order - b.data.order;
    });
}

/** Markdown for /docs.md — the introduction plus a table of contents. */
export async function buildDocsIndexMarkdown(): Promise<string | null> {
  const intro = await getEntry('docs', INDEX_ID);
  if (!intro) return null;

  const sorted = await getSortedDocPages();
  const byCategory = new Map<string, DocEntry[]>();
  for (const entry of sorted) {
    const arr = byCategory.get(entry.data.category) ?? [];
    arr.push(entry);
    byCategory.set(entry.data.category, arr);
  }

  const md: string[] = [];
  md.push('[Home](/index.md) › Docs');
  md.push('');
  md.push(`# ${intro.data.title}`);
  if (intro.data.description) md.push('', intro.data.description);
  md.push('');

  const body = mdxToMd(intro.body ?? '');
  if (body.trim()) md.push(body.trim());

  md.push('', '## Contents', '');
  for (const [category, entries] of byCategory) {
    md.push(`### ${category}`);
    md.push('');
    for (const entry of entries) {
      const badge = entry.data.badge ? ` _(${entry.data.badge})_` : '';
      const desc = entry.data.description ? ` — ${entry.data.description}` : '';
      md.push(`- [${entry.data.title}](/docs/${entry.id}.md)${badge}${desc}`);
    }
    md.push('');
  }

  md.push('[← Home](/index.md)');
  return md.join('\n');
}

/** Markdown for /docs/<id>.md. */
export async function buildDocMarkdown(entry: DocEntry): Promise<string> {
  const body = mdxToMd(entry.body ?? '');

  const sorted = await getSortedDocPages();
  const idx = sorted.findIndex(e => e.id === entry.id);
  const prev = idx > 0 ? sorted[idx - 1] : null;
  const next = idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null;

  const md: string[] = [];
  md.push(
    `[Home](/index.md) › [Docs](/docs.md) › ${entry.data.category} › ${entry.data.title}`,
  );
  md.push('');
  md.push(`# ${entry.data.title}`);
  if (entry.data.badge) md.push('', `_${entry.data.badge}_`);
  if (entry.data.description) md.push('', entry.data.description);
  md.push('');
  if (body.trim()) md.push(body.trim());

  if (prev || next) {
    md.push('', '---', '');
    if (prev) md.push(`← Previous: [${prev.data.title}](/docs/${prev.id}.md)`);
    if (next) md.push(`→ Next: [${next.data.title}](/docs/${next.id}.md)`);
  }

  md.push('', '[← All docs](/docs.md)');
  return md.join('\n');
}
