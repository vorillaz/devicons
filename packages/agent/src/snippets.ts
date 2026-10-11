// Copy-paste usage for one icon in each supported target.
import type { IconDetail } from './schema.ts';

export type Framework = 'react' | 'vue' | 'svelte' | 'html';

export const FRAMEWORKS: readonly Framework[] = ['react', 'vue', 'svelte', 'html'];

export interface Usage {
  install: string;
  code: string;
}

// Reserved export names (`_React`, `_Vue`, …) can't be used as tags in Vue
// templates or Svelte markup, so the import gets a readable alias there.
const templateName = (name: string) =>
  name.startsWith('_') ? `${name.slice(1)}Logo` : name;

export function usageFor(detail: IconDetail, framework: Framework): Usage {
  if (framework === 'html') {
    return {
      install: '',
      code: `<img src="${detail.svg}" alt="${detail.name} logo" width="32" height="32">`,
    };
  }

  const ref = detail.components[framework];
  const install = `npm install ${ref.package}`;

  if (framework === 'react') {
    return {
      install,
      code: [
        `import { ${ref.name} } from "${ref.package}";`,
        '',
        'export function Logo() {',
        `  return <${ref.name} size={32} />;`,
        '}',
      ].join('\n'),
    };
  }

  const tag = templateName(ref.name);
  const specifier = tag === ref.name ? ref.name : `${ref.name} as ${tag}`;
  const importLine = `import { ${specifier} } from "${ref.package}";`;

  if (framework === 'vue') {
    return {
      install,
      code: [
        '<script setup lang="ts">',
        importLine,
        '</script>',
        '',
        '<template>',
        `  <${tag} :size="32" />`,
        '</template>',
      ].join('\n'),
    };
  }

  return {
    install,
    code: ['<script lang="ts">', `  ${importLine}`, '</script>', '', `<${tag} size={32} />`].join(
      '\n',
    ),
  };
}
