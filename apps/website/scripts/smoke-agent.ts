// End-to-end smoke test for the agent surfaces against a running deployment:
// static API, search Function, hosted MCP (modern and 2025-era clients), and
// the built `devicons` CLI.
//
//   pnpm -F @dev.icons/website smoke:agent http://localhost:8799
//   pnpm -F @dev.icons/website smoke:agent https://devicons.io
import { execFile } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import * as z from 'zod/v4';
import {
  ApiErrorSchema,
  CategoryDetailSchema,
  CategorySchema,
  IconDetailSchema,
  IconListSchema,
  SearchResultSchema,
} from '@dev.icons/agent/schema';
import { TOOL_NAMES } from '@dev.icons/agent/server';

const base = (process.argv[2] ?? '').replace(/\/$/, '');
if (!/^https?:\/\//.test(base)) {
  console.error('Usage: smoke-agent <baseUrl>');
  process.exit(1);
}

const CLI = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../packages/font/dist/cli.mjs',
);

const results: Array<{ name: string; ok: boolean; detail?: string }> = [];

async function step(name: string, run: () => Promise<void>) {
  try {
    await run();
    results.push({ name, ok: true });
  } catch (err) {
    results.push({ name, ok: false, detail: err instanceof Error ? err.message : String(err) });
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function getJson<T>(
  pathname: string,
  schema: z.ZodType<T>,
  status = 200,
): Promise<{ data: T; res: Response }> {
  const res = await fetch(`${base}${pathname}`);
  assert(res.status === status, `expected ${status}, got ${res.status}`);
  const parsed = schema.safeParse(await res.json());
  assert(parsed.success, `unexpected body shape: ${parsed.success ? '' : parsed.error.message.slice(0, 200)}`);
  return { data: parsed.data, res };
}

await step('GET /api/v1/icons.json', async () => {
  const { data, res } = await getJson('/api/v1/icons.json', IconListSchema);
  assert(data.count > 1000, `only ${data.count} icons`);
  assert(res.headers.get('access-control-allow-origin') === '*', 'missing CORS header');
});

await step('GET /api/v1/icons/react.json', async () => {
  const { data } = await getJson('/api/v1/icons/react.json', IconDetailSchema);
  assert(data.components.react.name === '_React', 'unexpected React component name');
});

await step('GET unknown icon → 404', async () => {
  const res = await fetch(`${base}/api/v1/icons/definitely-not-an-icon.json`);
  assert(res.status === 404, `expected 404, got ${res.status}`);
  const body = ApiErrorSchema.safeParse(await res.json().catch(() => null));
  assert(body.success, '404 body is not an ApiError JSON');
});

await step('GET /api/v1/categories.json', async () => {
  const { data } = await getJson('/api/v1/categories.json', z.array(CategorySchema));
  assert(data.some(c => c.slug === 'llm'), 'llm category missing');
});

await step('GET /api/v1/categories/llm.json', async () => {
  const { data } = await getJson('/api/v1/categories/llm.json', CategoryDetailSchema);
  assert(data.icons[0]?.slug === 'openai', `first LLM icon is ${data.icons[0]?.slug}`);
});

await step('GET /api/v1/openapi.json', async () => {
  const { data } = await getJson('/api/v1/openapi.json', z.object({ openapi: z.literal('3.1.0') }));
  assert(data.openapi === '3.1.0', 'wrong OpenAPI version');
});

await step('GET /api/v1/search?q=react', async () => {
  const { data, res } = await getJson('/api/v1/search?q=react&limit=5', SearchResultSchema);
  assert(data.results[0]?.slug === 'react', `first result is ${data.results[0]?.slug}`);
  assert(data.results.length <= 5, 'limit not applied');
  assert(res.headers.get('cache-control')?.includes('max-age=300'), 'missing search Cache-Control');
  assert(res.headers.get('access-control-allow-origin') === '*', 'missing CORS header');
});

await step('GET /api/v1/search?q=c%2B%2B&category=c-plus-plus', async () => {
  const { data } = await getJson('/api/v1/search?q=c%2B%2B&category=c-plus-plus', SearchResultSchema);
  assert(data.results.every(r => r.tags.includes('c++')), 'category filter leaked');
});

await step('GET /api/v1/search?q= → 400', async () => {
  const { data } = await getJson('/api/v1/search?q=', ApiErrorSchema, 400);
  assert(data.error.code === 'invalid_param', `code ${data.error.code}`);
});

await step('MCP tools over Streamable HTTP', async () => {
  const client = new Client({ name: 'devicons-smoke', version: '1.0.0' });
  await client.connect(new StreamableHTTPClientTransport(new URL(`${base}/api/mcp`)));
  try {
    const { tools } = await client.listTools();
    assert(
      JSON.stringify(tools.map(t => t.name).sort()) === JSON.stringify([...TOOL_NAMES].sort()),
      `tools: ${tools.map(t => t.name).join(', ')}`,
    );
    const search = (await client.callTool({ name: 'search_icons', arguments: { query: 'postgres' } })) as {
      structuredContent?: { results: Array<{ slug: string }> };
    };
    assert(search.structuredContent?.results[0]?.slug === 'postgresql', 'search_icons did not find postgresql');
    const icon = (await client.callTool({ name: 'get_icon', arguments: { slug: 'react' } })) as {
      structuredContent?: { svg_markup?: string };
    };
    assert(icon.structuredContent?.svg_markup?.startsWith('<svg'), 'get_icon returned no SVG markup');
    const cats = (await client.callTool({ name: 'list_categories', arguments: {} })) as {
      structuredContent?: { categories: unknown[] };
    };
    assert((cats.structuredContent?.categories.length ?? 0) > 100, 'list_categories too short');
    const cat = (await client.callTool({ name: 'get_category', arguments: { slug: 'database', limit: 3 } })) as {
      structuredContent?: { icons: unknown[] };
    };
    assert(cat.structuredContent?.icons.length === 3, 'get_category limit not applied');
  } finally {
    await client.close();
  }
});

await step('MCP 2025-era initialize (legacy client)', async () => {
  const res = await fetch(`${base}/api/mcp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'legacy-smoke', version: '1.0.0' },
      },
    }),
  });
  assert(res.status === 200, `expected 200, got ${res.status}`);
  const text = await res.text();
  assert(text.includes('"serverInfo"') && text.includes('devicons'), 'no serverInfo in initialize result');
});

await step('GET /api/mcp from a browser → 405', async () => {
  const res = await fetch(`${base}/api/mcp`, { headers: { Accept: 'text/html' } });
  assert(res.status === 405, `expected 405, got ${res.status}`);
  const body = ApiErrorSchema.safeParse(await res.json().catch(() => null));
  assert(body.success && body.data.error.message.includes('/docs/mcp/'), 'no docs pointer');
});

await step('OPTIONS /api/mcp (CORS preflight) → 204', async () => {
  const res = await fetch(`${base}/api/mcp`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://example.com',
      'Access-Control-Request-Method': 'POST',
      // 2026-07-28 clients send mcp-method on every request and mcp-name on tools/call.
      'Access-Control-Request-Headers': 'content-type, mcp-protocol-version, mcp-method, mcp-name',
    },
  });
  assert(res.status === 204, `expected 204, got ${res.status}`);
  assert(res.headers.get('access-control-allow-origin') === '*', 'missing CORS origin');
  const allowed = res.headers.get('access-control-allow-headers')?.toLowerCase() ?? '';
  for (const header of ['mcp-protocol-version', 'mcp-method', 'mcp-name']) {
    assert(allowed.includes(header), `${header} not allowed`);
  }
});

await step('CLI: devicons search react --json', async () => {
  const { stdout } = await promisify(execFile)(
    process.execPath,
    [CLI, 'search', 'react', '--json', '--api', base],
    { timeout: 30_000 },
  );
  const parsed = SearchResultSchema.parse(JSON.parse(stdout));
  assert(parsed.results[0]?.slug === 'react', 'CLI search did not rank react first');
});

await step('CLI: devicons svg react --mono against this deployment', async () => {
  const { stdout } = await promisify(execFile)(
    process.execPath,
    [CLI, 'svg', 'react', '--mono', '--api', base],
    { timeout: 30_000 },
  );
  assert(stdout.trimStart().startsWith('<svg'), 'CLI svg did not print SVG markup');
});

const width = Math.max(...results.map(r => r.name.length));
for (const r of results) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name.padEnd(width)}${r.detail ? `  — ${r.detail}` : ''}`);
}
const failed = results.filter(r => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed against ${base}`);
process.exit(failed ? 1 : 0);
