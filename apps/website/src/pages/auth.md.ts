// auth.md: tells agents how to authenticate. Devicons has nothing to sign up
// for, so this is the self-contained form with no OAuth metadata behind it.
// Publishing /.well-known/oauth-protected-resource would make MCP clients
// start an OAuth flow against an authorization server that doesn't exist.
import type { APIRoute } from 'astro';
import { SITE_URL } from '../consts';
import { markdownResponse } from '../lib/agent-md/response';
import { API_BASE_URL, MCP_URL, OPENAPI_URL, SVG_URL_PATTERN } from '../lib/package-facts';

export const prerender = true;

export const GET: APIRoute = async () => {
  const body = `# auth.md

Devicons is public and read-only. Agents don't need to register, and there are no API keys, OAuth clients, or tokens to get.

## Audience

Any AI agent, MCP client, script, or tool that searches Devicons logos or fetches SVGs and component code.

## Registration

None. There is no registration endpoint, claim flow, or revocation endpoint, because Devicons issues no credentials.

## Endpoints

| Surface | Endpoint | Authentication |
| --- | --- | --- |
| MCP (Streamable HTTP) | \`${MCP_URL}\` | None |
| HTTP API | \`${API_BASE_URL}/\` | None |
| OpenAPI 3.1 | \`${OPENAPI_URL}\` | None |
| SVG files | \`${SVG_URL_PATTERN}\` | None |

## Using credentials

Send requests without an \`Authorization\` header. Devicons ignores any credentials it receives, and no endpoint answers with a \`401\` or a \`WWW-Authenticate\` challenge.

The site doesn't publish \`/.well-known/oauth-protected-resource\` or \`/.well-known/oauth-authorization-server\`, because there's no authorization server.

## Limits

- Requests may be rate limited per IP. A \`429\` means back off and retry later.
- Cache responses on your side. They're cached at the edge and only change on deploy.

See [agents.md](${SITE_URL}/agents.md) for every agent surface.
`;
  return markdownResponse(body);
};
