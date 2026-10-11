// Public data shapes for the Devicons API (/api/v1), the MCP tools, and the
// CLI. These schemas are the single source of truth: the website validates
// its generated JSON against them, the OpenAPI document is derived from them,
// and the MCP tools advertise them as output schemas.
import * as z from 'zod/v4';

const nullableString = z.string().nullable();

export const IconSummarySchema = z.object({
  slug: z.string(),
  name: z.string(),
  tags: z.array(z.string()),
  popular: z.boolean(),
  /** HTML page for the icon. */
  url: z.string(),
  /** Primary color SVG. */
  svg: z.string(),
});

export const IconVariantSchema = z.object({
  file: z.string(),
  label: z.string(),
  /** Full-color SVG. */
  svg: z.string(),
  /** Monochrome SVG that inherits `currentColor`. */
  mono: z.string(),
});

export const ComponentRefSchema = z.object({
  package: z.string(),
  mono: z.string(),
  name: z.string(),
});

export const IconDetailSchema = IconSummarySchema.extend({
  description: nullableString,
  aliases: z.array(z.string()),
  website: nullableString,
  license: nullableString,
  brandGuidelines: nullableString,
  mainColor: nullableString,
  badInDark: z.boolean(),
  badInLight: z.boolean(),
  deprecated: z.boolean(),
  recommended: z.boolean(),
  variants: z.array(IconVariantSchema),
  components: z.object({
    react: ComponentRefSchema,
    vue: ComponentRefSchema,
    svelte: ComponentRefSchema,
  }),
});

export const CategorySchema = z.object({
  slug: z.string(),
  label: z.string(),
  count: z.number().int(),
  url: z.string(),
});

export const IconListSchema = z.object({
  count: z.number().int(),
  icons: z.array(IconSummarySchema),
});

export const CategoryDetailSchema = CategorySchema.extend({
  icons: z.array(IconSummarySchema),
});

export const SearchResultSchema = z.object({
  query: z.string(),
  count: z.number().int(),
  results: z.array(IconSummarySchema),
});

export const ApiErrorCodeSchema = z.enum([
  'not_found',
  'invalid_param',
  'method_not_allowed',
  'rate_limited',
  'internal',
]);

export const ApiErrorSchema = z.object({
  error: z.object({
    code: ApiErrorCodeSchema,
    message: z.string(),
  }),
});

/** One record of /search-index.json (the site's client-side search index). */
export const SearchIndexEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icons: z.array(z.string()),
  tags: z.array(z.string()),
  deprecated: z.boolean(),
  popular: z.boolean(),
  badInDark: z.boolean().optional(),
  badInLight: z.boolean().optional(),
  version: z.string().optional(),
  aliases: z.array(z.string()).optional(),
});

export type IconSummary = z.infer<typeof IconSummarySchema>;
export type IconVariant = z.infer<typeof IconVariantSchema>;
export type ComponentRef = z.infer<typeof ComponentRefSchema>;
export type IconDetail = z.infer<typeof IconDetailSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type IconList = z.infer<typeof IconListSchema>;
export type CategoryDetail = z.infer<typeof CategoryDetailSchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
export type SearchIndexEntry = z.infer<typeof SearchIndexEntrySchema>;
