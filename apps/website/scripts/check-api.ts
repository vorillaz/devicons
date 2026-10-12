// Validates the built agent surfaces in dist/ before deploy: every static API
// file against the shared zod schemas, plus the discovery files, docs pages,
// and homepage links that point agents and people at them.
//
//   pnpm -F @dev.icons/website build && pnpm -F @dev.icons/website check:api
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as z from 'zod/v4';
import {
  CategoryDetailSchema,
  CategorySchema,
  IconDetailSchema,
  IconListSchema,
} from '@dev.icons/agent/schema';
import { TOOL_NAMES } from '@dev.icons/agent/server';

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const API = path.join(DIST, 'api/v1');
const MCP_URL = 'https://devicons.io/api/mcp';

const failures: string[] = [];
const fail = (msg: string) => failures.push(msg);

const readJson = (file: string): unknown => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    fail(`${path.relative(DIST, file)}: ${(err as Error).message}`);
    return undefined;
  }
};

const check = <T>(schema: z.ZodType<T>, file: string): T | undefined => {
  const data = readJson(file);
  if (data === undefined) return undefined;
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    fail(`${path.relative(DIST, file)}: ${z.prettifyError(parsed.error).split('\n')[0]}`);
    return undefined;
  }
  return parsed.data;
};

const jsonFiles = (dir: string) =>
  fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.json')) : [];

function checkStaticApi() {
  const list = check(IconListSchema, path.join(API, 'icons.json'));
  const details = jsonFiles(path.join(API, 'icons'));
  for (const file of details) check(IconDetailSchema, path.join(API, 'icons', file));

  if (list) {
    if (list.count !== list.icons.length) {
      fail(`icons.json: count ${list.count} != ${list.icons.length} icons`);
    }
    const detailSlugs = new Set(details.map(f => f.replace(/\.json$/, '')));
    const missing = list.icons.filter(i => !detailSlugs.has(i.slug)).map(i => i.slug);
    if (missing.length) fail(`icons/: missing detail files for ${missing.slice(0, 5).join(', ')}`);
  }

  const categories = check(z.array(CategorySchema), path.join(API, 'categories.json'));
  const categoryFiles = jsonFiles(path.join(API, 'categories'));
  for (const file of categoryFiles) {
    check(CategoryDetailSchema, path.join(API, 'categories', file));
  }
  if (categories && categories.length !== categoryFiles.length) {
    fail(`categories: ${categories.length} listed, ${categoryFiles.length} detail files`);
  }

  const openapi = readJson(path.join(API, 'openapi.json')) as { openapi?: string } | undefined;
  if (openapi && openapi.openapi !== '3.1.0') fail('openapi.json: openapi must be "3.1.0"');

  const react = readJson(path.join(API, 'icons/react.json')) as
    | { variants?: Array<{ label: string }> }
    | undefined;
  if (react?.variants?.length === 1 && react.variants[0].label !== 'Logo') {
    fail(`icons/react.json: single variant labelled "${react.variants[0].label}", expected "Logo"`);
  }

  const index = readJson(path.join(API, 'index.html')) as
    | { openapi?: string; docs?: string; endpoints?: Record<string, string> }
    | undefined;
  if (index && (index.openapi !== 'https://devicons.io/api/v1/openapi.json' || !index.endpoints?.search)) {
    fail('api/v1/index.html: expected an API index with openapi and endpoints');
  }

  const prebuilt = readJson(path.join(API, 'search-index.json')) as
    | { version?: number; entries?: unknown[]; index?: unknown }
    | undefined;
  if (prebuilt && (prebuilt.version !== 1 || !prebuilt.entries?.length || !prebuilt.index)) {
    fail('api/v1/search-index.json: expected { version: 1, entries, index }');
  }

  const notFound = path.join(API, '404.html');
  if (!fs.existsSync(notFound)) fail('api/v1/404.html is missing');
  else check(z.object({ error: z.object({ code: z.literal('not_found') }) }), notFound);
}

