// scripts/next-version.mjs
//
// Predicts the versions merging <head> into <base> will release, using the
// same commit scopes (release-scopes.cjs), commit filter (scoped-commits.mjs)
// and conventionalcommits preset as the real release. Used by the Release PR
// workflow for the PR title/body; runs locally too:
//
//   node scripts/next-version.mjs [base=origin/main] [head=origin/canary]
//
// Prints one `key=value` line per group (empty value = no release), ready to
// append to $GITHUB_OUTPUT:
//
//   group1=1.3.0
//   font=

import { execFileSync } from 'node:child_process';
import { analyzeCommits } from '@semantic-release/commit-analyzer';
import scopes from './release-scopes.cjs';
import { filterCommitsByPaths } from './scoped-commits.mjs';

const [base = 'origin/main', head = 'origin/canary'] = process.argv.slice(2);
const cwd = process.cwd();
const git = (...args) =>
  execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'ignore'] }).toString();

const GROUPS = [
  { key: 'group1', tagPrefix: 'v', paths: scopes.GROUP1_PATHS },
  { key: 'font', tagPrefix: 'devicons-v', paths: scopes.FONT_PATHS },
];

const silent = { log() {}, error() {}, warn() {}, success() {} };

function lastStableTag(prefix) {
  try {
    return git(
      'describe', '--tags', '--abbrev=0',
      // Stable tags only: skip `<prefix>X.Y.Z-canary.N` prereleases.
      '--match', `${prefix}[0-9]*`, '--exclude', `${prefix}*-*`, base,
    ).trim();
  } catch {
    return null; // never released from base
  }
}

function bump(version, type) {
  const [major, minor, patch] = version.split('.').map(Number);
  if (type === 'major') return `${major + 1}.0.0`;
  if (type === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

for (const { key, tagPrefix, paths } of GROUPS) {
  const tag = lastStableTag(tagPrefix);
  const range = tag ? `${tag}..${head}` : head;
  const commits = git('log', '--format=%H%x1f%B%x1e', range)
    .split('\x1e')
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => {
      const [hash, message] = c.split('\x1f');
      return { hash, message };
    });
  const scoped = await filterCommitsByPaths(commits, paths, cwd);
  const type = await analyzeCommits(
    { preset: 'conventionalcommits' },
    { commits: scoped, logger: silent, cwd, options: {} },
  );
  const next = type ? (tag ? bump(tag.slice(tagPrefix.length), type) : '1.0.0') : '';
  console.error(
    `${key}: ${tag ?? '(no tag)'} + ${scoped.length}/${commits.length} scoped commits → ${type ?? 'no release'}`,
  );
  console.log(`${key}=${next}`);
}
