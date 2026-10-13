import { describe, expect, it } from 'vitest';
import { TOOL_NAMES } from '../src/tools.ts';
import { runWebmcpTool, webmcpToolSpecs } from '../src/webmcp.ts';
import { fakeSource } from './fixtures/fake-source.ts';

describe('WebMCP tools', () => {
  it('specs cover every MCP tool with a JSON Schema object input', () => {
    const specs = webmcpToolSpecs();
    expect(specs.map(s => s.name)).toEqual([...TOOL_NAMES]);
    for (const spec of specs) {
      expect(spec.description.length).toBeGreaterThan(0);
      expect(spec.inputSchema.type).toBe('object');
      expect(spec.annotations.readOnlyHint).toBe(true);
    }
  });

  it('specs survive a JSON round trip unchanged', () => {
    const specs = webmcpToolSpecs();
    expect(JSON.parse(JSON.stringify(specs))).toEqual(specs);
  });

  it('search_icons input requires query and documents the limit default', () => {
    const search = webmcpToolSpecs().find(s => s.name === 'search_icons')!;
    const props = search.inputSchema.properties as Record<string, Record<string, unknown>>;
    expect(search.inputSchema.required).toEqual(['query']);
    expect(props.limit.default).toBe(10);
  });

  it('runs a tool with the same parsing as the MCP server', async () => {
    const res = await runWebmcpTool(fakeSource(), 'get_icon', { slug: ' React ', include_svg: false });
    expect(res.isError).toBeFalsy();
    expect(res.structuredContent?.slug).toBe('react');
  });

  it('applies schema defaults', async () => {
    const res = await runWebmcpTool(fakeSource(), 'get_icon', { slug: 'react' });
    expect((res.structuredContent?.usage as { code: string }).code).toContain('@dev.icons/react');
    expect(res.structuredContent?.svg_markup).toBeDefined();
  });

  it('returns readable errors instead of rejecting', async () => {
    const invalid = await runWebmcpTool(fakeSource(), 'search_icons', { query: '' });
    expect(invalid.isError).toBe(true);
    expect(invalid.content[0].text).toContain('search_icons');

    const unknown = await runWebmcpTool(fakeSource(), 'delete_icon', {});
    expect(unknown.isError).toBe(true);

    const missing = await runWebmcpTool(fakeSource(), 'get_icon', { slug: 'nope' });
    expect(missing.content[0].text).toContain('search_icons');
  });

  it('turns unexpected handler errors into an isError result', async () => {
    const source = { ...fakeSource(), categories: () => Promise.reject(new Error('boom')) };
    const res = await runWebmcpTool(source, 'list_categories', undefined);
    expect(res.isError).toBe(true);
  });
});
