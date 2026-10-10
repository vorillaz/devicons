import { createHash } from 'node:crypto';
import { getCollection } from 'astro:content';

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
description: Use \`@dev.icons/*\` — a collection of ${totalIcons}+ developer, brand, framework, and tooling SVG logos with React, Vue, and Svelte components. Covers installation, component usage, CDN URL generation (UNPKG / jsDelivr / npmmirror / Skypack), raw SVG access via \`@dev.icons/core\`, the icon catalog metadata, and variant selection. Use when working with developer logos, brand icons, framework marks, or when needing icon assets in SVG, font, or sprite format.
---

# Devicons

${totalIcons}+ developer, brand, framework, and tooling SVG logos as React, Vue, and Svelte components plus raw assets and a webfont. ${totalRecommended} flagship icons are flagged \`recommended\` across ${uniqueTags.size} tags.

- **Website**: [devicons.io](https://devicons.io)
- **Browse all icons**: [devicons.io/icons](https://devicons.io/icons)
- **Docs**: [devicons.io/docs](https://devicons.io/docs)
- **GitHub**: [github.com/vorillaz/devicons](https://github.com/vorillaz/devicons)

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

| Package | Use case |
| --- | --- |
| \`@dev.icons/react\` | React components (tree-shakeable, typed) |
| \`@dev.icons/vue\` | Vue 3 components |
| \`@dev.icons/svelte\` | Svelte components |
| \`@dev.icons/core\` | Raw SVG strings + metadata catalog + build utilities |
| \`devicons\` | Icon web font (\`.css\` + \`.woff2\`), no build step required |

## Installation

\`\`\`bash
# React
npm install @dev.icons/react

# Vue
npm install @dev.icons/vue

# Svelte
npm install @dev.icons/svelte

# Raw SVGs and metadata
npm install @dev.icons/core

# Icon font (CSS + webfont files)
npm install devicons
\`\`\`

\`pnpm\`, \`yarn\`, and \`bun\` all work the same way.

## React components

Every icon is a named PascalCase export with \`Icon\` suffix. The component accepts every standard SVG prop plus \`size\` and \`mono\`.

\`\`\`tsx
import { ReactIcon, VueIcon, NextJsIcon } from "@dev.icons/react";

// Full color (default)
<ReactIcon size={32} />

// Monochrome — inherits currentColor
<div className="text-accent">
  <VueIcon size={32} mono />
</div>

// Any SVG prop works
<NextJsIcon
  size={48}
  aria-label="Next.js"
  onClick={() => console.log("clicked")}
/>
\`\`\`

Common props: \`size\`, \`mono\`, \`className\`, \`style\`, plus all SVG attributes.

### Naming convention

| Icon slug | Component name |
| --- | --- |
| \`react\` | \`ReactIcon\` |
| \`next-js\` | \`NextJsIcon\` |
| \`postgresql\` | \`PostgresqlIcon\` |
| \`visual-studio-code\` | \`VisualStudioCodeIcon\` |

Slugs are listed in [reference/icons.md](https://devicons.io/skill/reference/icons.md) and browsable at [devicons.io/icons](https://devicons.io/icons).

## Vue components

\`\`\`vue
<script setup>
import { ReactIcon, VueIcon } from "@dev.icons/vue";
</script>

<template>
  <div class="flex gap-4">
    <ReactIcon :size="32" />
    <VueIcon :size="32" mono />
  </div>
</template>
\`\`\`

## Svelte components

\`\`\`svelte
<script>
  import { ReactIcon, SvelteIcon } from "@dev.icons/svelte";
</script>

<ReactIcon size={32} />
<SvelteIcon size={32} mono />
\`\`\`

## Raw SVGs via @dev.icons/core

\`@dev.icons/core\` exports every icon as a plain SVG string, plus the full catalog metadata.

\`\`\`ts
import { react, postgresql, metadata, slugs } from "@dev.icons/core";

// SVG string
console.log(react);
// '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">...</svg>'

// Catalog entry for each icon
console.log(metadata.find((m) => m.slug === "react"));
// { name: "React", slug: "react", tags: ["frontend", "ui"], ... }

// Flat list of all slugs
console.log(slugs); // ["adonisjs", "adyen", ... "zeit", "zig"]
\`\`\`

Use core when you need SVGs without a framework runtime — server rendering, email templates, static HTML generation, CLI tools.

## CDN usage (no install required)

Four public mirrors serve every published file.

| Provider | Base URL | Best for |
| --- | --- | --- |
| **UNPKG** | \`https://unpkg.com/<pkg>@<version>/<path>\` | Default for any file |
| **jsDelivr** | \`https://cdn.jsdelivr.net/npm/<pkg>@<version>/<path>\` | Multi-region caching |
| **npmmirror** | \`https://registry.npmmirror.com/<pkg>/<version>/files/<path>\` | China-friendly mirror |
| **Skypack** | \`https://cdn.skypack.dev/<pkg>@<version>\` | ESM JS imports only |

### Icon font (no build)

\`\`\`html
<link
  rel="stylesheet"
  href="https://unpkg.com/devicons@1.8.0/css/devicons.min.css"
/>

<i class="devicons devicons-react"></i>
<i class="devicons devicons-vue"></i>
\`\`\`

### SVG sprite (single request, many icons)

\`\`\`html
<svg width="24" height="24" aria-label="React logo">
  <use href="https://cdn.jsdelivr.net/npm/@dev.icons/core@latest/export-files/sprite.svg#react"></use>
</svg>
\`\`\`

Symbol ids match the icon slug (\`#react\`, \`#postgresql\`, \`#nextjs-icon\`).

### Raw SVG as \`<img>\`

\`\`\`html
<img
  src="https://cdn.jsdelivr.net/npm/@dev.icons/core@latest/export-files/icons/react.svg"
  alt="React logo"
  width="48"
  height="48"
/>
\`\`\`

### Raw SVG via fetch + inline (styleable with CSS)

\`\`\`html
<span data-icon="postgresql"></span>

<script type="module">
  const BASE = "https://cdn.jsdelivr.net/npm/@dev.icons/core@latest/export-files/icons";
  for (const el of document.querySelectorAll("[data-icon]")) {
    const slug = el.getAttribute("data-icon");
    const res = await fetch(\`\${BASE}/\${slug}.svg\`);
    el.innerHTML = await res.text();
  }
</script>
\`\`\`

### ES module import (Skypack)

\`\`\`html
<script type="module">
  import { react, vue } from "https://cdn.skypack.dev/@dev.icons/core@latest";
  document.getElementById("logo").innerHTML = react;
</script>
\`\`\`

## Variants

Many brands ship both a full logo and a glyph-only mark.

| Path | Example |
| --- | --- |
| \`export-files/icons/<slug>.svg\` | \`react.svg\` (full brand logo) |
| \`export-files/icons/<slug>-icon.svg\` | \`nextjs-icon.svg\` (glyph only) |

## Icon metadata fields

Each icon entry in the catalog carries:

- \`slug\`: kebab-case id matching the SVG filename
- \`name\`: human-readable brand name
- \`description\`: one-line description (most entries)
- \`tags\`: array of categories (\`frontend\`, \`database\`, \`ai\`, \`llm\`, ...)
- \`aliases\`: alternative names users search with
- \`popular\`: flagship flag — surfaced on the home page
- \`recommended\`: per-tag flagship flag — shown first in related sections
- \`mainColor\` / \`otherColors\`: brand hex colors
- \`badInDark\` / \`badInLight\`: hint that the icon needs a contrast backdrop

See [reference/icons.md](https://devicons.io/skill/reference/icons.md) for the full recommended catalog with metadata.

## When to use which option

- **React / Vue / Svelte app** → install \`@dev.icons/<framework>\`, tree-shakes cleanly.
- **Plain HTML, WordPress, email template** → icon font via CDN (\`<link rel="stylesheet">\`).
- **Static site needing many icons on one page** → SVG sprite (\`<use href>\`).
- **Server-rendered HTML, build scripts, CLI tools** → \`@dev.icons/core\` (SVG strings).
- **CodePen / JSFiddle / quick prototype** → CDN \`<img>\` tag.
- **Browser ESM without bundler** → Skypack import of \`@dev.icons/core\`.

## Related documentation

- [Installation](https://devicons.io/docs/installation)
- [React guide](https://devicons.io/docs/react)
- [Vue guide](https://devicons.io/docs/vue)
- [Svelte guide](https://devicons.io/docs/svelte)
- [Core package](https://devicons.io/docs/core)
- [Icon font](https://devicons.io/docs/icon-font)
- [CDN guide](https://devicons.io/docs/cdn)
`;
}

/** SHA-256 hex digest of the UTF-8 body, formatted for the discovery spec. */
export function skillDigest(body: string): string {
  return 'sha256:' + createHash('sha256').update(body, 'utf8').digest('hex');
}
