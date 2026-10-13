import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE_URL } from '../consts';
import { USE_CASES } from '../data/use-cases';
import { getSortedDocPages } from '../lib/agent-md/docs-md';
import { TOOL_NAMES } from '@dev.icons/agent/server';
import {
  API_BASE_URL,
  CORE_PKG,
  FONT_PKG,
  MCP_ADD_CLAUDE,
  MCP_LOCAL_COMMAND,
  MCP_URL,
  MONO_SVG_URL_PATTERN,
  OPENAPI_URL,
  REACT_PKG,
  SVELTE_PKG,
  SVG_URL_PATTERN,
  VUE_PKG,
  formatCount,
  getActiveIconCount,
} from '../lib/package-facts';

export const prerender = true;

export const GET: APIRoute = async () => {
  const count = formatCount(await getActiveIconCount());
  const docs = await getSortedDocPages();
  const packs = (await getCollection('packs')).sort(
    (a, b) => a.data.order - b.data.order,
  );

  const lines: string[] = [
    '# Devicons',
    '',
    `> Free, MIT-licensed library of ${count} developer, brand, framework, and tooling logos — as plain SVG files, React/Vue/Svelte components, an SVG sprite, and an icon font.`,
    '',
    'Devicons is a catalog of developer-brand logos (languages, frameworks, databases, cloud providers, AI tools) for diagrams, docs, comparison pages, and UI. Every icon has a full-color and a monochrome (`currentColor`) variant.',
    '',
    '## Machine-readable entry points',
    '',
    `- [Full icon catalog (Markdown)](${SITE_URL}/icons.md): every icon with slug, name, tags, aliases`,
    `- [Search index (JSON)](${SITE_URL}/search-index.json): one record per icon entry — fields \`id, name, description, icons, tags, deprecated, popular, badInDark, badInLight, version?, aliases?\``,
    `- [Homepage (Markdown)](${SITE_URL}/index.md)`,
    `- [Packs index (Markdown)](${SITE_URL}/packs.md): curated logo sets`,
    `- [Comparisons index (Markdown)](${SITE_URL}/compare.md): curated A-vs-B pairs`,
    `- [Full documentation in one file](${SITE_URL}/llms-full.txt)`,
    `- [Sitemap](${SITE_URL}/sitemap-index.xml)`,
    '',
    '## Agent integrations',
    '',
    `- [MCP server](${SITE_URL}/docs/mcp/): \`${MCP_URL}\` (Streamable HTTP, read-only, no auth). Tools: \`${TOOL_NAMES.join('`, `')}\`. Claude Code: \`${MCP_ADD_CLAUDE}\`. Local stdio: \`${MCP_LOCAL_COMMAND}\`.`,
    `- [HTTP API](${SITE_URL}/docs/api/): \`${API_BASE_URL}/\` — \`icons.json\`, \`icons/{slug}.json\`, \`categories.json\`, \`categories/{slug}.json\`, \`search?q=\`. No key, CORS-enabled.`,
    `- [OpenAPI 3.1 spec](${OPENAPI_URL})`,
    `- [CLI](${SITE_URL}/docs/cli/): \`npx devicons search <query>\`, \`npx devicons add <slug...>\`, \`--json\` output.`,
    `- [Agent Skills discovery index](${SITE_URL}/.well-known/agent-skills/index.json); [SKILL.md](${SITE_URL}/.well-known/agent-skills/devicons/SKILL.md) (also at [/skill.md](${SITE_URL}/skill.md)): full agent-usage guide`,
    `- [Skill icons reference](${SITE_URL}/skill/reference/icons.md): recommended icons with file and component names`,
    `- [Skill packages reference](${SITE_URL}/skill/reference/packages.md): package APIs, props, and URLs`,
    `- [agents.md](${SITE_URL}/agents.md): agent readiness manifest`,
    `- [auth.md](${SITE_URL}/auth.md): authentication for agents (none needed)`,
    '',
    '## Documentation',
    '',
    `- [Documentation index (Markdown)](${SITE_URL}/docs.md)`,
    ...docs.map(
      d =>
        `- [${d.data.title}](${SITE_URL}/docs/${d.id}.md)${d.data.description ? `: ${d.data.description}` : ''}`,
    ),
    '',
    '## Packs',
    '',
    ...packs.map(
      p => `- [${p.data.title}](${SITE_URL}/packs/${p.id}.md): ${p.data.description}`,
    ),
    '',
    '## Use cases',
    '',
    ...USE_CASES.map(
      u => `- [${u.title}](${SITE_URL}/use-cases/${u.slug}/): ${u.intro}`,
    ),
    '',
    '## Per-icon Markdown',
    '',
    `Every icon page \`${SITE_URL}/icons/{slug}/\` has a Markdown twin at \`${SITE_URL}/icons/{slug}.md\` (e.g. [/icons/react.md](${SITE_URL}/icons/react.md), [/icons/postgresql.md](${SITE_URL}/icons/postgresql.md)) with the description, tags, aliases, website, variant files, SVG URLs, component names, and framework snippets.`,
    '',
    '## Usage summary',
    '',
    `- SVG (no install): \`${SVG_URL_PATTERN}\` (color) and \`${MONO_SVG_URL_PATTERN}\` (monochrome). \`{file}\` is an entry of the icon's \`icons\` array (e.g. \`react\`, \`nextjs-icon\`). CORS-enabled.`,
    `- React: \`${REACT_PKG.install}\` (v${REACT_PKG.version}); Vue: \`${VUE_PKG.install}\`; Svelte: \`${SVELTE_PKG.install}\`. Monochrome components come from the \`/mono\` subpath (e.g. \`@dev.icons/react/mono\`). Astro projects use these packages; there is no Astro-specific package.`,
    '- Component naming: split the file name on `-`, PascalCase each part, prefix `_` for the reserved names React, Vue, Svelte, Astro (`react` → `_React`, `css` → `Css`, `discord-icon` → `DiscordIcon`, `nextjs-icon` → `NextjsIcon`). No automatic `Icon` suffix.',
    '- Props: `size` (default `"1em"`), `color` (default `"currentColor"`), `alt` (rendered as `<title>`), `mirrored`; other SVG attributes are forwarded.',
    `- Icon font: \`${FONT_PKG.install}\` (v${FONT_PKG.version}), then \`@import "devicons/css";\` and \`<i class="devicons devicons-{file}"></i>\`.`,
    `- \`${CORE_PKG.name}\` (v${CORE_PKG.version}): exports \`ICONS\` and \`getIcon(name)\` (file name, font codepoint, variant flag), plus \`dist/icons.json\`, a color sprite (\`dist/sprite/sprite-symbol.svg\`), and font files. It does not ship per-icon SVG files.`,
    '',
    '## FAQ',
    '',
    '- **Is Devicons free?** Yes. The library is MIT licensed and free for personal and commercial use. Brand logos remain trademarks of their owners.',
    '- **Which formats are available?** Color and monochrome SVG files, React/Vue/Svelte components, a color SVG sprite, and a monochrome icon font.',
    `- **How do I install it?** \`${REACT_PKG.install}\` (or \`@dev.icons/vue\`, \`@dev.icons/svelte\`), or \`${FONT_PKG.install}\` for the font. For no install, use the SVG URLs above. See [Installation](${SITE_URL}/docs/installation.md).`,
    `- **How do I request or add an icon?** Open an issue or pull request at https://github.com/vorillaz/devicons. See [Contributing](${SITE_URL}/docs/contributing.md).`,
    `- **What is the license?** MIT for the library; each logo belongs to its brand owner. Follow the brand's guidelines before implying endorsement. See [License and terms](${SITE_URL}/legal/).`,
    '',
    '## License',
    '',
    `[License and terms](${SITE_URL}/legal/): MIT for the library code; brand logos remain the property of their owners and are included for identification.`,
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
    },
  });
};
