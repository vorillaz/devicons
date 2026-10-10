import type { APIRoute } from 'astro';

export const prerender = true;

const BODY = `# Devicons packages reference

Detailed map of every package in the Devicons ecosystem, what it exports, and when to reach for it.

## @dev.icons/react

React components. Every icon is a named PascalCase export ending in \`Icon\`.

- Package: \`@dev.icons/react\`
- Install: \`npm install @dev.icons/react\`
- Peer deps: \`react >= 18\`
- Exports: ESM + CJS + \`.d.ts\`
- Runtime: tree-shakeable — only the icons you import land in the bundle

\`\`\`tsx
import { ReactIcon, NextJsIcon, PostgresqlIcon } from "@dev.icons/react";

<ReactIcon size={32} />
<NextJsIcon size={32} mono />
<PostgresqlIcon size={32} className="text-blue-500" />
\`\`\`

Props:

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| \`size\` | \`number \\| string\` | \`24\` | Width / height in pixels or any CSS size |
| \`mono\` | \`boolean\` | \`false\` | Render the monochrome variant (inherits \`currentColor\`) |
| \`className\` | \`string\` | — | Passed through to the root \`<svg>\` |
| \`...rest\` | \`SVGProps<SVGSVGElement>\` | — | Any SVG attribute: \`onClick\`, \`aria-label\`, \`role\`, etc. |

## @dev.icons/vue

Vue 3 components with the same API shape as the React package.

\`\`\`vue
<script setup>
import { ReactIcon, VueIcon } from "@dev.icons/vue";
</script>

<template>
  <ReactIcon :size="32" />
  <VueIcon :size="32" mono />
</template>
\`\`\`

## @dev.icons/svelte

Svelte components.

\`\`\`svelte
<script>
  import { ReactIcon, SvelteIcon } from "@dev.icons/svelte";
</script>

<ReactIcon size={32} />
<SvelteIcon size={32} mono />
\`\`\`

## @dev.icons/core

Raw SVG strings, the metadata catalog, and build utilities. Depended on by every framework wrapper.

- Package: \`@dev.icons/core\`
- Install: \`npm install @dev.icons/core\`
- Exports:
  - Every icon slug as a plain SVG string
  - \`metadata\`: array of catalog entries
  - \`slugs\`: flat list of every available slug
- File layout inside the package:
  - \`export-files/icons/<slug>.svg\` — full brand logo
  - \`export-files/icons/<slug>-icon.svg\` — glyph-only variant (when available)
  - \`export-files/font/<slug>.svg\` — monochrome font glyph source
  - \`export-files/sprite.svg\` — single-file SVG sprite with every icon as a \`<symbol id="slug">\`

\`\`\`ts
import { react, nodejs, metadata } from "@dev.icons/core";

console.log(react);
// '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">...</svg>'

console.log(metadata[0]);
// { name: "Adonis", slug: "adonisjs", tags: [...], variants: [...] }
\`\`\`

### Metadata entry shape

\`\`\`ts
interface IconMeta {
  slug: string;
  name: string;
  description?: string;
  tags: string[];
  aliases?: string[];
  popular: boolean;
  recommended: boolean;
  mainColor?: string;
  otherColors?: string[];
  badInDark: boolean;
  badInLight: boolean;
  variants: string[]; // ["react", "react-icon", ...]
}
\`\`\`

## devicons (icon font)

Legacy webfont package. One CSS file, every glyph available via \`<i class="devicons devicons-<slug>">\`.

- Package: \`devicons\`
- Install: \`npm install devicons\`
- File layout:
  - \`css/devicons.css\` / \`devicons.min.css\`
  - \`fonts/devicons.woff2\` (+ \`.woff\`, \`.ttf\`, \`.eot\`)

\`\`\`html
<link
  rel="stylesheet"
  href="https://unpkg.com/devicons@1.8.0/css/devicons.min.css"
/>
<i class="devicons devicons-react"></i>
\`\`\`

Class names use \`.devicon-<slug>\` where \`<slug>\` is the kebab-case icon id. Colors inherit \`color\`, sizes inherit \`font-size\`.

## CDN routing cheatsheet

| Need | URL pattern |
| --- | --- |
| Specific icon SVG | \`https://cdn.jsdelivr.net/npm/@dev.icons/core@<v>/export-files/icons/<slug>.svg\` |
| Glyph-only variant | \`.../icons/<slug>-icon.svg\` |
| Full sprite | \`.../export-files/sprite.svg\` — reference via \`<use href="...#<slug>">\` |
| Font stylesheet | \`https://unpkg.com/devicons@<v>/css/devicons.min.css\` |
| ESM import | \`import { react } from "https://cdn.skypack.dev/@dev.icons/core@<v>"\` |

## Version compatibility

- All \`@dev.icons/*\` packages share a single version number and release together.
- The legacy \`devicons\` font package versions independently (current: \`1.x\`).
- Pin a semver in any production CDN URL — unpinned URLs drift when we publish.

## Choosing a package

- User already has a React/Vue/Svelte build → the matching \`@dev.icons/<framework>\` package.
- User writes plain HTML or ships into a CMS (WordPress, Rails) → \`devicons\` icon font via CDN.
- User builds email templates, SSR-only markup, or code generators → \`@dev.icons/core\` for plain SVG strings.
- User is building their own framework wrapper or tooling → \`@dev.icons/core\` for metadata + SVGs.
`;

export const GET: APIRoute = async () =>
  new Response(BODY, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
