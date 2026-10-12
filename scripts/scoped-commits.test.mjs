// node --test scripts/scoped-commits.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { analyzeCommits, filterCommitsByPaths, generateNotes } from './scoped-commits.mjs';

const { FONT_PATHS, GROUP1_PATHS } = createRequire(import.meta.url)('./release-scopes.cjs');

const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();

function repoWith(commits) {
  const cwd = mkdtempSync(path.join(tmpdir(), 'scoped-commits-'));
  git(cwd, 'init', '-q');
  git(cwd, 'config', 'user.email', 'test@example.com');
  git(cwd, 'config', 'user.name', 'Test');
  return {
    cwd,
    commits: commits.map(([file, message]) => {
      mkdirSync(path.join(cwd, path.dirname(file)), { recursive: true });
      writeFileSync(path.join(cwd, file), message);
      git(cwd, 'add', '-A');
      git(cwd, 'commit', '-q', '-m', message);
      return { hash: git(cwd, 'rev-parse', 'HEAD'), message, subject: message };
    }),
  };
}

const logger = { log() {}, error() {} };

test('keeps only commits that touch a scoped path', async () => {
  const { cwd, commits } = repoWith([
    ['packages/font/a.txt', 'feat(cli): one'],
    ['apps/website/b.txt', 'feat(website): two'],
    ['packages/agent/c.txt', 'fix(agent): three'],
  ]);
  const kept = await filterCommitsByPaths(commits, ['packages/font/', 'packages/agent/'], cwd);
  assert.deepEqual(kept.map(c => c.subject), ['feat(cli): one', 'fix(agent): three']);
});

test('does not match a path that only shares a prefix string', async () => {
  const { cwd, commits } = repoWith([['packages/fontish/a.txt', 'feat: lookalike']]);
  assert.equal((await filterCommitsByPaths(commits, ['packages/font/'], cwd)).length, 0);
});

test('agent commits release devicons (the CLI bundles it), not @dev.icons/*', async () => {
  const { cwd, commits } = repoWith([['packages/agent/src/cli.ts', 'fix(agent): x']]);
  assert.equal((await filterCommitsByPaths(commits, FONT_PATHS, cwd)).length, 1);
  assert.equal((await filterCommitsByPaths(commits, GROUP1_PATHS, cwd)).length, 0);
});

test('no release when only out-of-scope commits are features', async () => {
  const { cwd, commits } = repoWith([['apps/website/a.txt', 'feat(website): page']]);
  const type = await analyzeCommits(
    { paths: ['packages/font/'], preset: 'conventionalcommits' },
    { cwd, commits, logger },
  );
  assert.equal(type, null);
});

test('in-scope features drive the release type and notes', async () => {
  const { cwd, commits } = repoWith([
    ['packages/agent/a.txt', 'feat(agent): new tool'],
    ['apps/website/b.txt', 'feat(website): page'],
  ]);
  const config = { paths: ['packages/agent/'], preset: 'conventionalcommits' };
  const context = {
    cwd,
    commits,
    logger,
    options: { repositoryUrl: 'https://github.com/example/repo' },
    lastRelease: { gitTag: 'v1.0.0', version: '1.0.0' },
    nextRelease: { gitTag: 'v1.1.0', version: '1.1.0' },
  };
  assert.equal(await analyzeCommits(config, context), 'minor');
  const notes = await generateNotes(config, context);
  assert.match(notes, /new tool/);
  assert.doesNotMatch(notes, /page/);
});

test('tagVersionInNotes titles the notes with the git tag', async () => {
  const { cwd, commits } = repoWith([['packages/font/a.txt', 'feat(cli): thing']]);
  const notes = await generateNotes(
    { paths: ['packages/font/'], preset: 'conventionalcommits', tagVersionInNotes: true },
    {
      cwd,
      commits,
      logger,
      options: { repositoryUrl: 'https://github.com/example/repo' },
      lastRelease: { gitTag: 'devicons-v2.1.0', version: '2.1.0' },
      nextRelease: { gitTag: 'devicons-v2.2.0', version: '2.2.0' },
    },
  );
  assert.match(notes, /^## \[devicons-v2\.2\.0\]/);
});
