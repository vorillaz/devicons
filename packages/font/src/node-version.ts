// The CLI bundles the MCP SDK, which needs Node 20+. Checked at runtime
// instead of via `engines`, so installing the font on older Node still works.
export const MIN_NODE_MAJOR = 20;

export function nodeVersionError(version: string): string | null {
  const major = Number(version.split('.')[0]);
  if (major >= MIN_NODE_MAJOR) return null;
  return `devicons: the CLI needs Node.js ${MIN_NODE_MAJOR} or newer (found ${version}). The icon font itself works on any version.\n`;
}
