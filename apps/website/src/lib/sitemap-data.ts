// Build-time data for the sitemap integration in astro.config.mjs, which runs
// outside Astro's content layer. Reads icon frontmatter straight from disk;
// every icon file uses flow-style `icons: [...]` / `tags: [...]` arrays,
// sometimes spread over several lines.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { MIN_INDEXABLE_TAG_COUNT, canonicalTags, slugifyTag } from './tags';

const SRC_DIR = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ICONS_DIR = path.join(SRC_DIR, 'content/icons');

// Frameworks whose /icons/<slug>/<framework>/ pages are noindex (only the
// React page carries unique content); see [framework].astro.
const NOINDEX_FRAMEWORKS = ['vue', 'svelte', 'astro', 'font'];

// Last commit date per file under `dir`, from one `git log` walk (newest
// first, so the first date seen for a file wins). Returns an empty map when
// git or history is unavailable; lastmod is then simply omitted.
function lastCommitDates(dir: string): Map<string, string> {
  const dates = new Map<string, string>();
  try {
    const out = execFileSync(
      'git',
      ['log', '--format=@%cI', '--name-only', '--', dir],
      { cwd: dir, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
    );
    let current = '';
    for (const line of out.split('\n')) {
      if (line.startsWith('@')) current = line.slice(1);
      else if (line && current) {
        const base = path.basename(line);
        if (!dates.has(base)) dates.set(base, current);
      }
    }
  } catch {
    // Not a git checkout (or shallow without history): skip lastmod.
  }
  return dates;
}

const newest = (dates: Iterable<string>) =>
  [...dates].sort().at(-1);

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
  const excludedPaths = new Set<string>(['/search/']);
  const lastmod = new Map<string, string>();
  const iconDates = lastCommitDates(ICONS_DIR);
  const svg = (file: string) => new URL(`/devicons/icons/${file}.svg`, site).href;

  for (const file of fs.readdirSync(ICONS_DIR)) {
    if (!/\.mdx?$/.test(file)) continue;
    const src = fs.readFileSync(path.join(ICONS_DIR, file), 'utf8');
    const frontmatter = src.split(/^---\s*$/m)[1] ?? '';
    // The glob loader lowercases file names into entry ids.
    const id = file.replace(/\.mdx?$/, '').toLowerCase();
    const files = list(frontmatter, 'icons');
    const deprecated = /^deprecated:\s*true\s*$/m.test(frontmatter);
    const gated = /^(popular|recommended):\s*true\s*$/m.test(frontmatter);

    // Deprecated icon pages are noindex: keep them out of the sitemap.
    if (deprecated) {
      excludedPaths.add(`/icons/${id}/`);
      continue;
    }
    const date = iconDates.get(file);
    if (date) {
      for (const p of [`/icons/${id}/`, `/icons/${id}/variants/`, `/icons/${id}/react/`]) {
        lastmod.set(p, date);
      }
    }
    if (files.length) images.set(`/icons/${id}/`, [svg(files[0])]);
    if (files.length > 1) images.set(`/icons/${id}/variants/`, files.map(svg));
    if (gated) {
      for (const fw of NOINDEX_FRAMEWORKS) excludedPaths.add(`/icons/${id}/${fw}/`);
    }
    for (const tag of canonicalTags(list(frontmatter, 'tags'))) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  const thinTagPaths = new Set(
    [...tagCounts]
      .filter(([, count]) => count < MIN_INDEXABLE_TAG_COUNT)
      .map(([tag]) => `/icons/tag/${slugifyTag(tag)}/`),
  );

  for (const p of thinTagPaths) excludedPaths.add(p);

  // Docs and packs are content files too.
  for (const [section, dir] of [
    ['docs', 'content/docs'],
    ['packs', 'content/packs'],
  ] as const) {
    for (const [file, date] of lastCommitDates(path.join(SRC_DIR, dir))) {
      const id = file.replace(/\.mdx?$/, '');
      const p = section === 'docs' && id === 'introduction' ? '/docs/' : `/${section}/${id}/`;
      lastmod.set(p, date);
    }
  }
  // Listing pages change whenever an icon does.
  const latestIcon = newest(iconDates.values());
  const latestData = newest(lastCommitDates(path.join(SRC_DIR, 'data')).values());

  return {
    images,
    thinTagPaths,
    excludedPaths,
    lastmodFor(pathname: string): string | undefined {
      const exact = lastmod.get(pathname);
      if (exact) return exact;
      if (pathname.startsWith('/compare/') || pathname.startsWith('/use-cases/')) {
        return latestData ?? latestIcon;
      }
      if (
        pathname === '/' ||
        pathname.startsWith('/icons/') ||
        pathname.startsWith('/packs/')
      ) {
        return latestIcon;
      }
      return undefined;
    },
  };
}
