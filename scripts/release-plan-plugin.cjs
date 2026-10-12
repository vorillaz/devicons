// scripts/release-plan-plugin.cjs
//
// semantic-release plugin that records the version a run would release. The
// Release workflow dry-runs both groups first with RELEASE_PLAN_FILE set to
// $GITHUB_OUTPUT, then only builds, tests and publishes the groups that will
// actually ship: most pushes release nothing and skip the build entirely.
//
// verifyRelease runs in dry-run mode too, and only when there is a release,
// so a group with nothing to release writes nothing (empty output).
//
// Config:
//   key: 'group1' | 'font'   the output name, `<key>=<version>`
//
// Outside a planning run (RELEASE_PLAN_FILE unset) it does nothing.

const { appendFileSync } = require('node:fs');

exports.verifyRelease = async ({ key }, { nextRelease, logger }) => {
  const file = process.env.RELEASE_PLAN_FILE;
  if (!file) return;
  appendFileSync(file, `${key}=${nextRelease.version}\n`);
  logger.log(`Planned ${key} release ${nextRelease.version}`);
};
