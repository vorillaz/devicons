# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Developers and designers, in equal measure.

- **Developers** need a tech or brand logo inside an app, docs site, or README. They find the icon, check its color/monochrome and dark/light behavior, then copy the SVG or install the React, Vue, or Svelte component.
- **Designers and content makers** need the same logos for decks, landing pages, and stack diagrams. They pull SVGs from the site or use the Figma plugin.

Both arrive with a specific brand in mind and want it fast, accurate, and ready to drop in.

## Product Purpose

Devicons is an open-source library of developer icons and logos (languages, frameworks, databases, cloud services, AI/LLM brands, tooling). devicons.io is where people search the library, preview icons, and get them in the format they need: raw SVG, icon font, SVG sprite, or framework components. Success is a visitor going from "I need the X logo" to a correct icon in their project or file in seconds.

## Positioning

- **One optical system.** Every icon follows the same grid, optical weight, and corner radius, so any two icons look like they belong together.
- **Color and monochrome for every icon**, with per-icon flags for marks that need a backdrop on dark or light backgrounds (`badInDark` / `badInLight`).
- **Native framework packages.** Tree-shakeable `@dev.icons/react`, `@dev.icons/vue`, and `@dev.icons/svelte` components, plus the `devicons` icon font, CSS, and SVG sprite. No runtime fetches.
- **Breadth of modern brands.** 1,300+ active icons, including AI/LLM brands and newer tools that other sets lack.

## Operating Context

- Visitors move between the site and their editor, Figma, or slide tool: search, preview, copy, paste.
- Key surfaces: home, search (`/search/`), icon detail pages (`/icons/<id>/`, plus per-framework pages), tag and color listings, packs, comparisons, use cases, and docs.
- The icon index is content-collection MDX in `src/content/icons/`. Deprecated icons stay in the index, flagged `deprecated`.
- A Figma plugin lives in `apps/figma`.

## Capabilities and Constraints

- Astro static site deployed on Cloudflare. Search (MiniSearch over `/search-index.json`) and icon previews run client-side as React islands. Content pages must stay light on JavaScript.
- `trailingSlash: 'always'`: internal links must end in `/`.
- Package code is MIT licensed. Brand marks remain the trademarks of their owners.

## Brand Commitments

- Name: **Devicons**. Brand assets live in `public/brand/` (lockup, mark, and wordmark, each in dark and light versions).
- Voice: terse, technical, and plain. The copy states facts ("MIT licensed", "No runtime fetches") rather than selling.
- **Logos stay brand-accurate.** Never restyle, recolor, crop, or reinterpret a brand mark beyond its official color and monochrome variants.

## Evidence on Hand

- The icon count is computed from the collection (about 1,323 active, plus 65 deprecated, as of 2026-10).
- The GitHub repo is `vorillaz/devicons`, and the star count is shown in the nav.
- No testimonials, customer logos, or usage statistics exist. Do not invent them.

## Product Principles

1. **Time-to-icon wins.** Every surface should shorten the path from intent to a correct, copied icon.
2. **The mark is the hero.** Interface chrome recedes, and the logos carry the color.
3. **Show it on real backgrounds.** Previews must make dark/light and color/mono behavior obvious before anyone copies.
4. **Fast by default.** Static first, with minimal client JS and no runtime fetching in the packages.

## Accessibility & Inclusion

WCAG 2.2 AA minimum across the site: contrast, full keyboard access, visible focus, and screen-reader names for icon-only controls and previews.
