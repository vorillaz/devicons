// scripts/scoped-commits-plugin.mjs
//
// semantic-release plugin that limits a release to commits touching given
// path prefixes, then delegates to @semantic-release/commit-analyzer and
// @semantic-release/release-notes-generator.
//
// Why not semantic-release-monorepo: it only counts commits under the
// package's own directory and has no option to add other paths. The
// `devicons` CLI bundles packages/agent, and the font is built from
// packages/core/export-files/font, so those must count too. The lockstep
// group (core/react/vue/svelte) has no single package directory at all.
//
// Config:
//   paths:  ['packages/font/', 'packages/agent/']   repo-root-relative prefixes
//   preset: 'conventionalcommits'                   passed to both delegates
//
// Load it by absolute path (see release-group1.mjs / packages/font/release.config.cjs).

import { execFileSync } from 'node:child_process';
import { analyzeCommits as analyze } from '@semantic-release/commit-analyzer';
import { generateNotes as notes } from '@semantic-release/release-notes-generator';

const normalizePrefix = prefix => (prefix.endsWith('/') ? prefix : `${prefix}/`);

const changedFiles = (hash, cwd) =>
  execFileSync(
    'git',
    ['diff-tree', '--root', '--no-commit-id', '--name-only', '-r', '-m', hash],
    { cwd, encoding: 'utf8' },
  )
    .split('\n')
    .filter(Boolean);

/** Commits that changed at least one file under one of `paths`. */
export function filterCommits(commits, paths, cwd) {
  const prefixes = paths.map(normalizePrefix);
  return commits.filter(commit =>
    changedFiles(commit.hash, cwd).some(file => prefixes.some(p => file.startsWith(p))),
  );
}

function scoped(pluginConfig, context) {
  const { paths, ...delegateConfig } = pluginConfig;
  if (!Array.isArray(paths) || paths.length === 0) {
    throw new Error('scoped-commits-plugin: `paths` (non-empty string[]) is required');
  }
  const commits = filterCommits(context.commits, paths, context.cwd);
  context.logger.log(
    'Found %s of %s commits touching %s',
    commits.length,
    context.commits.length,
    paths.join(', '),
  );
  return [delegateConfig, { ...context, commits }];
}

export async function analyzeCommits(pluginConfig, context) {
  const [config, scopedContext] = scoped(pluginConfig, context);
  return analyze(config, scopedContext);
}

export async function generateNotes(pluginConfig, context) {
  const [config, scopedContext] = scoped(pluginConfig, context);
  return notes(config, scopedContext);
}
