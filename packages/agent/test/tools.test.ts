import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { TOOL_NAMES, createDeviconsServer } from '../src/server.ts';
import { fakeSource } from './fixtures/fake-source.ts';

let client: Client;

beforeAll(async () => {
  const handler = createMcpHandler(() => createDeviconsServer(fakeSource(), 'test'));
  client = new Client({ name: 'test-client', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(new URL('http://local.test/api/mcp'), {
    fetch: (input, init) => handler.fetch(new Request(input, init)),
  });
  await client.connect(transport);
});

afterAll(async () => {
  await client?.close();
});

const call = (name: string, args: Record<string, unknown>) =>
  client.callTool({ name, arguments: args }) as Promise<{
    isError?: boolean;
    structuredContent?: Record<string, any>;
    content: Array<{ type: string; text?: string }>;
  }>;

describe('devicons MCP server', () => {
  it('lists exactly the four read-only tools', async () => {
    const { tools } = await client.listTools();
    expect(tools.map(t => t.name).sort()).toEqual([...TOOL_NAMES].sort());
    for (const tool of tools) {
      expect(tool.annotations?.readOnlyHint).toBe(true);
      expect(tool.annotations?.openWorldHint).toBe(false);
    }
  });

  it('search_icons ranks the exact match first', async () => {
    const res = await call('search_icons', { query: 'react' });
    expect(res.isError).toBeFalsy();
    expect(res.structuredContent?.results[0].slug).toBe('react');
  });

  it('get_icon returns Vue usage and SVG markup', async () => {
    const res = await call('get_icon', { slug: 'react', framework: 'vue' });
    expect(res.isError).toBeFalsy();
    expect(res.structuredContent?.usage.code).toContain('@dev.icons/vue');
    expect(res.structuredContent?.svg_markup.startsWith('<svg')).toBe(true);
  });

  it('get_icon omits SVG markup when include_svg is false', async () => {
    const res = await call('get_icon', { slug: 'react', include_svg: false });
    expect(res.structuredContent?.svg_markup).toBeUndefined();
  });

  it('get_icon still returns deprecated icons, flagged', async () => {
    const res = await call('get_icon', { slug: 'old-react' });
    expect(res.isError).toBeFalsy();
    expect(res.structuredContent?.deprecated).toBe(true);
  });

  it('get_icon on an unknown slug points to search_icons', async () => {
    const res = await call('get_icon', { slug: 'nope' });
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain('search_icons');
  });

  it('search_icons rejects an empty query', async () => {
    const res = await call('search_icons', { query: '' });
    expect(res.isError).toBe(true);
  });

  it('list_categories returns the categories', async () => {
    const res = await call('list_categories', {});
    expect(res.structuredContent?.categories[0].slug).toBe('frontend');
  });

  it('get_category applies the limit', async () => {
    const res = await call('get_category', { slug: 'frontend', limit: 1 });
    expect(res.structuredContent?.icons).toHaveLength(1);
  });

  it('get_category on an unknown slug points to list_categories', async () => {
    const res = await call('get_category', { slug: 'nope' });
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain('list_categories');
  });
});
