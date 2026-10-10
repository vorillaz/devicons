import { createHash } from 'node:crypto';
import { getCollection } from 'astro:content';
import {
  CDN_FILES,
  CORE_PKG,
  FONT_PKG,
  MONO_SVG_URL_PATTERN,
  REACT_PKG,
  SVELTE_PKG,
  SVG_URL_PATTERN,
  VUE_PKG,
  formatCount,
} from './package-facts';

/** One-line skill description, shared by SKILL.md frontmatter and the discovery index. */
export function skillDescription(totalIcons: number): string {
  return `Use Devicons (@dev.icons/*) — ${formatCount(totalIcons)} developer, brand, framework, and tooling logos as React, Vue, and Svelte components, public SVG URLs, an SVG sprite, and an icon font. Covers installation, component naming, monochrome variants, SVG URLs, the icon catalog, and variant selection. Use when working with developer logos, brand icons, framework marks, or when needing icon assets in SVG, font, or sprite format.`;
}

/**
 * Generate the SKILL.md body served at /skill.md and
 * /.well-known/agent-skills/devicons/SKILL.md. The content is identical at
 * both paths — the .well-known path is the discoverable one per the
 * Cloudflare agent-skills-discovery spec.
 */
export async function getSkillMarkdown(): Promise<string> {
  const icons = await getCollection('icons');
  const active = icons.filter((i) => !i.data.deprecated);
  const recommended = active.filter((i) => i.data.recommended);
  const totalIcons = active.length;
  const totalRecommended = recommended.length;
  const uniqueTags = new Set<string>();
  for (const icon of active) for (const tag of icon.data.tags) uniqueTags.add(tag);

  return `---
name: devicons
description: ${skillDescription(totalIcons)}
---

# Devicons

${formatCount(totalIcons)} developer, brand, framework, and tooling logos as React, Vue, and Svelte components, plain SVG files, an SVG sprite, and a web font. ${totalRecommended} flagship icons are flagged \`recommended\` across ${uniqueTags.size} tags.

- **Website**: [devicons.io](https://devicons.io/)
- **Browse all icons**: [devicons.io/icons/](https://devicons.io/icons/)
- **Docs**: [devicons.io/docs/](https://devicons.io/docs/)
- **GitHub**: [github.com/vorillaz/devicons](https://github.com/vorillaz/devicons)

## Key concepts

- **Icon entry** — one brand/technology, identified by a slug (e.g. \`react\`, \`nextjs\`, \`postgresql\`). Pages live at \`https://devicons.io/icons/<slug>/\` with a Markdown twin at \`https://devicons.io/icons/<slug>.md\`.
- **Icon file** — each entry has one or more files listed in its \`icons\` array (e.g. \`nextjs\` has \`nextjs-icon\` and \`nextjs\`). Files ending in \`-icon\` are the glyph-only mark; the others are the full logo/wordmark. **Files, not slugs, drive component names, SVG URLs, sprite ids, and font classes.**

## Discovery

The skill is published per the [Agent Skills Discovery](https://github.com/cloudflare/agent-skills-discovery-rfc) spec. Any compliant client can find it via:

\`\`\`
https://devicons.io/.well-known/agent-skills/index.json
\`\`\`

## Skill files

| File | URL |
| --- | --- |
| **Discovery index** | \`https://devicons.io/.well-known/agent-skills/index.json\` |
| **SKILL.md** (this file) | \`https://devicons.io/.well-known/agent-skills/devicons/SKILL.md\` |
| **reference/icons.md** | \`https://devicons.io/skill/reference/icons.md\` |
| **reference/packages.md** | \`https://devicons.io/skill/reference/packages.md\` |

**Install locally** (replace \`~/.claude\` with your agent's skill directory):

\`\`\`bash
SKILL_DIR=~/.claude/skills/devicons
mkdir -p "$SKILL_DIR/reference"
curl -sL https://devicons.io/.well-known/agent-skills/devicons/SKILL.md > "$SKILL_DIR/SKILL.md"
curl -sL https://devicons.io/skill/reference/icons.md > "$SKILL_DIR/reference/icons.md"
curl -sL https://devicons.io/skill/reference/packages.md > "$SKILL_DIR/reference/packages.md"
\`\`\`

You can also read these files directly from the URLs above — no install required.

## Packages at a glance

| Package | Version | Use case |
| --- | --- | --- |
| \`${REACT_PKG.name}\` | ${REACT_PKG.version} | ${REACT_PKG.purpose} |
| \`${VUE_PKG.name}\` | ${VUE_PKG.version} | ${VUE_PKG.purpose} |
| \`${SVELTE_PKG.name}\` | ${SVELTE_PKG.version} | ${SVELTE_PKG.purpose} |
| \`${CORE_PKG.name}\` | ${CORE_PKG.version} | ${CORE_PKG.purpose} |
| \`${FONT_PKG.name}\` | ${FONT_PKG.version} | Icon web font (CSS + woff2/ttf), no build step required |

There is no dedicated Astro package. In Astro, use \`@dev.icons/react\` (or vue/svelte) components — they render to static SVG without a \`client:*\` directive.

## Installation

\`\`\`bash
# React (react >= 16.8)
npm install @dev.icons/react

# Vue (vue >= 3.3)
npm install @dev.icons/vue

# Svelte (svelte >= 5)
npm install @dev.icons/svelte

# Catalog metadata, sprite, font files
npm install @dev.icons/core

# Icon font (CSS + webfont files)
npm install devicons
\`\`\`

\`pnpm\`, \`yarn\`, and \`bun\` all work the same way.

## Component naming

The export name is derived from the **icon file** name: split on \`-\`, capitalize each part, join. If the result is one of the reserved names \`React\`, \`Vue\`, \`Svelte\`, or \`Astro\`, it is prefixed with \`_\` (alias it on import in Vue/Svelte templates, e.g. \`import { _Vue as VueLogo }\`). There is no automatic \`Icon\` suffix — \`Icon\` only appears when the file itself ends in \`-icon\`.

| Icon file | Component name |
| --- | --- |
| \`react\` | \`_React\` |
| \`vue\` | \`_Vue\` |
| \`css\` | \`Css\` |
| \`nextjs\` | \`Nextjs\` |
| \`nextjs-icon\` | \`NextjsIcon\` |
| \`discord-icon\` | \`DiscordIcon\` |
| \`postgresql\` | \`Postgresql\` |

Every icon page Markdown twin (\`https://devicons.io/icons/<slug>.md\`) lists the exact file and component names.

## React components

\`\`\`tsx
import { _React, Nextjs, Postgresql } from "@dev.icons/react";

// Full color (default)
<_React size={32} />

// Accessible name rendered as <title>
<Postgresql size={32} alt="PostgreSQL" />

// Any SVG prop is forwarded
<Nextjs size={48} className="logo" onClick={() => console.log("clicked")} />
\`\`\`

### Monochrome

Monochrome variants are separate components with the same names, exported from the \`/mono\` subpath. They use \`currentColor\`, so they inherit the surrounding text color.

\`\`\`tsx
import { _React, GithubIcon } from "@dev.icons/react/mono";

<span style={{ color: "#ff4d00" }}>
  <_React size={32} />
</span>
<GithubIcon size={24} color="#111" />
\`\`\`

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| \`size\` | \`string \\| number\` | \`"1em"\` | Sets \`width\` and \`height\` |
| \`color\` | \`string\` | \`"currentColor"\` | Root \`fill\`; visible on monochrome icons |
| \`alt\` | \`string\` | — | Rendered as an SVG \`<title>\` (accessible name) |
| \`mirrored\` | \`boolean\` | \`false\` | Flips the icon horizontally (\`scale(-1, 1)\`) |

All other SVG attributes (\`className\`, \`style\`, \`aria-*\`, event handlers) are forwarded to the root \`<svg>\`. Vue and Svelte components accept the same four props.

## Vue components

Vue and Svelte templates cannot use a tag that starts with \`_\`, so alias the reserved names on import.

\`\`\`vue
<script setup>
import { _React as ReactLogo, _Vue as VueLogo } from "@dev.icons/vue";
import { GithubIcon } from "@dev.icons/vue/mono";
</script>

<template>
  <ReactLogo :size="32" />
  <VueLogo :size="32" alt="Vue" />
  <GithubIcon :size="24" />
</template>
\`\`\`

## Svelte components

\`\`\`svelte
<script>
  import { _React as ReactLogo, _Svelte as SvelteLogo } from "@dev.icons/svelte";
  import { GithubIcon } from "@dev.icons/svelte/mono";
</script>

<ReactLogo size={32} />
<SvelteLogo size={32} alt="Svelte" />
<GithubIcon size={24} />
\`\`\`

## Plain SVG URLs (no install)

Every icon file is served as a standalone, CORS-enabled SVG:

| Variant | URL pattern |
| --- | --- |
| Color | \`${SVG_URL_PATTERN}\` |
| Monochrome (\`currentColor\`) | \`${MONO_SVG_URL_PATTERN}\` |

\`\`\`html
<img
  src="https://devicons.io/devicons/icons/react.svg"
  alt="React logo"
  width="48"
  height="48"
/>
\`\`\`

Fetch and inline the monochrome SVG when it must follow CSS \`color\`:

\`\`\`html
<span data-icon="postgresql"></span>

<script type="module">
  const BASE = "https://devicons.io/devicons/font";
  for (const el of document.querySelectorAll("[data-icon]")) {
    const file = el.getAttribute("data-icon");
    el.innerHTML = await (await fetch(\`\${BASE}/\${file}.svg\`)).text();
  }
</script>
\`\`\`

The npm packages do **not** ship per-icon SVG files, so there is no per-icon SVG URL on jsDelivr or UNPKG.

## @dev.icons/core

\`@dev.icons/core\` exports the catalog of icon files with their font codepoints. It does not export SVG strings.

\`\`\`ts
import { ICONS, getIcon } from "@dev.icons/core";
import type { IconRecord } from "@dev.icons/core";

// IconRecord = { name: string; codepoint: number; unicode: string; isVariant: boolean }
getIcon("react");        // { name: "react", codepoint: ..., unicode: "...", isVariant: false }
ICONS.filter((i) => !i.isVariant).length;
\`\`\`

Package subpaths: \`@dev.icons/core/icons.json\`, \`@dev.icons/core/sprite\` (color SVG sprite), \`@dev.icons/core/font/css\`, \`@dev.icons/core/font/woff2\`, \`@dev.icons/core/font/ttf\`.

## Icon font

\`\`\`css
/* npm install devicons */
@import "devicons/css";
\`\`\`

\`\`\`html
<i class="devicons devicons-react"></i>
<i class="devicons devicons-nextjs-icon"></i>
\`\`\`

No build step? Link the stylesheet from jsDelivr (pin the version):

\`\`\`html
<link rel="stylesheet" href="${CDN_FILES.fontCss}" />
\`\`\`

Glyphs are monochrome and follow \`color\` and \`font-size\`.

## SVG sprite

\`${CORE_PKG.name}\` ships a color sprite at \`dist/sprite/sprite-symbol.svg\` (\`@dev.icons/core/sprite\`) with one \`<symbol>\` per icon file (\`#react\`, \`#nextjs-icon\`). Browsers block \`<use href>\` across origins, so copy the sprite into your own static assets and reference it same-origin:

\`\`\`html
<svg width="24" height="24" role="img" aria-label="React logo">
  <use href="/sprite-symbol.svg#react"></use>
</svg>
\`\`\`

Versioned download: \`${CDN_FILES.coreSprite}\`

## Catalog metadata

\`https://devicons.io/search-index.json\` returns every icon entry (including deprecated ones) with these fields:

- \`id\`: the slug (page URL is \`/icons/<id>/\`)
- \`name\`: human-readable brand name
- \`description\`: one-line description (may be empty)
- \`icons\`: icon file names — use these for components, SVG URLs, sprite ids, and font classes
- \`tags\`: categories (\`frontend\`, \`database\`, \`ai\`, \`llm\`, ...)
- \`aliases\` (optional): alternative names users search with
- \`popular\`: flagship flag
- \`deprecated\`: skip entries where this is \`true\`
- \`badInDark\` / \`badInLight\`: the icon needs a contrasting backdrop on that theme
- \`version\` (optional): library version that added the icon

For the curated \`recommended\` picks per tag, see [reference/icons.md](https://devicons.io/skill/reference/icons.md).

## When to use which option

- **React / Vue / Svelte app** → \`@dev.icons/<framework>\` (tree-shakeable); \`/mono\` for single-color.
- **Astro** → \`@dev.icons/react\` (or vue/svelte) components rendered statically.
- **Plain HTML, Markdown, README, CMS** → \`<img src="https://devicons.io/devicons/icons/<file>.svg">\`.
- **Many monochrome glyphs styled by CSS** → icon font (\`devicons\`).
- **Many color icons on one page** → self-hosted SVG sprite from \`@dev.icons/core\`.
- **Tooling / codegen needing the list of files** → \`@dev.icons/core\` (\`ICONS\`) or \`search-index.json\`.

## Related documentation

- [Installation](https://devicons.io/docs/installation/)
- [React guide](https://devicons.io/docs/react/)
- [Vue guide](https://devicons.io/docs/vue/)
- [Svelte guide](https://devicons.io/docs/svelte/)
- [Core package](https://devicons.io/docs/core/)
- [Icon font](https://devicons.io/docs/icon-font/)
- [CDN and SVG URLs](https://devicons.io/docs/cdn/)
`;
}

/** SHA-256 hex digest of the UTF-8 body, formatted for the discovery spec. */
export function skillDigest(body: string): string {
  return 'sha256:' + createHash('sha256').update(body, 'utf8').digest('hex');
}
