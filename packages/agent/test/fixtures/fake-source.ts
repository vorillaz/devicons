import type { DataSource } from '../../src/source.ts';
import type { Category, CategoryDetail, IconDetail } from '../../src/schema.ts';
import { buildSearchIndex, searchIcons } from '../../src/search.ts';
import { ENTRIES, REACT_DETAIL, SITE } from './data.ts';

const OLD_DETAIL: IconDetail = {
  ...REACT_DETAIL,
  slug: 'old-react',
  name: 'Old React',
  deprecated: true,
  url: `${SITE}/icons/old-react/`,
};

const DETAILS = new Map<string, IconDetail>([
  ['react', REACT_DETAIL],
  ['old-react', OLD_DETAIL],
]);

const CATEGORIES: Category[] = [
  { slug: 'frontend', label: 'Frontend', count: 3, url: `${SITE}/icons/tag/frontend/` },
];

export const SVG_MARKUP = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"></svg>';

export function fakeSource(): DataSource {
  const index = buildSearchIndex(ENTRIES);
  const byId = new Map(ENTRIES.map(e => [e.id, e]));
  return {
    async search(q, opts = {}) {
      const { results, total } = searchIcons(index, byId, q, {
        limit: opts.limit ?? 20,
        category: opts.category,
        site: SITE,
      });
      return { query: q, count: results.length, total, results };
    },
    async icon(slug) {
      return DETAILS.get(slug.trim().toLowerCase()) ?? null;
    },
    async categories() {
      return CATEGORIES;
    },
    async category(slug, limit) {
      if (slug !== 'frontend') return null;
      const detail: CategoryDetail = {
        ...CATEGORIES[0],
        icons: ENTRIES.filter(e => !e.deprecated && e.tags.includes('frontend')).map(e => ({
          slug: e.id,
          name: e.name,
          tags: e.tags,
          popular: e.popular,
          url: `${SITE}/icons/${e.id}/`,
          svg: `${SITE}/devicons/icons/${e.icons[0]}.svg`,
        })),
      };
      return limit ? { ...detail, icons: detail.icons.slice(0, limit) } : detail;
    },
    async svg() {
      return SVG_MARKUP;
    },
  };
}
