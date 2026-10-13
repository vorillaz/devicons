// Agent readiness manifest: every way an AI agent can use Devicons, on one
// page. Linked from llms.txt and /docs/agents/.
import type { APIRoute } from 'astro';
import { TOOL_NAMES } from '@dev.icons/agent/server';
import { SITE_URL } from '../consts';
import { markdownResponse } from '../lib/agent-md/response';
import {
  API_BASE_URL,
  MCP_ADD_CLAUDE,
  MCP_LOCAL_COMMAND,
  MCP_URL,
  OPENAPI_URL,
  formatCount,
  getActiveIconCount,
} from '../lib/package-facts';

export const prerender = true;

export const GET: APIRoute = async () => {
  const count = formatCount(await getActiveIconCount());
  const body = `# Devicons — agent readiness

Devicons is a free, MIT-licensed library of ${count} developer, brand, framework, and tooling logos. Agents can search it, fetch SVGs, and generate React, Vue, or Svelte code through any of the surfaces below. Everything is read-only and needs no API key.

## Surfaces

| Surface | Entry point | Docs |
| --- | --- | --- |
| MCP (hosted) | \`${MCP_URL}\` (Streamable HTTP, stateless) | [${SITE_URL}/docs/mcp/](${SITE_URL}/docs/mcp/) |
| MCP (local stdio) | \`${MCP_LOCAL_COMMAND}\` | [${SITE_URL}/docs/mcp/](${SITE_URL}/docs/mcp/) |
| HTTP API | \`${API_BASE_URL}/\` | [${SITE_URL}/docs/api/](${SITE_URL}/docs/api/) |
| OpenAPI 3.1 | \`${OPENAPI_URL}\` | — |
| CLI | \`npx devicons search <query>\` | [${SITE_URL}/docs/cli/](${SITE_URL}/docs/cli/) |
| Skill | \`${SITE_URL}/skill.md\` | [${SITE_URL}/docs/skill/](${SITE_URL}/docs/skill/) |
| llms.txt | \`${SITE_URL}/llms.txt\`, \`${SITE_URL}/llms-full.txt\` | — |

MCP tools: ${TOOL_NAMES.map(t => `\`${t}\``).join(', ')}.

Quick start for Claude Code:

\`\`\`bash
${MCP_ADD_CLAUDE}
\`\`\`

## Discovery

- MCP server card: ${SITE_URL}/.well-known/mcp.json
- API catalog (RFC 9727): ${SITE_URL}/.well-known/api-catalog
- Agent Skills index: ${SITE_URL}/.well-known/agent-skills/index.json
- Authentication: ${SITE_URL}/auth.md (none needed)
- Every HTML page has a Markdown twin (\`/icons/react.md\`) and answers \`Accept: text/markdown\`.

## Limits and terms

- Read-only and unauthenticated. Responses are cached at the edge; please cache on your side too.
- Requests may be rate limited per IP; a 429 means back off and retry later.
- SVG files and packages are MIT licensed. Logos are trademarks of their owners; follow each brand's guidelines.
- Don't use the API to rebuild a competing icon catalog. It's meant for tools, plugins, and agents that help people use these logos.
`;
  return markdownResponse(body);
};
