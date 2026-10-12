// scripts/npm-publish-plugin.cjs
//
// semantic-release plugin that publishes one or more packages to npm using
// Trusted Publisher (OIDC). Loaded by absolute path from
// scripts/release-group1.mjs and packages/font/release.config.cjs, and driven
// directly by scripts/republish.mjs for recovery.
//
// Config:
//   pkgRoot:  'packages/font'                             (single package)
//   pkgRoots: ['packages/core', 'packages/react', …]      (lockstep group)
//
// Hooks:
//   prepare — stamps nextRelease.version into each package.json, then checks
//             every file referenced by main/module/types/exports/files is on
//             disk. prepare runs BEFORE semantic-release creates the git tag,
//             so a broken build aborts the release instead of leaving a tag
//             with nothing published behind it.
//   publish — `npm publish --tag <tag> --provenance --access public` for all
//             packages in parallel. Versions npm already has are skipped, so
//             re-running a half-finished release (scripts/republish.mjs) only
//             publishes what is missing.
//
// Which npm?
//   Trusted Publisher OIDC requires npm ≥ 11.5.1. The workflow installs it
//   globally; if the ambient npm is older (e.g. a local dry-run on Node 22's
//   bundled npm 10.x) we fall back to `npx -y npm@<NPM_SPEC>`, resolved once
//   and reused for every package. NPM_PUBLISH_SPEC overrides the spec.
//
// DRY_RUN=true makes the publish a no-op (`npm publish --dry-run`) and
// restores the on-disk package.json contents afterwards so repeated
// dry-runs are idempotent.

const { execFile, execFileSync } = require('node:child_process');
const { existsSync, readFileSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const { promisify } = require('node:util');

const run = promisify(execFile);
const isDryRun = () => process.env.DRY_RUN === 'true';
const pkgJsonPath = (root) => path.join(root, 'package.json');
const NPM_SPEC = process.env.NPM_PUBLISH_SPEC || 'npm@^11.5.1';
const MIN_NPM = [11, 5, 1];

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

function readPkg(root) {
  return JSON.parse(readFileSync(pkgJsonPath(root), 'utf8'));
}

// Every relative file the published package points at: main/module/types,
// all string leaves of `exports`, and the non-glob entries of `files`.
function referencedFiles(pkg) {
  const out = new Set();
  const walk = (v) => {
    if (typeof v === 'string') out.add(path.posix.normalize(v));
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk([pkg.main, pkg.module, pkg.types, pkg.exports]);
  for (const f of pkg.files || []) {
    if (!/[*?{}[\]]/.test(f) && path.extname(f)) out.add(path.posix.normalize(f));
  }
  return [...out].filter((f) => !f.startsWith('..'));
}

function verifyEntryPoints(root) {
  const pkg = readPkg(root);
  const missing = referencedFiles(pkg).filter(
    (f) => !existsSync(path.join(root, f)),
  );
  if (missing.length > 0) {
    throw new Error(
      `npm-publish-plugin: ${pkg.name} is missing built files: ${missing.join(', ')}. ` +
        'Did the build step run?',
    );
  }
}

function resolveNpm(logger) {
  try {
    const version = execFileSync('npm', ['--version']).toString().trim();
    const parts = version.split('.').map(Number);
    const ok =
      parts[0] !== MIN_NPM[0]
        ? parts[0] > MIN_NPM[0]
        : parts[1] !== MIN_NPM[1]
          ? parts[1] > MIN_NPM[1]
          : parts[2] >= MIN_NPM[2];
    if (ok) {
      logger.log(`Using npm ${version}`);
      return { cmd: 'npm', prefix: [] };
    }
    logger.log(`npm ${version} < ${MIN_NPM.join('.')}; using npx ${NPM_SPEC}`);
  } catch {
    logger.log(`npm not found; using npx ${NPM_SPEC}`);
  }
  // Warm the npx cache once so parallel publishes don't race to install it.
  execFileSync('npx', ['-y', NPM_SPEC, '--version'], { stdio: 'ignore' });
  return { cmd: 'npx', prefix: ['-y', NPM_SPEC] };
}

async function isPublished(npm, name, version) {
  try {
    const { stdout } = await run(
      npm.cmd,
      [...npm.prefix, 'view', `${name}@${version}`, 'version'],
    );
    return stdout.trim() === version;
  } catch {
    return false; // E404 for a package that has never been published
  }
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
  try {
    for (const root of state.roots) verifyEntryPoints(root);
  } catch (err) {
    // The release aborts here (before the tag), so put package.json back.
    for (const [root, original] of state.originals) {
      writeFileSync(pkgJsonPath(root), original);
    }
    throw err;
  }
  logger.log(`Verified entry points for ${state.roots.length} package(s)`);
};

exports.publish = async (pluginConfig, { logger, nextRelease }) => {
  const roots = state.roots.length
    ? state.roots
    : normalizeRoots(pluginConfig);
  const { version, channel } = nextRelease;
  const tag = !channel || channel === 'default' ? 'latest' : channel;
  const npm = resolveNpm(logger);

  try {
    const results = await Promise.allSettled(
      roots.map(async (root) => {
        const { name } = readPkg(root);
        if (await isPublished(npm, name, version)) {
          logger.log(`Skipped ${name}@${version} — already on npm`);
          return { name, status: 'skipped' };
        }
        const args = [
          ...npm.prefix,
          'publish',
          '--tag',
          tag,
          '--provenance',
          '--access',
          'public',
        ];
        if (isDryRun()) args.push('--dry-run');
        // Publishes run concurrently, so buffer npm's output and only dump
        // the (very long, file-by-file) notice log when that package fails.
        try {
          await run(npm.cmd, args, { cwd: root, maxBuffer: 64 * 1024 * 1024 });
        } catch (err) {
          process.stderr.write(
            `--- npm output for ${name} ---\n${err.stdout || ''}${err.stderr || ''}`,
          );
          throw Object.assign(err, { pkgName: name });
        }
        logger.log(`Published ${name}@${version} (dist-tag: ${tag})`);
        return { name, status: 'published' };
      }),
    );

    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length > 0) {
      const done = results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => `${r.value.name} (${r.value.status})`);
      logger.error(
        `Publish failed for ${failed.map((r) => r.reason.pkgName).join(', ')}@${version}. ` +
          `Succeeded (dist-tag: ${tag}): ${done.join(', ') || '(none)'}. ` +
          `The git tag already exists — re-run the Release workflow with ` +
          `republish_tag set to finish publishing the rest.`,
      );
      throw failed[0].reason;
    }
  } finally {
    if (isDryRun()) {
      for (const [root, original] of state.originals) {
        writeFileSync(pkgJsonPath(root), original);
      }
    }
  }

  const primaryName = readPkg(roots[0]).name;
  return {
    name: `${primaryName}@${version}`,
    url: `https://www.npmjs.com/package/${primaryName}/v/${version}`,
  };
};
