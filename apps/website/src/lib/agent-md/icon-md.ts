import type { CollectionEntry } from 'astro:content';
import { formatTagLabel, slugifyTag } from '../icons-query';
import { getRelatedIcons } from '../related-icons';
import {
  FONT_PKG,
  monoSvgUrl,
  svgUrl,
  toComponentName,
} from '../package-facts';
import { mdxToMd } from './mdx-to-md';

type IconEntry = CollectionEntry<'icons'>;

interface PackRef {
  slug: string;
  title: string;
}

interface BuildArgs {
  entry: IconEntry;
  packs: PackRef[];
  prev?: { slug: string; name: string } | null;
  next?: { slug: string; name: string } | null;
}

export async function buildIconMarkdown({
  entry,
  packs,
  prev,
  next,
}: BuildArgs): Promise<string> {
  const { id: slug, data } = entry;
  const name = data.name;
  const files = data.icons.length ? data.icons : [slug];
  const primaryFile = files[0];
  const tags = data.tags ?? [];
  const related = await getRelatedIcons(slug, tags, 8);
  const cmpName = toComponentName(primaryFile);
  // Vue/Svelte templates can't parse tags starting with `_`; alias on import.
  const tplName = cmpName.startsWith('_') ? `${cmpName.slice(1)}Logo` : cmpName;
  const tplImport =
    tplName === cmpName ? cmpName : `${cmpName} as ${tplName}`;

  const lines: string[] = [];

  // Breadcrumb
  lines.push(`[Home](/index.md) › [Icons](/icons.md) › ${name}`);
  lines.push('');

  // Title + description
  lines.push(`# ${name}`);
  if (data.description) lines.push('', data.description);

  // At-a-glance metadata
  const meta: string[] = [];
  meta.push(`- **Page**: https://devicons.io/icons/${slug}/`);
  if (data.website) meta.push(`- **Website**: ${data.website}`);
  if (data.license) meta.push(`- **License**: ${data.license}`);
  if (data.brandGuidelines)
    meta.push(`- **Brand guidelines**: ${data.brandGuidelines}`);
  if (data.aliases?.length)
    meta.push(`- **Also known as**: ${data.aliases.join(', ')}`);
  if (tags.length) {
    const tagLinks = tags
      .map(t => `[${formatTagLabel(t)}](/icons/tag/${slugifyTag(t)}/)`)
      .join(', ');
    meta.push(`- **Tags**: ${tagLinks}`);
  }
  if (data.mainColor) meta.push(`- **Primary color**: \`${data.mainColor}\``);
  if (data.version) meta.push(`- **Version added**: ${data.version}`);
  if (data.badInDark)
    meta.push('- **Contrast**: needs a light backdrop on dark backgrounds');
  if (data.badInLight)
    meta.push('- **Contrast**: needs a dark backdrop on light backgrounds');
  if (meta.length) {
    lines.push('', '## At a glance', '', ...meta);
  }

  // Variants / files
  lines.push('', '## Files');
  lines.push('');
  lines.push(
    'Each file is one variant of this logo. The component name is derived from the file name.',
  );
  lines.push('');
  lines.push('| File | Component | Color SVG | Monochrome SVG | Font class |');
  lines.push('| --- | --- | --- | --- | --- |');
  for (const file of files) {
    lines.push(
      `| \`${file}\` | \`${toComponentName(file)}\` | ${svgUrl(file)} | ${monoSvgUrl(file)} | \`devicons devicons-${file}\` |`,
    );
  }

  // Use it
  lines.push('', '## Install and use');
  lines.push('');
  lines.push('```bash');
  lines.push(`npm install @dev.icons/react  # or @dev.icons/vue, @dev.icons/svelte`);
  lines.push('```');
  lines.push('', '### React', '', '```tsx');
  lines.push(`import { ${cmpName} } from "@dev.icons/react";`);
  lines.push(`// Monochrome (inherits currentColor):`);
  lines.push(`// import { ${cmpName} } from "@dev.icons/react/mono";`);
  lines.push('');
  lines.push(`<${cmpName} size={32} alt="${name} logo" />`);
  lines.push('```');
  lines.push('', '### Vue', '', '```vue');
  lines.push('<script setup>');
  lines.push(`import { ${tplImport} } from "@dev.icons/vue";`);
  lines.push('</script>');
  lines.push('');
  lines.push('<template>');
  lines.push(`  <${tplName} :size="32" alt="${name} logo" />`);
  lines.push('</template>');
  lines.push('```');
  lines.push('', '### Svelte', '', '```svelte');
  lines.push('<script>');
  lines.push(`  import { ${tplImport} } from "@dev.icons/svelte";`);
  lines.push('</script>');
  lines.push('');
  lines.push(`<${tplName} size={32} alt="${name} logo" />`);
  lines.push('```');

  // Raw SVG
  lines.push('', '### Raw SVG', '', '```html');
  lines.push(
    `<img src="${svgUrl(primaryFile)}" alt="${name} logo" width="48" height="48" />`,
  );
  lines.push('```');

  // Icon font
  lines.push('', '### Icon font', '', '```css');
  lines.push(`@import "${FONT_PKG.name}/css"; /* npm install ${FONT_PKG.name} */`);
  lines.push('```', '', '```html');
  lines.push(`<i class="devicons devicons-${primaryFile}"></i>`);
  lines.push('```');

  // Long-form prose from the icon's MDX body
  const prose = mdxToMd(entry.body ?? '').trim();
  if (prose) {
    lines.push('', prose);
  }

  // Packs that include this icon
  if (packs.length) {
    lines.push('', '## In these packs');
    lines.push('');
    for (const p of packs) {
      lines.push(`- [${p.title}](/packs/${p.slug}.md)`);
    }
  }

  // Related icons
  if (related.length) {
    lines.push('', '## Related icons');
    lines.push('');
    for (const r of related) {
      lines.push(`- [${r.name}](/icons/${r.slug}.md)`);
    }
  }

  // Pagination
  if (prev || next) {
    lines.push('', '## Browse the catalog');
    if (prev) lines.push(`- Previous: [${prev.name}](/icons/${prev.slug}.md)`);
    if (next) lines.push(`- Next: [${next.name}](/icons/${next.slug}.md)`);
    lines.push('- [All icons](/icons.md)');
  } else {
    lines.push('', '[← All icons](/icons.md)');
  }

  return lines.join('\n');
}
