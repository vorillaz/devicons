// `npx devicons` entry. Bundled by tsup into dist/cli.mjs together with
// @dev.icons/agent, the MCP SDK, and zod, so the package gains no runtime
// dependencies.
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { run } from '@dev.icons/agent/cli';

// Read at runtime: the release workflow builds before semantic-release stamps
// the new version into package.json, so a build-time constant would be stale.
const { version } = createRequire(import.meta.url)('../package.json') as {
  version: string;
};

const code = await run(process.argv.slice(2), {
  stdout: s => process.stdout.write(s),
  stderr: s => process.stderr.write(s),
  cwd: process.cwd(),
  version,
  writeFile: (p, data) => fs.writeFile(p, data, 'utf8'),
  exists: p =>
    fs.access(p).then(
      () => true,
      () => false,
    ),
  mkdir: async p => {
    await fs.mkdir(p, { recursive: true });
  },
  // Serve until the client closes stdin, then let the process exit.
  serveMcp: factory =>
    new Promise<void>(resolve => {
      serveStdio(factory);
      process.stdin.once('end', resolve);
      process.stdin.once('close', resolve);
    }),
});

process.exitCode = code;
