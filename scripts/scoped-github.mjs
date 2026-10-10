// scripts/scoped-github.mjs
//
// @semantic-release/github with its success/fail steps fed only the commits
// that touch the configured `paths`, so a font release doesn't comment
// "released in devicons vX" on PRs that only changed the React package (and
// vice versa). Every other step passes straight through.

import * as github from '@semantic-release/github';
import { filterCommitsByPaths } from './scoped-commits.mjs';

const strip = ({ paths, ...config }) => config;

const scoped = (step) => async (pluginConfig, context) => {
  const commits = await filterCommitsByPaths(
    context.commits ?? [],
    pluginConfig.paths,
    context.cwd,
  );
  return step(strip(pluginConfig), { ...context, commits });
};

export const verifyConditions = (c, ctx) => github.verifyConditions(strip(c), ctx);
export const publish = (c, ctx) => github.publish(strip(c), ctx);
export const addChannel = (c, ctx) => github.addChannel(strip(c), ctx);
export const success = scoped(github.success);
export const fail = scoped(github.fail);
