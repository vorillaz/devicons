// node --test scripts/release-plan-plugin.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';

const plugin = createRequire(import.meta.url)('./release-plan-plugin.cjs');
const logger = { log() {} };

test('records the planned version for its group', async () => {
  const file = path.join(mkdtempSync(path.join(tmpdir(), 'plan-')), 'out');
  process.env.RELEASE_PLAN_FILE = file;
  try {
    await plugin.verifyRelease({ key: 'font' }, { nextRelease: { version: '2.2.0' }, logger });
    await plugin.verifyRelease({ key: 'group1' }, { nextRelease: { version: '1.3.0-canary.1' }, logger });
  } finally {
    delete process.env.RELEASE_PLAN_FILE;
  }
  assert.equal(readFileSync(file, 'utf8'), 'font=2.2.0\ngroup1=1.3.0-canary.1\n');
});

test('does nothing outside a planning run', async () => {
  const file = path.join(mkdtempSync(path.join(tmpdir(), 'plan-')), 'out');
  await plugin.verifyRelease({ key: 'font' }, { nextRelease: { version: '2.2.0' }, logger });
  assert.equal(existsSync(file), false);
});
