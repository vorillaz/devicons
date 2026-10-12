// Shared runtime for the Cloudflare Pages Functions that render OG images on
// demand (functions/og/**). Workers-only: never import this from Astro pages —
// the build-time renderer is ./render.ts (satori + sharp).

import satori from 'satori';
import { Resvg, initWasm } from '@resvg/resvg-wasm';
// The Cloudflare build toolchain rewrites `.wasm` imports into
// WebAssembly.Module instances at deploy time.
// @ts-expect-error — wasm import handled by the CF build
import resvgWasm from '@resvg/resvg-wasm/index_bg.wasm';
import { OG } from './constants';

// Module scope — reused across requests on the same isolate.
let wasmReady: Promise<unknown> | null = null;
let fontCache: { displayFont: ArrayBuffer; monoFont: ArrayBuffer } | null = null;

function ensureWasm() {
  if (!wasmReady) {
    wasmReady = initWasm(resvgWasm as WebAssembly.Module);
  }
  return wasmReady;
}

async function loadFonts(origin: string) {
  if (fontCache) return fontCache;
  const [d, m] = await Promise.all([
    fetch(`${origin}/fonts/bricolage-grotesque.ttf`),
    fetch(`${origin}/fonts/ibm-plex-mono-600.woff`),
  ]);
  if (!d.ok || !m.ok) {
    throw new Error(`font fetch failed: display=${d.status}, mono=${m.status}`);
  }
  fontCache = {
    displayFont: await d.arrayBuffer(),
    monoFont: await m.arrayBuffer(),
  };
  return fontCache;
}

/** Render a satori element tree (plain `{ type, props }` objects) to PNG. */
export async function renderOgPng(jsx: unknown, origin: string): Promise<Uint8Array> {
  await ensureWasm();
  const { displayFont, monoFont } = await loadFonts(origin);

  // satori's types expect React-ish JSX but accepts plain objects with
  // { type, props } — we pass the latter to avoid pulling React.
  const svg = await satori(jsx as Parameters<typeof satori>[0], {
    width: OG.width,
    height: OG.height,
    fonts: [
      { name: OG.fontDisplay, data: displayFont, weight: 900 },
      { name: OG.fontMono, data: monoFont, weight: 600 },
    ],
  });

  return new Resvg(svg).render().asPng();
}

// Browser cache is modest (1 day). By default the CDN edge holds the PNG for
// a full year — pass a shorter `cdnMaxAge` for cards whose content drifts
// with the catalog (e.g. tag icon counts).
export function ogPngResponse(png: Uint8Array, cdnMaxAge?: number): Response {
  return new Response(png as BodyInit, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400',
      'CDN-Cache-Control':
        cdnMaxAge === undefined
          ? 'public, s-maxage=31536000, immutable'
          : `public, s-maxage=${cdnMaxAge}`,
    },
  });
}

export function ogErrorResponse(err: unknown): Response {
  const message = err instanceof Error ? err.message : String(err);
  return new Response(`OG render failed: ${message}`, {
    status: 500,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
