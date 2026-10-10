import type { APIRoute } from 'astro';
import { markdownResponse } from '../lib/agent-md/response';

export const prerender = true;

export const GET: APIRoute = async () => {
  const md = [
    '[Home](/index.md) › Search',
    '',
    '# Search',
    '',
    'The HTML search page uses a client-side [MiniSearch](https://lucaong.github.io/minisearch/) index. For agents, the raw index is available as JSON — fetch it once and run whatever search you need locally.',
    '',
    '## Index URL',
    '',
    '- [/search-index.json](/search-index.json) — one record per icon entry: `{ id, name, description, icons, tags, deprecated, popular, badInDark, badInLight, version?, aliases? }`. Skip records with `deprecated: true`.',
    '',
    '## Direct lookup by slug',
    '',
    'Every icon has a stable slug (`id` in the index). Fetch `/icons/<slug>.md` directly — e.g. [/icons/react.md](/icons/react.md), [/icons/postgresql.md](/icons/postgresql.md).',
    '',
    'The HTML search page also accepts a query string: `/search/?q=<term>`.',
    '',
    '## Browse',
    '',
    '- [All icons](/icons.md)',
    '- [Packs](/packs.md)',
    '- [Docs](/docs.md)',
  ].join('\n');

  return markdownResponse(md);
};
