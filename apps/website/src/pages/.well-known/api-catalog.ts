import type { APIRoute } from 'astro';
import { SITE_URL, GITHUB_URL } from '../../consts';

export const prerender = true;

export const GET: APIRoute = async () => {
  const catalog = {
    linkset: [
      {
        anchor: `${SITE_URL}/search-index.json`,
        'service-doc': [
          { href: `${SITE_URL}/docs/`, type: 'text/html' },
          { href: `${SITE_URL}/docs.md`, type: 'text/markdown' },
        ],
        describedby: [{ href: GITHUB_URL, type: 'text/html' }],
      },
      {
        anchor: `${SITE_URL}/llms.txt`,
        'service-doc': [
          { href: `${SITE_URL}/docs/`, type: 'text/html' },
          { href: `${SITE_URL}/llms-full.txt`, type: 'text/plain' },
        ],
      },
      {
        anchor: `${SITE_URL}/.well-known/agent-skills/index.json`,
        'service-doc': [
          { href: `${SITE_URL}/docs/skill/`, type: 'text/html' },
          {
            href: `${SITE_URL}/.well-known/agent-skills/devicons/SKILL.md`,
            type: 'text/markdown',
          },
        ],
      },
    ],
  };

  return new Response(JSON.stringify(catalog, null, 2) + '\n', {
    headers: {
      'Content-Type': 'application/linkset+json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
    },
  });
};
