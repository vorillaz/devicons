import { describe, expect, it } from 'vitest';
import {
  buildSearchIndex,
  parseSearchParams,
  searchIcons,
  toSummary,
} from '../src/search.ts';
import { ENTRIES, SITE } from './fixtures/data.ts';

const index = buildSearchIndex(ENTRIES);
const byId = new Map(ENTRIES.map(e => [e.id, e]));
const search = (q: string, opts: { limit?: number; category?: string } = {}) =>
  searchIcons(index, byId, q, { limit: 10, site: SITE, ...opts });

describe('searchIcons', () => {
  it('ranks the exact name match first', () => {
    expect(search('react')[0].slug).toBe('react');
  });

  it('never returns deprecated icons', () => {
    const slugs = search('react').map(r => r.slug);
    expect(slugs).not.toContain('old-react');
  });

  it('filters by category slug', () => {
    const results = search('react', { category: 'mobile' });
    expect(results.map(r => r.slug)).toEqual(['react-native']);
  });

  it('respects the limit', () => {
    expect(search('javascript', { limit: 2 })).toHaveLength(2);
  });

  it('matches aliases', () => {
    expect(search('preactjs')[0].slug).toBe('preact');
  });
});

describe('toSummary', () => {
  it('builds page and primary svg URLs', () => {
    expect(toSummary(ENTRIES[0], SITE)).toEqual({
      slug: 'react',
      name: 'React',
      tags: ['frontend', 'javascript', 'ui-library'],
      popular: true,
      url: 'https://devicons.io/icons/react/',
      svg: 'https://devicons.io/devicons/icons/react.svg',
    });
  });
});

describe('parseSearchParams', () => {
  const parse = (qs: string) => parseSearchParams(new URLSearchParams(qs), 100, 20);

  it('rejects a whitespace-only query', () => {
    expect(parse('q=%20%20').ok).toBe(false);
  });

  it('rejects a missing query', () => {
    expect(parse('').ok).toBe(false);
  });

  it('rejects a query longer than 100 characters', () => {
    expect(parse(`q=${'a'.repeat(101)}`).ok).toBe(false);
  });

  it('rejects a zero limit', () => {
    expect(parse('q=react&limit=0').ok).toBe(false);
  });

  it('rejects a non-numeric limit', () => {
    expect(parse('q=react&limit=abc').ok).toBe(false);
  });

  it('rejects a limit above the maximum', () => {
    expect(parse('q=react&limit=101').ok).toBe(false);
  });

  it('keeps symbols in the query and defaults the limit', () => {
    expect(parse('q=c%2B%2B')).toEqual({ ok: true, q: 'c++', limit: 20 });
  });

  it('passes through a category slug', () => {
    expect(parse('q=react&category=frontend&limit=5')).toEqual({
      ok: true,
      q: 'react',
      limit: 5,
      category: 'frontend',
    });
  });
});
