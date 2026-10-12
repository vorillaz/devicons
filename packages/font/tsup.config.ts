import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    outExtension({ format }) {
      return { js: format === 'esm' ? '.mjs' : '.cjs' };
    },
    dts: true,
    sourcemap: false,
    clean: false,
    outDir: 'dist',
    target: 'es2022',
    shims: true,
  },
  // `npx devicons` CLI: one self-contained ESM file, no runtime dependencies.
  {
    entry: { cli: 'src/cli.ts' },
    format: ['esm'],
    outExtension: () => ({ js: '.mjs' }),
    platform: 'node',
    target: 'node20',
    dts: false,
    sourcemap: false,
    clean: false,
    outDir: 'dist',
    noExternal: [/.*/],
    // One file: package.json `files` ships dist/cli.mjs only, so the
    // dynamic imports in src/cli.ts must not become separate chunks.
    splitting: false,
    minify: true,
    banner: {
      // Bundled CommonJS dependencies may call require(); give ESM one.
      js: "#!/usr/bin/env node\nimport { createRequire as __createRequire } from 'node:module';\nconst require = __createRequire(import.meta.url);",
    },
  },
]);
