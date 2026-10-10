import type { CollectionEntry } from 'astro:content';
import { mdxToMd } from './mdx-to-md';

type PackEntry = CollectionEntry<'packs'>;

interface ResolvedIcon {
  slug: string;
  name: string;
  description?: string;
}

interface BuildArgs {
  pack: PackEntry;
  icons: ResolvedIcon[];
}

export function buildPackMarkdown({ pack, icons }: BuildArgs): string {
  const { data } = pack;
  const lines: string[] = [];

  lines.push(`[Home](/index.md) › [Packs](/packs.md) › ${data.title}`);
  lines.push('');
  lines.push(`# ${data.title}`);
  lines.push('', data.description);
  if (data.intro) lines.push('', data.intro);

  lines.push('', `## Icons in this pack (${icons.length})`, '');
  if (icons.length === 0) {
    lines.push('_This pack has no matching icons yet._');
  } else {
    for (const icon of icons) {
      const detail = icon.description
        ? ` — ${icon.description}`
        : '';
      lines.push(`- [${icon.name}](/icons/${icon.slug}.md)${detail}`);
    }
  }

  lines.push('', '## Use it', '');
  lines.push('```bash');
  lines.push('npm install @dev.icons/react  # or @dev.icons/vue, @dev.icons/svelte');
  lines.push('```');
  lines.push('');
  lines.push(
    'Each component is named after the icon file: split on `-`, PascalCase each part, and prefix `_` for the reserved names React, Vue, Svelte, and Astro (e.g. `langchain` → `Langchain`, `discord-icon` → `DiscordIcon`, `react` → `_React`). Each icon page lists its exact file names and component names. Monochrome variants live under the `/mono` subpath (e.g. `@dev.icons/react/mono`).',
  );

  const prose = mdxToMd(pack.body ?? '').trim();
  if (prose) lines.push('', prose);

  lines.push('', '[← All packs](/packs.md)');

  return lines.join('\n');
}
