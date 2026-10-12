import type { APIRoute } from 'astro';
import { getIcons } from '../../lib/icons-query';
import { renderOgImage } from '../../lib/og/render';
import { ogShell } from '../../lib/og/layout';

export const GET: APIRoute = async () => {
  const icons = await getIcons();
  const count = icons.filter(i => !i.data.deprecated).length;

  const png = await renderOgImage(
    ogShell({
      eyebrow: 'devicons.io / search',
      category: 'Search',
      title: 'Search the Devicons catalog',
      description: `Find any of ${count.toLocaleString()} developer logos by name, tag, or brand color.`,
    }),
  );

  return new Response(png as unknown as BodyInit, {
    headers: { 'Content-Type': 'image/png' },
  });
};
