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
// Commit scope:
//   Only commits touching GROUP1_PATHS (scripts/release-scopes.cjs) count
//   towards the bump, the notes and the GitHub PR comments — website or font
//   only commits never bump the @dev.icons packages.
//
// Lifecycle:
//   1. scoped-commits           → compute version bump + render release notes
//   2. changelog (main only)    → write CHANGELOG.md
//   3. npm-publish-plugin       → stamp package.json, verify entry points,
//                                 npm publish all 4 (in parallel)
//   4. git (main only)          → commit CHANGELOG + 4 package.json files
//   5. scoped-github            → create GitHub release
//
//   The plugins live in scripts/ and are loaded by absolute path (shared with
//   the font release in packages/font/release.config.cjs).
//
//   semantic-release creates the git tag BEFORE publish plugins run, so a
//   plain workflow retry no-ops. The publish plugin skips versions npm
//   already has, so a failed publish is recovered by re-running the Release
//   workflow manually with `republish_tag` set (see release.yml).
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
import scopes from './release-scopes.cjs';

const DRY_RUN = process.env.DRY_RUN === 'true';
const PACKAGES = ['core', 'react', 'vue', 'svelte'];
// Absolute paths — matches the font config, which runs from packages/font.
const SCRIPTS = path.dirname(fileURLToPath(import.meta.url));
const PUBLISH_PLUGIN = path.join(SCRIPTS, 'npm-publish-plugin.cjs');
const SCOPED_COMMITS = path.join(SCRIPTS, 'scoped-commits.mjs');
const SCOPED_GITHUB = path.join(SCRIPTS, 'scoped-github.mjs');
const paths = scopes.GROUP1_PATHS;

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
  [SCOPED_COMMITS, { paths, preset: 'conventionalcommits' }],
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
  [SCOPED_GITHUB, { paths }],
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
