// Single source of truth for agent-facing package facts: public SVG URLs,
// published package names + versions, and component naming. Everything that
// emits Markdown/plain text for agents (llms.txt, skill.md, icon .md twins)
// should read from here instead of hardcoding URLs, versions, or counts.
//
// Versions are read from the workspace package.json files at build time
// (static JSON imports are inlined by Vite, so this works for prerendered
// and on-demand routes alike).
import reactPkg from '../../../../packages/react/package.json';
import vuePkg from '../../../../packages/vue/package.json';
import sveltePkg from '../../../../packages/svelte/package.json';
import corePkg from '../../../../packages/core/package.json';
import fontPkg from '../../../../packages/font/package.json';
import { SITE_URL } from '../consts';

export { toComponentName } from './component-name';

/** Public, CORS-enabled color SVG for an icon file (entry of `icons[]`). */
export const svgUrl = (file: string): string =>
  `${SITE_URL}/devicons/icons/${file}.svg`;

/** Public monochrome SVG (uses `currentColor`) for an icon file. */
export const monoSvgUrl = (file: string): string =>
  `${SITE_URL}/devicons/font/${file}.svg`;

export const SVG_URL_PATTERN = `${SITE_URL}/devicons/icons/{file}.svg`;
export const MONO_SVG_URL_PATTERN = `${SITE_URL}/devicons/font/{file}.svg`;

/** Agent-facing endpoints (see /docs/agents/). */
export const API_BASE_URL = `${SITE_URL}/api/v1`;
export const OPENAPI_URL = `${API_BASE_URL}/openapi.json`;
export const MCP_URL = `${SITE_URL}/api/mcp`;
export const MCP_ADD_CLAUDE = `claude mcp add --transport http devicons ${MCP_URL}`;
export const MCP_LOCAL_COMMAND = 'npx -y devicons mcp';


const normalizeVersion = (v: string) => (v === '0.0.0' ? 'latest' : v);

export interface PackageFact {
  name: string;
  purpose: string;
  version: string;
  install: string;
  docs: string;
}

export const REACT_PKG: PackageFact = {
  name: reactPkg.name,
  purpose: 'React components (color by default, monochrome via `/mono`)',
  version: normalizeVersion(reactPkg.version),
  install: `npm install ${reactPkg.name}`,
  docs: `${SITE_URL}/docs/react/`,
};

export const VUE_PKG: PackageFact = {
  name: vuePkg.name,
  purpose: 'Vue 3 components (color by default, monochrome via `/mono`)',
  version: normalizeVersion(vuePkg.version),
  install: `npm install ${vuePkg.name}`,
  docs: `${SITE_URL}/docs/vue/`,
};

export const SVELTE_PKG: PackageFact = {
  name: sveltePkg.name,
  purpose: 'Svelte 5 components (color by default, monochrome via `/mono`)',
  version: normalizeVersion(sveltePkg.version),
  install: `npm install ${sveltePkg.name}`,
  docs: `${SITE_URL}/docs/svelte/`,
};

export const CORE_PKG: PackageFact = {
  name: corePkg.name,
  purpose:
    'Icon catalog (`ICONS`, `getIcon`), `icons.json`, a color SVG sprite, and the icon font files',
  version: normalizeVersion(corePkg.version),
  install: `npm install ${corePkg.name}`,
  docs: `${SITE_URL}/docs/core/`,
};

export const FONT_PKG: PackageFact = {
  name: fontPkg.name, // 'devicons'
  purpose:
    'Icon web font: `@import "devicons/css";` then `<i class="devicons devicons-<file>"></i>`',
  version: normalizeVersion(fontPkg.version),
  install: `npm install ${fontPkg.name}`,
  docs: `${SITE_URL}/docs/icon-font/`,
};

export const PACKAGES: PackageFact[] = [
  REACT_PKG,
  VUE_PKG,
  SVELTE_PKG,
  CORE_PKG,
  FONT_PKG,
];

/** Versioned jsDelivr URLs for files that really ship in the npm tarballs. */
export const CDN_FILES = {
  fontCss: `https://cdn.jsdelivr.net/npm/${FONT_PKG.name}@${FONT_PKG.version}/dist/devicons.css`,
  coreSprite: `https://cdn.jsdelivr.net/npm/${CORE_PKG.name}@${CORE_PKG.version}/dist/sprite/sprite-symbol.svg`,
  coreIconsJson: `https://cdn.jsdelivr.net/npm/${CORE_PKG.name}@${CORE_PKG.version}/dist/icons.json`,
};

/** Format an icon count for prose, e.g. 1873 -> "1,873". */
export const formatCount = (n: number): string => n.toLocaleString('en-US');

/** Live count of non-deprecated icon entries, formatted for prose. */
export async function getActiveIconCount(): Promise<number> {
  const { getActiveIcons } = await import('./icons-query');
  return (await getActiveIcons()).length;
}

export async function getFormattedActiveCount(): Promise<string> {
  return formatCount(await getActiveIconCount());
}
