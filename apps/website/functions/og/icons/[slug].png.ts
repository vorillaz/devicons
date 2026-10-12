/**
 * Cloudflare Pages Function: /og/icons/<slug>.png
 *
 * Replaces the build-time prerender of 1,200+ icon OG images (satori + sharp
 * in CI) with on-demand rendering at the edge. First hit per slug pays the
 * ~200-400ms render cost; every subsequent hit is served from the Cloudflare
 * edge cache thanks to the immutable CDN-Cache-Control header.
 *
 * Requires the Cloudflare Pages project to have the `nodejs_compat`
 * compatibility flag enabled (Settings → Functions → Compatibility flags).
 */

import {
  ogErrorResponse,
  ogPngResponse,
  renderOgPng,
} from '../../../src/lib/og/edge';

const OG = {
  width: 1200,
  height: 630,
  bg: '#000000',
  border: '#1a1a1a',
  text: '#e6e6e6',
  textMuted: '#8a8a8a',
  accent: '#ff4d00',
  // Mirrors `.icon-grid-card--bad-dark` in global.css: a near-white slab
  // behind icons flagged `badInDark` so they stay legible on the dark canvas.
  badInDarkSlab: '#f5f5f5',
  fontDisplay: 'Display',
  fontMono: 'Mono',
} as const;

interface IndexEntry {
  id: string;
  name: string;
  description?: string;
  icons?: string[];
  tags?: string[];
  badInDark?: boolean;
}

// Module scope — reused across requests on the same isolate.
let indexCache: IndexEntry[] | null = null;

async function loadIndex(origin: string) {
  if (indexCache) return indexCache;
  const res = await fetch(`${origin}/search-index.json`);
  if (!res.ok) throw new Error(`search-index fetch failed (${res.status})`);
  indexCache = (await res.json()) as IndexEntry[];
  return indexCache;
}

async function fetchIconAsDataUri(
  slug: string,
  origin: string,
): Promise<string | null> {
  const res = await fetch(`${origin}/devicons/icons/${slug}.svg`);
  if (!res.ok) return null;
  const text = await res.text();
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return `data:image/svg+xml;base64,${btoa(binary)}`;
}

function buildJsx(
  name: string,
  description: string | undefined,
  iconImages: string[],
  tagList: string,
  badInDark: boolean,
) {
  return {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        backgroundColor: OG.bg,
        position: 'relative',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `linear-gradient(${OG.border} 1px, transparent 1px), linear-gradient(90deg, ${OG.border} 1px, transparent 1px)`,
              backgroundSize: '48px 48px',
              opacity: 0.3,
            },
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              padding: '60px',
              flex: 1,
              position: 'relative',
              justifyContent: 'space-between',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          width: '40px',
                          height: '40px',
                          backgroundColor: OG.accent,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          clipPath:
                            'polygon(0 0, 100% 0, 100% 100%, 12% 100%, 0 88%)',
                        },
                        children: {
                          type: 'span',
                          props: {
                            style: {
                              fontFamily: OG.fontDisplay,
                              fontSize: '28px',
                              color: OG.bg,
                            },
                            children: 'D',
                          },
                        },
                      },
                    },
                    {
                      type: 'span',
                      props: {
                        style: {
                          fontFamily: OG.fontMono,
                          fontSize: '13px',
                          color: OG.textMuted,
                          letterSpacing: '0.18em',
                          textTransform: 'uppercase',
                        },
                        children: 'devicons.io',
                      },
                    },
                  ],
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                        },
                        children: [
                          {
                            type: 'div',
                            props: {
                              style: {
                                width: '12px',
                                height: '2px',
                                backgroundColor: OG.accent,
                              },
                            },
                          },
                          {
                            type: 'span',
                            props: {
                              style: {
                                fontFamily: OG.fontMono,
                                fontSize: '13px',
                                color: OG.accent,
                                letterSpacing: '0.18em',
                                textTransform: 'uppercase',
                              },
                              children: 'Icon',
                            },
                          },
                        ],
                      },
                    },
                    {
                      type: 'h1',
                      props: {
                        style: {
                          fontFamily: OG.fontDisplay,
                          fontSize: '56px',
                          color: OG.text,
                          lineHeight: 0.95,
                          letterSpacing: '-0.04em',
                          margin: 0,
                          maxWidth: '500px',
                        },
                        children: name,
                      },
                    },
                    ...(description
                      ? [
                          {
                            type: 'p',
                            props: {
                              style: {
                                fontFamily: OG.fontDisplay,
                                fontSize: '20px',
                                color: OG.textMuted,
                                margin: 0,
                                maxWidth: '450px',
                                lineHeight: 1.4,
                              },
                              children: description,
                            },
                          },
                        ]
                      : []),
                  ],
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  },
                  children: tagList
                    ? {
                        type: 'span',
                        props: {
                          style: {
                            fontFamily: OG.fontMono,
                            fontSize: '12px',
                            color: OG.textMuted,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                          },
                          children: tagList,
                        },
                      }
                    : [],
                },
              },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: {
              width: '400px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              borderLeft: `1px solid ${OG.border}`,
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    gap: '24px',
                    alignItems: 'center',
                    ...(badInDark
                      ? {
                          padding: '40px',
                          paddingLeft: '37px',
                          backgroundColor: OG.badInDarkSlab,
                          borderLeft: `3px solid ${OG.accent}`,
                        }
                      : {}),
                  },
                  children: iconImages.map((src) => ({
                    type: 'img',
                    props: {
                      src,
                      width: 180,
                      height: 180,
                      style: { objectFit: 'contain' },
                    },
                  })),
                },
              },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '4px',
              backgroundColor: OG.accent,
            },
          },
        },
      ],
    },
  };
}

// Cloudflare Pages Functions runtime types — lightweight so this file
// compiles under the Astro website's existing tsconfig without pulling
// @cloudflare/workers-types.
interface PagesContext {
  request: Request;
  params: { slug?: string };
}

export const onRequestGet = async (context: PagesContext): Promise<Response> => {
  const slug = context.params.slug;
  if (!slug) {
    return new Response('Not found', { status: 404 });
  }

  const origin = new URL(context.request.url).origin;

  try {
    const index = await loadIndex(origin);
    const entry = index.find((i) => i.id === slug);
    if (!entry) {
      return new Response('Not found', { status: 404 });
    }

    const slugs = entry.icons ?? [];
    const preferred = slugs.find((s) => s.endsWith('-icon')) ?? slugs[0];
    const iconImages: string[] = [];
    if (preferred) {
      const src = await fetchIconAsDataUri(preferred, origin);
      if (src) iconImages.push(src);
    }

    const tagList = (entry.tags ?? []).slice(0, 4).join(' / ');

    const png = await renderOgPng(
      buildJsx(
        entry.name,
        entry.description,
        iconImages,
        tagList,
        entry.badInDark ?? false,
      ),
      origin,
    );
    return ogPngResponse(png);
  } catch (err) {
    return ogErrorResponse(err);
  }
};
