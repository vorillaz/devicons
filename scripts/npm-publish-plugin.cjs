// scripts/npm-publish-plugin.cjs
//
// semantic-release plugin that publishes one or more packages to npm using
// Trusted Publisher (OIDC). Loaded by absolute path from both release
// configs.
//
// Config:
//   pkgRoot:  'packages/font'                             (single package)
//   pkgRoots: ['packages/core', 'packages/react', …]      (lockstep group)
//
// Hooks:
//   prepare — stamps nextRelease.version into each package.json.
//   publish — runs `npx -y npm@<NPM_SPEC> publish --tag <tag> --provenance
//             --access public` sequentially on each package. On failure,
//             logs which packages already hit npm so manual recovery of
//             the remainder is easy.
//
// Why npx, not bare `npm`?
//   Trusted Publisher OIDC requires npm ≥ 11.5.1. Node 22's bundled npm
//   (10.9.x) and the GitHub runner's toolcache image are both older, and
//   corepack's npm-activation path has proven unreliable across runner
//   image versions. Invoking the pinned npm spec through npx guarantees
//   the right binary is used regardless of the ambient Node install.
//   The NPM_PUBLISH_SPEC env var can override the default spec.
//
// DRY_RUN=true makes the publish a no-op (`npm publish --dry-run`) and
// restores the on-disk package.json contents afterwards so repeated
// dry-runs are idempotent.

const { execFileSync } = require('node:child_process');
const { readFileSync, writeFileSync } = require('node:fs');
const path = require('node:path');

const isDryRun = () => process.env.DRY_RUN === 'true';
const pkgJsonPath = (root) => path.join(root, 'package.json');
const NPM_SPEC = process.env.NPM_PUBLISH_SPEC || 'npm@^11.5.1';

// State retained between prepare and publish within the same run.
const state = { roots: [], originals: new Map() };

function normalizeRoots(config = {}) {
  if (Array.isArray(config.pkgRoots) && config.pkgRoots.length > 0) {
    return config.pkgRoots;
  }
  if (typeof config.pkgRoot === 'string' && config.pkgRoot.length > 0) {
    return [config.pkgRoot];
  }
  throw new Error(
    'npm-publish-plugin: pkgRoot (string) or pkgRoots (string[]) is required',
  );
}

function readPkgName(root) {
  return JSON.parse(readFileSync(pkgJsonPath(root), 'utf8')).name;
}

exports.prepare = async (pluginConfig, { logger, nextRelease }) => {
  state.roots = normalizeRoots(pluginConfig);
  state.originals.clear();
  for (const root of state.roots) {
    const p = pkgJsonPath(root);
    const original = readFileSync(p, 'utf8');
    state.originals.set(root, original);
    const json = JSON.parse(original);
    json.version = nextRelease.version;
    writeFileSync(p, JSON.stringify(json, null, 2) + '\n');
    logger.log(`Stamped ${json.name} (${root}) → ${nextRelease.version}`);
  }
};

exports.publish = async (pluginConfig, { logger, nextRelease }) => {
  const roots = state.roots.length
    ? state.roots
    : normalizeRoots(pluginConfig);
  const { version, channel } = nextRelease;
  const tag = !channel || channel === 'default' ? 'latest' : channel;
  const published = [];

  try {
    for (const root of roots) {
      const args = [
        '-y',
        NPM_SPEC,
        'publish',
        '--tag',
        tag,
        '--provenance',
        '--access',
        'public',
      ];
      if (isDryRun()) args.push('--dry-run');
      execFileSync('npx', args, { cwd: root, stdio: 'inherit' });
      published.push(root);
      logger.log(
        `Published ${readPkgName(root)}@${version} (dist-tag: ${tag})`,
      );
    }
  } catch (err) {
    const remaining = roots.filter((r) => !published.includes(r));
    logger.error(
      `Publish failed at ${readPkgName(remaining[0])}@${version}. ` +
        `Succeeded (dist-tag: ${tag}): ${
          published.map((r) => readPkgName(r)).join(', ') || '(none)'
        }. ` +
        `Remaining: ${remaining.map((r) => readPkgName(r)).join(', ')}. ` +
        `The git tag has already been created — a workflow retry will no-op and the remaining packages must be published manually.`,
    );
    throw err;
  } finally {
    if (isDryRun()) {
      for (const [root, original] of state.originals) {
        writeFileSync(pkgJsonPath(root), original);
      }
    }
  }

  const primary = roots[0];
  const primaryName = readPkgName(primary);
  return {
    name: `${primaryName}@${version}`,
    url: `https://www.npmjs.com/package/${primaryName}/v/${version}`,
  };
};
