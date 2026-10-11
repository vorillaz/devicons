import { describe, expect, it, vi } from 'vitest';
import { ApiRequestError, createHttpSource, isValidSlug } from '../src/source.ts';
import { REACT_DETAIL } from './fixtures/data.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const sourceWith = (impl: (url: string) => Promise<Response>, timeoutMs?: number) => {
  const fetch = vi.fn((input: RequestInfo | URL) => impl(String(input)));
  return {
    fetch,
    source: createHttpSource({
      baseUrl: 'https://devicons.io',
      fetch: fetch as unknown as typeof globalThis.fetch,
      timeoutMs,
    }),
  };
};

describe('isValidSlug', () => {
  it.each(['react', 'aws-s3', 'dotnet', 'node.js', '11ty'])('accepts %s', slug => {
    expect(isValidSlug(slug)).toBe(true);
  });
  it.each(['', '../etc', 'a/b', 'React', '-x', 'a..b', 'a b'])('rejects %j', slug => {
    expect(isValidSlug(slug)).toBe(false);
  });
});

describe('createHttpSource', () => {
  it('requests the static icon detail', async () => {
    const { source, fetch } = sourceWith(async () => json(REACT_DETAIL));
    await expect(source.icon('react')).resolves.toEqual(REACT_DETAIL);
    expect(String(fetch.mock.calls[0][0])).toBe(
      'https://devicons.io/api/v1/icons/react.json',
    );
  });

  it('returns null for an unknown icon', async () => {
    const { source } = sourceWith(async () =>
      json({ error: { code: 'not_found', message: 'x' } }, 404),
    );
    await expect(source.icon('nope')).resolves.toBeNull();
  });

  it('returns null for an invalid slug without fetching', async () => {
    const { source, fetch } = sourceWith(async () => json(REACT_DETAIL));
    await expect(source.icon('../x')).resolves.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('wraps a rejected fetch as a network error', async () => {
    const { source } = sourceWith(async () => {
      throw new TypeError('getaddrinfo ENOTFOUND');
    });
    const err = await source.icon('react').catch(e => e);
    expect(err).toBeInstanceOf(ApiRequestError);
    expect(err.kind).toBe('network');
  });

  it('wraps a 500 as an http error with its status', async () => {
    const { source } = sourceWith(async () => new Response('boom', { status: 500 }));
    const err = await source.categories().catch(e => e);
    expect(err).toBeInstanceOf(ApiRequestError);
    expect(err.kind).toBe('http');
    expect(err.status).toBe(500);
  });

  it('times out as a network error', async () => {
    const { source } = sourceWith(
      (url) =>
        new Promise(() => {
          void url;
        }),
      10,
    );
    const err = await source.categories().catch(e => e);
    expect(err).toBeInstanceOf(ApiRequestError);
    expect(err.kind).toBe('network');
  });

  it('rejects a response that does not match the schema', async () => {
    const { source } = sourceWith(async () => json({ nope: true }));
    const err = await source.icon('react').catch(e => e);
    expect(err).toBeInstanceOf(ApiRequestError);
    expect(err.kind).toBe('invalid');
  });

  it('builds the search URL with limit and category', async () => {
    const { source, fetch } = sourceWith(async () =>
      json({ query: 'react', count: 0, results: [] }),
    );
    await source.search('react', { limit: 5, category: 'frontend' });
    expect(String(fetch.mock.calls[0][0])).toBe(
      'https://devicons.io/api/v1/search?q=react&limit=5&category=frontend',
    );
  });

  it('fetches SVG markup from the API origin', async () => {
    const { source } = sourceWith(async () => new Response('<svg></svg>'));
    await expect(
      source.svg('https://devicons.io/devicons/icons/react.svg'),
    ).resolves.toBe('<svg></svg>');
  });

  it('refuses SVG URLs on another origin', async () => {
    const { source, fetch } = sourceWith(async () => new Response('<svg></svg>'));
    const err = await source.svg('https://evil.test/x.svg').catch(e => e);
    expect(err).toBeInstanceOf(ApiRequestError);
    expect(err.kind).toBe('invalid');
    expect(fetch).not.toHaveBeenCalled();
  });
});
