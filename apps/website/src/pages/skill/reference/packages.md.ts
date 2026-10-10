import type { APIRoute } from 'astro';
import {
  CDN_FILES,
  CORE_PKG,
  FONT_PKG,
  MONO_SVG_URL_PATTERN,
  REACT_PKG,
  SVELTE_PKG,
  SVG_URL_PATTERN,
  VUE_PKG,
} from '../../../lib/package-facts';

export const prerender = true;

const BODY = `# Devicons packages reference

Detailed map of every package in the Devicons ecosystem, what it exports, and when to reach for it. Versions below are the ones published with this build of devicons.io.

| Package | Version | Purpose |
| --- | --- | --- |
| \`${REACT_PKG.name}\` | ${REACT_PKG.version} | ${REACT_PKG.purpose} |
| \`${VUE_PKG.name}\` | ${VUE_PKG.version} | ${VUE_PKG.purpose} |
| \`${SVELTE_PKG.name}\` | ${SVELTE_PKG.version} | ${SVELTE_PKG.purpose} |
| \`${CORE_PKG.name}\` | ${CORE_PKG.version} | ${CORE_PKG.purpose} |
| \`${FONT_PKG.name}\` | ${FONT_PKG.version} | Icon web font |

There is no Astro-specific package. Astro projects use \`@dev.icons/react\`, \`@dev.icons/vue\`, or \`@dev.icons/svelte\` components, which render to static SVG without a \`client:*\` directive.

## Component naming (all framework packages)

Export names come from the **icon file** name (an entry of the icon's \`icons\` array, e.g. \`react\`, \`nextjs-icon\`):

1. Split the file name on \`-\`.
2. Capitalize the first letter of each part and join.
3. If the result is \`React\`, \`Vue\`, \`Svelte\`, or \`Astro\`, prefix it with \`_\`.

| File | Export |
| --- | --- |
| \`react\` | \`_React\` |
| \`css\` | \`Css\` |
| \`nextjs\` | \`Nextjs\` |
| \`nextjs-icon\` | \`NextjsIcon\` |
| \`discord-icon\` | \`DiscordIcon\` |

There is no automatic \`Icon\` suffix.

## Shared props (React, Vue, Svelte)

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| \`size\` | \`string \\| number\` | \`"1em"\` | Sets \`width\` and \`height\` |
| \`color\` | \`string\` | \`"currentColor"\` | Root \`fill\`; visible on monochrome icons |
| \`alt\` | \`string\` | — | Rendered as an SVG \`<title>\` (accessible name) |
| \`mirrored\` | \`boolean\` | \`false\` | Flips horizontally with \`scale(-1, 1)\` |

Any other SVG attribute (\`className\`/\`class\`, \`style\`, \`aria-*\`, event handlers) is forwarded to the root \`<svg>\`. There is no \`mono\` or \`title\` prop — monochrome icons come from the \`/mono\` subpath.

## @dev.icons/react

- Install: \`npm install @dev.icons/react\`
- Peer deps: \`react >= 16.8\`
- Entry points: \`@dev.icons/react\` (color), \`@dev.icons/react/mono\` (monochrome)
- Also exports: \`IconContext\` (default \`size\`/\`color\`/\`mirrored\`), \`Base\`, \`SSRBase\`, and the \`Icon\` / \`IconProps\` types
- ESM + CJS + \`.d.ts\`; tree-shakeable named exports

\`\`\`tsx
import { _React, Nextjs, Postgresql } from "@dev.icons/react";
import { GithubIcon } from "@dev.icons/react/mono";

<_React size={32} />
<Nextjs size={32} alt="Next.js" />
<Postgresql size={32} className="logo" />
<GithubIcon size={24} color="#ff4d00" />
\`\`\`

## @dev.icons/vue

- Install: \`npm install @dev.icons/vue\`
- Peer deps: \`vue >= 3.3\`
- Entry points: \`@dev.icons/vue\`, \`@dev.icons/vue/mono\`

Vue templates can't use tags starting with \`_\`, so alias reserved names:

\`\`\`vue
<script setup>
import { _Vue as VueLogo, Nextjs } from "@dev.icons/vue";
import { GithubIcon } from "@dev.icons/vue/mono";
</script>

<template>
  <VueLogo :size="32" />
  <Nextjs :size="32" alt="Next.js" />
  <GithubIcon :size="24" />
</template>
\`\`\`

## @dev.icons/svelte

- Install: \`npm install @dev.icons/svelte\`
- Peer deps: \`svelte >= 5\`
- Entry points: \`@dev.icons/svelte\`, \`@dev.icons/svelte/mono\`

\`\`\`svelte
<script>
  import { _Svelte as SvelteLogo, Nextjs } from "@dev.icons/svelte";
  import { GithubIcon } from "@dev.icons/svelte/mono";
</script>

<SvelteLogo size={32} />
<Nextjs size={32} alt="Next.js" />
<GithubIcon size={24} />
\`\`\`

## @dev.icons/core

The catalog of icon files plus the build artifacts the other packages are made from. It does **not** export SVG strings and does not contain per-icon SVG files.

- Install: \`npm install @dev.icons/core\`
- Exports:
  - \`ICONS: readonly IconRecord[]\` — every icon file, sorted by codepoint
  - \`getIcon(name: string): IconRecord | undefined\` — O(1) lookup by file name
  - \`type IconRecord\`
- Subpath exports:
  - \`@dev.icons/core/icons.json\` → \`dist/icons.json\` (same data as \`ICONS\`)
  - \`@dev.icons/core/sprite\` → \`dist/sprite/sprite-symbol.svg\` (color sprite, one \`<symbol id="<file>">\` per icon)
  - \`@dev.icons/core/font/css\`, \`/font/woff2\`, \`/font/ttf\` → \`dist/font/devicons.*\`

\`\`\`ts
import { ICONS, getIcon, type IconRecord } from "@dev.icons/core";

interface IconRecord {
  name: string;       // file name, e.g. "adonisjs" or "adonisjs-icon"
  codepoint: number;  // Private Use Area codepoint used by the font
  unicode: string;    // String.fromCodePoint(codepoint)
  isVariant: boolean; // true when name ends in "-icon"
}

getIcon("nextjs-icon")?.isVariant; // true
\`\`\`

## devicons (icon font)

The original web font. Not prefixed with \`@dev.icons/\` because it predates the component packages.

- Install: \`npm install devicons\`
- CSS: \`@import "devicons/css";\` (\`dist/devicons.css\`)
- Other exports: \`devicons/woff2\`, \`devicons/ttf\`, \`devicons/sprite\`, \`devicons/codepoints\`
- Class names: \`devicons devicons-<file>\` (e.g. \`devicons devicons-react\`, \`devicons devicons-nextjs-icon\`)
- Glyphs are monochrome; they inherit \`color\` and \`font-size\`

\`\`\`html
<link rel="stylesheet" href="${CDN_FILES.fontCss}" />
<i class="devicons devicons-react"></i>
\`\`\`

## URL cheatsheet

| Need | URL |
| --- | --- |
| Color SVG for one icon | \`${SVG_URL_PATTERN}\` |
| Monochrome SVG for one icon | \`${MONO_SVG_URL_PATTERN}\` |
| Font stylesheet | \`${CDN_FILES.fontCss}\` |
| Color sprite (self-host it; \`<use>\` does not work cross-origin) | \`${CDN_FILES.coreSprite}\` |
| Catalog of icon files | \`${CDN_FILES.coreIconsJson}\` |
| Catalog with names, tags, aliases | \`https://devicons.io/search-index.json\` |

There is no per-icon SVG URL on jsDelivr/UNPKG — the npm packages don't ship individual SVG files.

## Versioning

- \`@dev.icons/react\`, \`/vue\`, \`/svelte\`, and \`/core\` are released together.
- The \`devicons\` font package versions independently (currently ${FONT_PKG.version}).
- Pin an exact version in production CDN URLs.

## Choosing a package

- React/Vue/Svelte (or Astro) app → the matching \`@dev.icons/<framework>\` package.
- Plain HTML, Markdown, CMS → \`<img>\` with the devicons.io SVG URL, or the \`devicons\` font for monochrome glyphs.
- Tooling that needs the list of icon files or font codepoints → \`@dev.icons/core\`.
`;

export const GET: APIRoute = async () =>
  new Response(BODY, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
