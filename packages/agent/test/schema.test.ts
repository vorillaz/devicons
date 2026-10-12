import { describe, expect, it } from 'vitest';
import { ApiErrorSchema, IconDetailSchema } from '../src/schema.ts';
import { REACT_DETAIL } from './fixtures/data.ts';

describe('IconDetailSchema', () => {
  it('accepts a complete icon detail', () => {
    expect(IconDetailSchema.parse(REACT_DETAIL)).toEqual(REACT_DETAIL);
  });

  it('rejects a detail without variants', () => {
    const { variants: _omit, ...rest } = REACT_DETAIL;
    expect(() => IconDetailSchema.parse(rest)).toThrow();
  });
});

describe('ApiErrorSchema', () => {
  it('accepts a known error code', () => {
    const value = { error: { code: 'not_found', message: 'x' } };
    expect(ApiErrorSchema.parse(value)).toEqual(value);
  });

  it('rejects an unknown error code', () => {
    expect(() =>
      ApiErrorSchema.parse({ error: { code: 'nope', message: 'x' } }),
    ).toThrow();
  });
});
