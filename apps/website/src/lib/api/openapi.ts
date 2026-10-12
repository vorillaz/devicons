// OpenAPI 3.1 description of /api/v1, with component schemas generated from
// the same zod schemas the API, MCP server, and CLI use.
import * as z from 'zod/v4';
import {
  ApiErrorSchema,
  CategoryDetailSchema,
  CategorySchema,
  IconDetailSchema,
  IconListSchema,
  IconSummarySchema,
  SearchResultSchema,
} from '@dev.icons/agent/schema';
import { SITE_URL } from '../../consts';

const toSchema = (schema: z.ZodType) => {
  const { $schema: _drop, ...rest } = z.toJSONSchema(schema) as Record<string, unknown>;
  return rest;
};

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

const json = (description: string, schema: object) => ({
  description,
  content: { 'application/json': { schema } },
});

const notFound = json('Unknown slug', ref('ApiError'));

const slugParam = (description: string, example: string) => ({
  name: 'slug',
  in: 'path',
  required: true,
  description,
  schema: { type: 'string', pattern: '^[a-z0-9][a-z0-9._-]*$' },
  example,
});

export function buildOpenApi(version: string) {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Devicons API',
      version,
      summary: 'Free, read-only JSON API for developer icons and SVG logos.',
      description:
        'Search 1,300+ developer, brand, framework, and tooling logos, read icon metadata and SVG URLs, and browse categories. No key required. SVG files are MIT licensed; logos are trademarks of their owners.',
      license: { name: 'MIT', identifier: 'MIT' },
    },
    externalDocs: { description: 'API documentation', url: `${SITE_URL}/docs/api/` },
    servers: [{ url: `${SITE_URL}/api/v1` }],
    paths: {
      '/icons.json': {
        get: {
          operationId: 'listIcons',
          summary: 'List all active icons',
          responses: { '200': json('All active icons, sorted by name', ref('IconList')) },
        },
      },
      '/icons/{slug}.json': {
        get: {
          operationId: 'getIcon',
          summary: 'Get one icon with variants and component names',
          parameters: [slugParam('Icon slug', 'react')],
          responses: { '200': json('Icon detail', ref('IconDetail')), '404': notFound },
        },
      },
      '/categories.json': {
        get: {
          operationId: 'listCategories',
          summary: 'List icon categories',
          responses: {
            '200': json('Categories, largest first', { type: 'array', items: ref('Category') }),
          },
        },
      },
      '/categories/{slug}.json': {
        get: {
          operationId: 'getCategory',
          summary: 'Get the icons in one category',
          parameters: [slugParam('Category slug', 'database')],
          responses: {
            '200': json('Category with its icons, most recognizable first', ref('CategoryDetail')),
            '404': notFound,
          },
        },
      },
      '/search': {
        get: {
          operationId: 'searchIcons',
          summary: 'Search icons by name, alias, tag, or description',
          parameters: [
            {
              name: 'q',
              in: 'query',
              required: true,
              schema: { type: 'string', minLength: 1, maxLength: 100 },
              example: 'react',
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            },
            {
              name: 'category',
              in: 'query',
              description: 'Only return icons in this category slug',
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': json('Ranked results', ref('SearchResult')),
            '400': json('Invalid parameter', ref('ApiError')),
          },
        },
      },
    },
    components: {
      schemas: {
        IconSummary: toSchema(IconSummarySchema),
        IconDetail: toSchema(IconDetailSchema),
        IconList: toSchema(IconListSchema),
        Category: toSchema(CategorySchema),
        CategoryDetail: toSchema(CategoryDetailSchema),
        SearchResult: toSchema(SearchResultSchema),
        ApiError: toSchema(ApiErrorSchema),
      },
    },
  };
}
