// packages/font/release.config.cjs
//
// Independent semantic-release run for `devicons` (the font package).
// Scoped to FONT_PATHS (scripts/release-scopes.cjs) — the font package plus
// the upstream export-files, the core scripts that build glyphs/sprite, and
// packages/agent (bundled into the CLI).
//
// Authentication model:
//   Publishes to npm via Trusted Publisher (OIDC) — no NPM_TOKEN. The
//   workflow grants `id-token: write` so `npm publish` can exchange a
//   GitHub OIDC token for a short-lived credential. pnpm publish does not
//   yet support this flow, so the publish plugin shells out to `npm publish`.
//
// Version selection:
//   semantic-release computes the next version from conventional commits
//   that touch FONT_PATHS.
//     - On `main`:   X.Y.Z             (dist-tag: latest)
//     - On `canary`: X.Y.Z-canary.N    (dist-tag: canary)
//   The `.N` suffix increments by 1 per canary publish against the same
//   base version — continuous canary numbering.
//
// CWD note:
//   semantic-release is invoked from packages/font (via `working-directory`
//   in the workflow) so it picks up this config. File paths in this config
//   are therefore relative to packages/font (not the repo root). The scope
//   paths are the exception: they match commit diff paths, which git always
//   reports repo-root relative.
//
// Plugin loading note:
//   The scoped and publish plugins are loaded by absolute path from scripts/
//   (shared with scripts/release-group1.mjs).
//
// On canary, @semantic-release/changelog and @semantic-release/git are
// omitted so nothing is committed back to the canary branch.

const path = require('node:path');
const { FONT_PATHS: paths } = require('../../scripts/release-scopes.cjs');

const branch = process.env.GITHUB_REF_NAME || process.env.SR_BRANCH || '';
const isCanary = branch === 'canary';

const SCRIPTS = path.resolve(__dirname, '../../scripts');
const PUBLISH_PLUGIN = path.join(SCRIPTS, 'npm-publish-plugin.cjs');
const SCOPED_COMMITS = path.join(SCRIPTS, 'scoped-commits.mjs');
const SCOPED_GITHUB = path.join(SCRIPTS, 'scoped-github.mjs');
const RELEASE_PLAN = path.join(SCRIPTS, 'release-plan-plugin.cjs');

module.exports = {
  tagFormat: 'devicons-v${version}',
  branches: ['main', { name: 'canary', prerelease: 'canary' }],
  plugins: [
    [
      SCOPED_COMMITS,
      {
        paths,
        preset: 'conventionalcommits',
        // Keeps CHANGELOG.md headings as `## [devicons-vX.Y.Z](...)`.
        tagVersionInNotes: true,
      },
    ],
    [RELEASE_PLAN, { key: 'font' }],
    ...(isCanary
      ? []
      : [['@semantic-release/changelog', { changelogFile: 'CHANGELOG.md' }]]),
    [PUBLISH_PLUGIN, { pkgRoot: '.' }],
    ...(isCanary
      ? []
      : [
          [
            '@semantic-release/git',
            {
              assets: ['package.json', 'CHANGELOG.md'],
              message:
                'chore(release): devicons ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
            },
          ],
        ]),
    [SCOPED_GITHUB, { paths }],
  ],
};
