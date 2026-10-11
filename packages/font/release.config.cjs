// packages/font/release.config.cjs
//
// Independent semantic-release run for `devicons` (the font package).
// Scoped to the paths `devicons` is built from (font package, font asset
// sources, and the agent package bundled into the CLI).
//
// Authentication model:
//   Publishes to npm via Trusted Publisher (OIDC) — no NPM_TOKEN. The
//   workflow grants `id-token: write` so `npm publish` can exchange a
//   GitHub OIDC token for a short-lived credential. pnpm publish does not
//   yet support this flow, so the publish plugin shells out to `npm publish`.
//
// Version selection:
//   semantic-release computes the next version from conventional commits
//   that touch the paths `devicons` is built from (see SCOPED_PATHS):
//     - On `main`:   X.Y.Z             (dist-tag: latest)
//     - On `canary`: X.Y.Z-canary.N    (dist-tag: canary)
//   The `.N` suffix increments by 1 per canary publish against the same
//   base version — continuous canary numbering.
//
// Commit scoping:
//   scripts/scoped-commits-plugin.mjs filters commits by changed paths
//   before the commit analyzer and release notes run. It replaces
//   semantic-release-monorepo, which only counts commits under the
//   package's own directory and silently ignored the extra paths this
//   package needs: the font sources in packages/core/export-files/font and
//   packages/agent, which is bundled into the CLI (dist/cli.mjs).
//
// CWD note:
//   semantic-release is invoked from packages/font (via `working-directory`
//   in the workflow), so file paths in this config (pkgRoot, changelog) are
//   relative to packages/font. SCOPED_PATHS are repo-root relative, because
//   git reports changed files that way.
//
// Plugin loading note:
//   Local plugins are loaded by absolute path so they resolve the same way
//   regardless of cwd.
//
// On canary, @semantic-release/changelog and @semantic-release/git are
// omitted so nothing is committed back to the canary branch.

const path = require('node:path');

const branch = process.env.GITHUB_REF_NAME || process.env.SR_BRANCH || '';
const isCanary = branch === 'canary';

const PUBLISH_PLUGIN = path.resolve(
  __dirname,
  '../../scripts/npm-publish-plugin.cjs',
);
const SCOPED_COMMITS_PLUGIN = path.resolve(
  __dirname,
  '../../scripts/scoped-commits-plugin.mjs',
);

const SCOPED_PATHS = [
  'packages/font/',
  'packages/core/export-files/font/',
  'packages/agent/',
];

module.exports = {
  tagFormat: 'devicons-v${version}',
  branches: ['main', { name: 'canary', prerelease: 'canary' }],
  plugins: [
    [
      SCOPED_COMMITS_PLUGIN,
      {
        paths: SCOPED_PATHS,
        preset: 'conventionalcommits',
        // Keeps CHANGELOG.md headings as `## [devicons-vX.Y.Z](...)`.
        tagVersionInNotes: true,
      },
    ],
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
    '@semantic-release/github',
  ],
};
