import type { APIRoute } from 'astro';
import { getIcons } from '../lib/icons-query';
import { SITE_TITLE, SITE_DESCRIPTION, GITHUB_URL } from '../consts';
import { markdownResponse } from '../lib/agent-md/response';
import { SVG_URL_PATTERN, formatCount } from '../lib/package-facts';

export const prerender = true;

export const GET: APIRoute = async () => {
  const icons = await getIcons();
  const active = icons.filter(i => !i.data.deprecated);
  const popular = active.filter(i => i.data.popular).slice(0, 10);

  const md = [
    `# ${SITE_TITLE}`,
    '',
    SITE_DESCRIPTION,
    '',
    `${formatCount(active.length)} developer, brand, framework, and tooling SVG logos. MIT licensed.`,
    '',
    '## Sections',
    '',
    '- [Docs](/docs.md) — installation, usage, framework guides, CDN, theming',
    '- [Icons catalog](/icons.md) — browse every icon in the library',
    '- [Packs](/packs.md) — curated bundles (AI Toolkit, JAMstack, MERN, etc.)',
    '- [Compare](/compare.md) — side-by-side logo comparisons',
    '- [Skill](/skill.md) — the `skill.md` file for AI agents',
    '- [Legal](/legal.md) — MIT license and brand-asset terms',
    '',
    '## Popular icons',
    '',
    ...popular.map(i => `- [${i.data.name}](/icons/${i.id}.md)`),
    '',
    '## Install',
    '',
    '```bash',
    'npm install @dev.icons/react  # or @dev.icons/vue, @dev.icons/svelte',
    '```',
    '',
    '```tsx',
    'import { _React, Css } from "@dev.icons/react";',
    '// monochrome: import { Css } from "@dev.icons/react/mono";',
    '',
    '<_React size={32} />',
    '<Css size={32} alt="CSS" />',
    '```',
    '',
    'Component names come from the icon file name: split on `-`, PascalCase, `_` prefix for React/Vue/Svelte/Astro (`react` → `_React`, `discord-icon` → `DiscordIcon`).',
    '',
    `Every icon is also a plain SVG at \`${SVG_URL_PATTERN}\`, a glyph in the \`devicons\` icon font, and a symbol in the \`@dev.icons/core\` sprite. See [CDN docs](/docs/cdn.md).`,
    '',
    '## For agents',
    '',
    '- [llms.txt](/llms.txt) and [llms-full.txt](/llms-full.txt)',
    '- Discovery index: [/.well-known/agent-skills/index.json](/.well-known/agent-skills/index.json)',
    '- Skill reference: [/.well-known/agent-skills/devicons/SKILL.md](/.well-known/agent-skills/devicons/SKILL.md)',
    '- Search index (JSON): [/search-index.json](/search-index.json)',
    '- Every content page has a `.md` counterpart (this file, `/docs/<slug>.md`, `/icons/<slug>.md`, `/packs/<slug>.md`, `/compare/<slug>.md`).',
    '',
    '## Links',
    '',
    `- Source: ${GITHUB_URL}`,
    '- Website: https://devicons.io',
  ].join('\n');

  return markdownResponse(md);
};
