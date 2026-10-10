// Build-time data for the sitemap integration in astro.config.mjs, which runs
// outside Astro's content layer. Reads icon frontmatter straight from disk;
// every icon file uses flow-style `icons: [...]` / `tags: [...]` arrays,
// sometimes spread over several lines.
import fs from 'node:fs';
import path from 'node:path';
import { MIN_INDEXABLE_TAG_COUNT, slugifyTag } from './tags';

const ICONS_DIR = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  '../content/icons',
);

const list = (frontmatter: string, key: string) => {
  const m = frontmatter.match(new RegExp(`^${key}:\\s*\\[([^\\]]*)\\]`, 'm'));
  if (!m) return [];
  return m[1]
    .split(',')
    .map(v => v.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
};

export function loadSitemapData(site: string) {
  const images = new Map<string, string[]>();
  const tagCounts = new Map<string, number>();
  const svg = (file: string) => new URL(`/devicons/icons/${file}.svg`, site).href;

  for (const file of fs.readdirSync(ICONS_DIR)) {
    if (!/\.mdx?$/.test(file)) continue;
    const src = fs.readFileSync(path.join(ICONS_DIR, file), 'utf8');
    const frontmatter = src.split(/^---\s*$/m)[1] ?? '';
    // The glob loader lowercases file names into entry ids.
    const id = file.replace(/\.mdx?$/, '').toLowerCase();
    const files = list(frontmatter, 'icons');
    const deprecated = /^deprecated:\s*true\s*$/m.test(frontmatter);

    if (files.length) images.set(`/icons/${id}/`, [svg(files[0])]);
    if (deprecated) continue;
    if (files.length > 1) images.set(`/icons/${id}/variants/`, files.map(svg));
    for (const tag of list(frontmatter, 'tags')) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  const thinTagPaths = new Set(
    [...tagCounts]
      .filter(([, count]) => count < MIN_INDEXABLE_TAG_COUNT)
      .map(([tag]) => `/icons/tag/${slugifyTag(tag)}/`),
  );

  return { images, thinTagPaths };
}
