import { describe, expect, it } from 'vitest';
import { usageFor } from '../src/snippets.ts';
import { REACT_DETAIL } from './fixtures/data.ts';

describe('usageFor', () => {
  it('imports the React component by its export name', () => {
    const { install, code } = usageFor(REACT_DETAIL, 'react');
    expect(install).toBe('npm install @dev.icons/react');
    expect(code).toContain('import { _React } from "@dev.icons/react";');
    expect(code).toContain('<_React size={32} />');
  });

  it('aliases reserved names in Vue templates', () => {
    const { install, code } = usageFor(REACT_DETAIL, 'vue');
    expect(install).toBe('npm install @dev.icons/vue');
    expect(code).toContain('import { _React as ReactLogo } from "@dev.icons/vue";');
    expect(code).toContain('<ReactLogo :size="32" />');
  });

  it('aliases reserved names in Svelte markup', () => {
    const { code } = usageFor(REACT_DETAIL, 'svelte');
    expect(code).toContain('import { _React as ReactLogo } from "@dev.icons/svelte";');
    expect(code).toContain('<ReactLogo size={32} />');
  });

  it('emits a plain img tag for html', () => {
    const { install, code } = usageFor(REACT_DETAIL, 'html');
    expect(install).toBe('');
    expect(code).toBe(
      '<img src="https://devicons.io/devicons/icons/react.svg" alt="React logo" width="32" height="32">',
    );
  });
});
