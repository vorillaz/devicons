// scripts/republish.mjs
//
// Recovery for a release whose git tag exists but whose npm publish did not
// finish (semantic-release tags before publishing, so a plain workflow retry
// no-ops). Run from the Release workflow with `republish_tag`, on a checkout
// of that tag after the normal build:
//
//   node scripts/republish.mjs v1.3.0                 # @dev.icons/* group
//   node scripts/republish.mjs devicons-v2.2.0-canary.1   # font
//
// Stamps the tag's version into the packages and runs the same publish
// plugin as the release, which skips versions npm already has. Prerelease
// versions publish under their prerelease id as dist-tag (canary), others
// under `latest`. Honours DRY_RUN=true.

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const plugin = require('./npm-publish-plugin.cjs');

const GROUPS = [
  { prefix: 'devicons-v', pkgRoots: ['packages/font'] },
  {
    prefix: 'v',
    pkgRoots: ['packages/core', 'packages/react', 'packages/vue', 'packages/svelte'],
  },
];

const tag = process.argv[2];
const group = tag && GROUPS.find((g) => tag.startsWith(g.prefix));
const version = group && tag.slice(group.prefix.length);
if (!group || !/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error(`usage: republish.mjs <v1.2.3 | devicons-v1.2.3[-canary.N]> (got "${tag ?? ''}")`);
  process.exit(1);
}

const prerelease = version.split('-')[1];
const channel = prerelease ? prerelease.split('.')[0] : undefined;
const logger = { log: console.log, error: console.error };
const context = { logger, nextRelease: { version, channel } };
const config = { pkgRoots: group.pkgRoots };

console.log(
  `[republish] ${tag} → ${group.pkgRoots.join(', ')} @ ${version} (dist-tag: ${channel ?? 'latest'})`,
);
await plugin.prepare(config, context);
await plugin.publish(config, context);
