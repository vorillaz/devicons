// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import svgr from 'vite-plugin-svgr';

/** @type {(value: string) => any} */
const freq = value => value;

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

import svelte from '@astrojs/svelte';
import { deviconsDark, deviconsLight } from './src/lib/shiki-themes.ts';

// https://astro.build/config
export default defineConfig({
  cacheDir: './cache',
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  site: 'https://devicons.io',
  build: {
    inlineStylesheets: 'always',
    // Parallelize page rendering. OG image generation (satori + sharp) is
    // CPU-bound and independent per page, so a small amount of concurrency
    // shortens cold-cache builds. Keep this low — JS is single-threaded
    // and high values cause memory pressure on CI runners.
    concurrency: 2,
  },
  markdown: {
    shikiConfig: {
      themes: {
        dark: deviconsDark,
        light: deviconsLight,
      },
      defaultColor: 'dark',
      wrap: false,
    },
  },
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Bricolage Grotesque Variable',
      cssVariable: '--font-display',
      weights: ['200 900'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'IBM Plex Mono',
      cssVariable: '--font-mono',
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['ui-monospace', 'monospace'],
    },
  ],
  integrations: [
    mdx({ optimize: true }),
    sitemap({
      filter: page =>
        !page.includes('/og/') &&
        !page.includes('/search-index') &&
        !page.endsWith('/404') &&
        !page.endsWith('/404/'),
      changefreq: 'weekly',
      serialize(item) {
        const url = item.url;
        const pathname = new URL(url).pathname;
        const isRoot = /\/(?:$|index)?$/.test(pathname);
        const isIconListing =
          pathname === '/icons' ||
          pathname === '/icons/' ||
          pathname === '/icons/popular' ||
          pathname === '/icons/popular/' ||
          pathname.startsWith('/icons/tag/') ||
          pathname.startsWith('/icons/color/');
        const isIconDetail =
          pathname.startsWith('/icons/') && !isIconListing;

        if (isRoot) {
          item.priority = 1.0;
          item.changefreq = freq('daily');
        } else if (pathname.startsWith('/docs')) {
          item.priority = 0.8;
          item.changefreq = freq('weekly');
        } else if (isIconListing) {
          item.priority = 0.8;
          item.changefreq = freq('weekly');
        } else if (isIconDetail) {
          item.priority = 0.7;
          item.changefreq = freq('monthly');
        } else if (pathname.startsWith('/compare/')) {
          item.priority = 0.6;
          item.changefreq = freq('monthly');
        } else if (pathname.startsWith('/packs')) {
          item.priority = 0.6;
          item.changefreq = freq('weekly');
        } else {
          item.priority = 0.5;
        }
        return item;
      },
    }),
    react(),
    svelte(),
  ],

  vite: {
    plugins: [
      tailwindcss(),
      svgr({
        include: '**/*.svg?react',
        svgrOptions: {
          plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx'],
          svgoConfig: {
            plugins: [
              'preset-default',
              'removeTitle',
              'removeDesc',
              'removeDoctype',
              'cleanupIds',
            ],
          },
        },
      }),
    ],
  },
});
