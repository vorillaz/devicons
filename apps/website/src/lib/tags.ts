// Pure tag helpers. Kept free of `astro:content` so astro.config.mjs can
// import them when building the sitemap.

// Tag pages listing fewer icons than this are thin (a 1-icon tag page is a
// near-duplicate of the icon page itself). They still render so links keep
// working, but are marked noindex and left out of the sitemap.
export const MIN_INDEXABLE_TAG_COUNT = 3;

// `+` and `#` are spelled out so `c++` and `c#` don't collapse onto `c`.
export const slugifyTag = (tag: string) =>
  tag
    .toLowerCase()
    .replace(/\+/g, '-plus')
    .replace(/#/g, '-sharp')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
