import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { run, type CliIO } from '../src/cli.ts';
import { ApiRequestError, type DataSource } from '../src/source.ts';
import { SearchResultSchema } from '../src/schema.ts';
import { fakeSource, SVG_MARKUP } from './fixtures/fake-source.ts';

function makeIo(overrides: Partial<CliIO> = {}) {
  const files = new Map<string, string>();
  const out: string[] = [];
  const err: string[] = [];
  const io: CliIO = {
    stdout: s => out.push(s),
    stderr: s => err.push(s),
    source: fakeSource(),
    cwd: '/work',
    version: '9.9.9',
    writeFile: async (p, data) => {
      files.set(p, data);
    },
    exists: async p => files.has(p),
    mkdir: async () => {},
    ...overrides,
  };
  return { io, files, stdout: () => out.join(''), stderr: () => err.join('') };
}

describe('devicons CLI', () => {
  it('search --json prints a SearchResult', async () => {
    const t = makeIo();
    expect(await run(['search', 'react', '--json'], t.io)).toBe(0);
    const parsed = SearchResultSchema.parse(JSON.parse(t.stdout()));
    expect(parsed.results[0].slug).toBe('react');
  });

  it('search prints a readable table by default', async () => {
    const t = makeIo();
    expect(await run(['search', 'react'], t.io)).toBe(0);
    expect(t.stdout()).toMatch(/react\s+React/);
  });

  it('search with an invalid limit is a usage error', async () => {
    const t = makeIo();
    expect(await run(['search', 'react', '--limit', 'abc'], t.io)).toBe(1);
  });

  it('info on an unknown slug exits 2', async () => {
    const t = makeIo();
    expect(await run(['info', 'nope'], t.io)).toBe(2);
    expect(t.stderr()).toContain('not found');
  });

  it('info without a slug exits 1 and shows usage', async () => {
    const t = makeIo();
    expect(await run(['info'], t.io)).toBe(1);
    expect(t.stderr()).toContain('Usage');
  });

  it('svg --mono prints the monochrome variant', async () => {
    const source = fakeSource();
    const svgSpy = vi.spyOn(source, 'svg');
    const t = makeIo({ source });
    expect(await run(['svg', 'react', '--mono'], t.io)).toBe(0);
    expect(t.stdout()).toBe(SVG_MARKUP);
    expect(svgSpy).toHaveBeenCalledWith('https://devicons.io/devicons/font/react.svg');
  });

  it('svg with an unknown variant exits 2 and lists the variants', async () => {
    const t = makeIo();
    expect(await run(['svg', 'react', '--variant', 'nope'], t.io)).toBe(2);
    expect(t.stderr()).toContain('react');
  });

  it('add writes one SVG per slug into --out', async () => {
    const t = makeIo();
    expect(await run(['add', 'react', '--out', 'icons'], t.io)).toBe(0);
    expect(t.files.get(path.join('/work', 'icons', 'react.svg'))).toBe(SVG_MARKUP);
    expect(t.stdout()).toContain('wrote');
  });

  it('add skips existing files without --force', async () => {
    const t = makeIo();
    const file = path.join('/work', 'icons', 'react.svg');
    t.files.set(file, 'old');
    expect(await run(['add', 'react'], t.io)).toBe(0);
    expect(t.files.get(file)).toBe('old');
    expect(t.stdout()).toContain('skipped');
  });

  it('add --force overwrites existing files', async () => {
    const t = makeIo();
    const file = path.join('/work', 'icons', 'react.svg');
    t.files.set(file, 'old');
    expect(await run(['add', 'react', '--force'], t.io)).toBe(0);
    expect(t.files.get(file)).toBe(SVG_MARKUP);
  });

  it('add --out / writes at the filesystem root', async () => {
    const t = makeIo();
    expect(await run(['add', 'react', '--out', '/'], t.io)).toBe(0);
    expect(t.files.get(path.join('/', 'react.svg'))).toBe(SVG_MARKUP);
  });

  it('info accepts a slug in any case', async () => {
    const t = makeIo();
    expect(await run(['info', 'React'], t.io)).toBe(0);
    expect(t.stdout()).toContain('React (react)');
  });

  it('an invalid --api URL is a usage error without a stack trace', async () => {
    const t = makeIo({ source: undefined });
    expect(await run(['search', 'react', '--api', 'devicons.io'], t.io)).toBe(1);
    expect(t.stderr()).toContain('Invalid API base URL');
    expect(t.stderr()).not.toMatch(/\n\s+at /);
  });

  it('an invalid DEVICONS_API is a usage error', async () => {
    const t = makeIo({ source: undefined, env: { DEVICONS_API: 'localhost:8799' } });
    expect(await run(['search', 'react'], t.io)).toBe(1);
    expect(t.stderr()).toContain('Invalid API base URL');
  });

  it('add rejects path traversal and writes nothing', async () => {
    const t = makeIo();
    expect(await run(['add', '../evil'], t.io)).toBe(1);
    expect(t.files.size).toBe(0);
  });

  it('add reports unknown slugs with exit 2 but still writes the rest', async () => {
    const t = makeIo();
    expect(await run(['add', 'react', 'nope'], t.io)).toBe(2);
    expect(t.files.has(path.join('/work', 'icons', 'react.svg'))).toBe(true);
  });

  it('network failures exit 3 with a one-line message and no stack', async () => {
    const source: DataSource = {
      ...fakeSource(),
      search: async () => {
        throw new ApiRequestError('network', 'Could not reach https://devicons.io: ENOTFOUND');
      },
    };
    const t = makeIo({ source });
    expect(await run(['search', 'react'], t.io)).toBe(3);
    expect(t.stderr().trim().split('\n')).toHaveLength(1);
    expect(t.stderr()).not.toMatch(/\n\s+at /);
  });

  it('filesystem failures exit 4', async () => {
    const t = makeIo({
      writeFile: async () => {
        throw new Error('EACCES: permission denied');
      },
    });
    expect(await run(['add', 'react'], t.io)).toBe(4);
    expect(t.stderr()).toContain('EACCES');
  });

  it('categories --json prints the category list', async () => {
    const t = makeIo();
    expect(await run(['categories', '--json'], t.io)).toBe(0);
    expect(JSON.parse(t.stdout())[0].slug).toBe('frontend');
  });

  it('category applies --limit', async () => {
    const t = makeIo();
    expect(await run(['category', 'frontend', '--limit', '1', '--json'], t.io)).toBe(0);
    expect(JSON.parse(t.stdout()).icons).toHaveLength(1);
  });

  it('mcp starts the stdio server with the source', async () => {
    const serveMcp = vi.fn(async () => {});
    const t = makeIo({ serveMcp });
    expect(await run(['mcp'], t.io)).toBe(0);
    expect(serveMcp).toHaveBeenCalledOnce();
  });

  it('--version prints the version', async () => {
    const t = makeIo();
    expect(await run(['--version'], t.io)).toBe(0);
    expect(t.stdout().trim()).toBe('9.9.9');
  });

  it('--help prints usage and exits 0', async () => {
    const t = makeIo();
    expect(await run(['--help'], t.io)).toBe(0);
    expect(t.stdout()).toContain('Usage');
  });

  it('no arguments prints usage and exits 1', async () => {
    const t = makeIo();
    expect(await run([], t.io)).toBe(1);
    expect(t.stderr()).toContain('Usage');
  });

  it('an unknown flag is a usage error', async () => {
    const t = makeIo();
    expect(await run(['search', 'react', '--nope'], t.io)).toBe(1);
  });

  it('an unknown command is a usage error', async () => {
    const t = makeIo();
    expect(await run(['explode'], t.io)).toBe(1);
  });
});
