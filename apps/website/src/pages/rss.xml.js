import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';

export async function GET(context) {
  const docs = await getCollection('docs');
  const sorted = [...docs].sort(
    (a, b) => (a.data.order ?? 0) - (b.data.order ?? 0),
  );
  return rss({
    title: `${SITE_TITLE} Docs`,
    description: SITE_DESCRIPTION,
    site: context.site,
    items: sorted.map(entry => ({
      title: entry.data.title,
      description: entry.data.description ?? '',
      // The introduction doc is the docs index.
      link: entry.id === 'introduction' ? '/docs/' : `/docs/${entry.id}/`,
    })),
  });
}
