// MCP server discovery: describes the hosted Devicons MCP server so clients
// and registries can find it from the domain alone.
import type { APIRoute } from 'astro';
import { SERVER_INSTRUCTIONS, TOOL_NAMES } from '@dev.icons/agent/server';
import { SITE_URL } from '../../consts';
import { MCP_LOCAL_COMMAND, MCP_URL, formatCount, getActiveIconCount } from '../../lib/package-facts';

export const prerender = true;

export const GET: APIRoute = async () => {
  const count = formatCount(await getActiveIconCount());
  const card = {
    name: 'devicons',
    title: 'Devicons',
    description: `Search ${count} developer, brand, framework, and tooling logos and get SVG markup or React, Vue, and Svelte code.`,
    version: '1.0.0',
    url: MCP_URL,
    transport: 'streamable-http',
    authentication: 'none',
    readOnly: true,
    tools: [...TOOL_NAMES],
    instructions: SERVER_INSTRUCTIONS,
    local: { command: 'npx', args: MCP_LOCAL_COMMAND.split(' ').slice(1) },
    documentation: `${SITE_URL}/docs/mcp/`,
    homepage: SITE_URL,
    repository: 'https://github.com/vorillaz/devicons',
    license: 'MIT',
  };

  return new Response(JSON.stringify(card, null, 2) + '\n', {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
    },
  });
};
