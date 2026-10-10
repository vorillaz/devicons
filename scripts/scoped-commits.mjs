// scripts/scoped-commits.mjs
//
// semantic-release plugin: @semantic-release/commit-analyzer +
// @semantic-release/release-notes-generator, but only fed the commits that
// touch the configured paths. Replaces semantic-release-monorepo, which only
// scopes to the cwd package directory (it has no `commitPaths` option).
//
// Config:
//   paths:  ['packages/font/', …]   repo-root relative prefixes (required)
//   …rest:  passed through to both wrapped plugins (e.g. preset)
//
// Load by absolute path; see scripts/scoped-github.mjs for the GitHub side.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as commitAnalyzer from '@semantic-release/commit-analyzer';
import * as notesGenerator from '@semantic-release/release-notes-generator';

const run = promisify(execFile);
const filesByHash = new Map();

async function commitFiles(hash, cwd) {
  if (!filesByHash.has(hash)) {
    filesByHash.set(
      hash,
      run(
        'git',
        ['diff-tree', '--root', '--no-commit-id', '--name-only', '-r', '-z', hash],
        { cwd, maxBuffer: 64 * 1024 * 1024 },
      ).then(({ stdout }) => stdout.split('\0').filter(Boolean)),
    );
  }
  return filesByHash.get(hash);
}

export async function filterCommitsByPaths(commits, paths, cwd) {
  if (!Array.isArray(paths) || paths.length === 0) {
    throw new Error('scoped-commits: `paths` (string[]) is required');
  }
  const keep = await Promise.all(
    commits.map(async (commit) => {
      const files = await commitFiles(commit.hash, cwd);
      return files.some((file) => paths.some((p) => file.startsWith(p)));
    }),
  );
  return commits.filter((_, i) => keep[i]);
}

const scoped = (step) => async (pluginConfig, context) => {
  const { paths, ...config } = pluginConfig;
  const commits = await filterCommitsByPaths(context.commits, paths, context.cwd);
  context.logger.log(
    `Scoped to ${commits.length}/${context.commits.length} commits touching ${paths.join(', ')}`,
  );
  return step(config, { ...context, commits });
};

export const analyzeCommits = scoped(commitAnalyzer.analyzeCommits);
export const generateNotes = scoped(notesGenerator.generateNotes);