const readText = (rel: string): string => {
  const file = path.join(DIST, rel);
  if (!fs.existsSync(file)) {
    fail(`${rel} is missing`);
    return '';
  }
  return fs.readFileSync(file, 'utf8');
};

function checkDiscovery() {
  const mcp = readJson(path.join(DIST, '.well-known/mcp.json')) as
    | { url?: string; tools?: string[]; transport?: string }
    | undefined;
  if (mcp) {
    if (mcp.url !== MCP_URL) fail(`.well-known/mcp.json: url is ${mcp.url}`);
    if (mcp.transport !== 'streamable-http') fail('.well-known/mcp.json: transport');
    if (JSON.stringify(mcp.tools) !== JSON.stringify([...TOOL_NAMES])) {
      fail(`.well-known/mcp.json: tools ${JSON.stringify(mcp.tools)}`);
    }
  }

  if (!readText('agents.md').includes(MCP_URL)) fail('agents.md does not mention the MCP URL');

  const llms = readText('llms.txt');
  if (!llms.includes('## Agent integrations')) fail('llms.txt: no "## Agent integrations" section');
  if (!llms.includes(MCP_URL)) fail('llms.txt: no MCP URL');

  const catalog = readJson(path.join(DIST, '.well-known/api-catalog')) as
    | { linkset?: Array<{ anchor: string }> }
    | undefined;
  const anchors = catalog?.linkset?.map(l => l.anchor) ?? [];
  for (const anchor of ['https://devicons.io/api/v1/', MCP_URL]) {
    if (!anchors.includes(anchor)) fail(`api-catalog: missing anchor ${anchor}`);
  }

  const skill = readText('.well-known/agent-skills/devicons/SKILL.md');
  if (!skill.includes(MCP_URL)) fail('SKILL.md does not mention the MCP server');
  const index = readJson(path.join(DIST, '.well-known/agent-skills/index.json')) as
    | { skills?: Array<{ digest: string }> }
    | undefined;
  const digest = `sha256:${createHash('sha256').update(skill, 'utf8').digest('hex')}`;
  if (index?.skills?.[0]?.digest !== digest) fail('agent-skills index digest does not match SKILL.md');
}

const AGENT_DOCS = ['agents', 'mcp', 'api', 'cli'];

function checkDocs() {
  const sitemap = readText('sitemap-0.xml');
  for (const slug of AGENT_DOCS) {
    const html = readText(`docs/${slug}/index.html`);
    if (!html) continue;
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
    if (!title || title.length > 60) fail(`docs/${slug}: title "${title}" (${title.length} chars)`);
    const h1s = html.match(/<h1[\s>]/g)?.length ?? 0;
    if (h1s !== 1) fail(`docs/${slug}: ${h1s} <h1> elements`);
    if (!sitemap.includes(`<loc>https://devicons.io/docs/${slug}/</loc>`)) {
      fail(`sitemap: missing /docs/${slug}/`);
    }
  }
}

function checkHomepage() {
  const html = readText('index.html');
  // One command per hero agent tab (Prompt, MCP, Skill, CLI, API).
  for (const needle of [
    'devicons.io/skill.md',
    `npx add-mcp ${MCP_URL}`,
    'npx skills add https://devicons.io',
    'npx devicons add',
    '/api/v1/search?q=',
  ]) {
    if (!html.includes(needle)) fail(`index.html: missing ${needle}`);
  }
}

const checks: Array<[string, () => void]> = [
  ['static API', checkStaticApi],
  ['discovery files', checkDiscovery],
  ['agent docs', checkDocs],
  ['homepage agent strip', checkHomepage],
];

for (const [name, run] of checks) {
  const before = failures.length;
  run();
  console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} ${name}`);
}

if (failures.length) {
  console.error(`\n${failures.length} problem(s):`);
  for (const f of failures) console.error(`- ${f}`);
  process.exit(1);
}
