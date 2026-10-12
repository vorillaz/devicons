// scripts/release-scopes.cjs
//
// Which repo paths feed each release group. A commit only counts towards a
// group's version bump, release notes and GitHub PR comments when it touches
// at least one of these prefixes (repo-root relative, matched by prefix).
//
// Shared by scripts/release-group1.mjs, packages/font/release.config.cjs and
// scripts/next-version.mjs (Release PR title), so all three agree.

// @dev.icons/{core,react,vue,svelte}. codegen and utils are devDependencies
// but their output is baked into the published bundles.
const GROUP1_PATHS = [
  'packages/core/',
  'packages/react/',
  'packages/vue/',
  'packages/svelte/',
  'packages/codegen/',
  'packages/utils/',
];

// devicons (font). The font package rebuilds glyphs from export-files/font
// and its sprite from export-files/icons, using core's to-font/sprite scripts.
// Its CLI (dist/cli.mjs) bundles packages/agent.
const FONT_PATHS = [
  'packages/font/',
  'packages/core/export-files/',
  'packages/core/scripts/to-font.ts',
  'packages/core/scripts/sprite.ts',
  'packages/agent/',
];

module.exports = { GROUP1_PATHS, FONT_PATHS };
