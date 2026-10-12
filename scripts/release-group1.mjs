// scripts/release-group1.mjs
//
// Drives the lockstep release of @dev.icons/{core,react,vue,svelte}.
//
// Authentication model:
//   Publishes to npm via Trusted Publisher (OIDC) — no NPM_TOKEN is used.
//   The workflow grants `id-token: write` so `npm publish` can exchange a
//   GitHub OIDC token for a short-lived publish credential. pnpm publish
//   does not yet support this flow, so the publish plugin uses `npm publish`
//   directly. (`workspace:*` references in the four packages live in
//   devDependencies only, so `npm publish` does not need to rewrite them.)
//
// Version selection:
//   semantic-release computes nextRelease.version from conventional commits.
//     - On `main`:   X.Y.Z              (dist-tag: latest)
//     - On `canary`: X.Y.Z-canary.N     (dist-tag: canary)
//   The `.N` suffix is incremented by semantic-release for every canary
//   release sharing the same base X.Y.Z — continuous canary numbering.
//   A new base (feat/fix on canary that bumps X.Y.Z) resets N to 1, which
//   is required for strict semver ordering.
//
// Lifecycle:
//   1. scoped-commits-plugin    → keep commits touching SCOPED_PATHS, then
//                                 compute the bump (commit-analyzer) and
//   2.                            render release notes (release-notes-generator)
//   3. changelog (main only)    → write CHANGELOG.md
//   4. npm-publish-plugin       → stamp package.json, npm publish all 4
//   5. git (main only)          → commit CHANGELOG + 4 package.json files
//   6. github                   → create GitHub release
//
//   The npm-publish-plugin lives at scripts/npm-publish-plugin.cjs and is
//   loaded by path; the font release uses the same plugin.
//
//   semantic-release creates the git tag BEFORE publish plugins run. If the
//   npm publish step fails partway through, the logged error lists which
//   packages already hit npm so manual recovery of the rest is straightforward;
//   a retry of the workflow no-ops because the tag already exists.
//
// DRY_RUN=true makes the whole thing a no-op: semantic-release dryRun and
// `npm publish --dry-run` for each package. Package.json edits are reverted
// on disk so repeated dry-runs stay idempotent.
//
// On canary, @semantic-release/changelog and @semantic-release/git are
// omitted so nothing is committed back to the canary branch.

import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import semanticRelease from 'semantic-release';

const DRY_RUN = process.env.DRY_RUN === 'true';
const PACKAGES = ['core', 'react', 'vue', 'svelte'];
// Absolute paths — matches the font config, so plugins resolve the same way
// regardless of cwd.
const PUBLISH_PLUGIN = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  './npm-publish-plugin.cjs',
);
// Only commits touching the four packages (or the codegen/utils that
// generate react/vue/svelte) count toward this release. Website, CLI, and
// agent commits are released elsewhere or not at all.
const SCOPED_COMMITS_PLUGIN = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  './scoped-commits-plugin.mjs',
);
const SCOPED_PATHS = [
  ...PACKAGES.map((p) => `packages/${p}/`),
  'packages/codegen/',
  'packages/utils/',
];

const detectBranch = () => {
  if (process.env.GITHUB_REF_NAME) return process.env.GITHUB_REF_NAME;
  try {
    return execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  } catch {
    return '';
  }
};

const branch = detectBranch();
const isCanary = branch === 'canary';

const plugins = [
  [SCOPED_COMMITS_PLUGIN, { paths: SCOPED_PATHS, preset: 'conventionalcommits' }],
  ...(isCanary
    ? []
    : [['@semantic-release/changelog', { changelogFile: 'CHANGELOG.md' }]]),
  [PUBLISH_PLUGIN, { pkgRoots: PACKAGES.map((p) => `packages/${p}`) }],
  ...(isCanary
    ? []
    : [
        [
          '@semantic-release/git',
          {
            assets: [
              'CHANGELOG.md',
              ...PACKAGES.map((p) => `packages/${p}/package.json`),
            ],
            message:
              'chore(release): v${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
          },
        ],
      ]),
  '@semantic-release/github',
];

console.log(
  `[release-group1] branch=${branch} isCanary=${isCanary} dryRun=${DRY_RUN}`,
);

const result = await semanticRelease({
  tagFormat: 'v${version}',
  branches: ['main', { name: 'canary', prerelease: 'canary' }],
  plugins,
  dryRun: DRY_RUN,
  ci: process.env.CI === 'true',
});

if (!result || !result.nextRelease) {
  console.log('[release-group1] No release.');
  process.exit(0);
}

const { version, channel } = result.nextRelease;
const tag = !channel || channel === 'default' ? 'latest' : channel;
console.log(
  `[release-group1] All four @dev.icons packages released at ${version} (dist-tag: ${tag}).`,
);
