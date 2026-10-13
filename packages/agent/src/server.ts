import { McpServer } from '@modelcontextprotocol/server';
import type { DataSource } from './source.ts';
import { registerDeviconsTools } from './tools.ts';

export { TOOL_NAMES } from './tools.ts';

export const SERVER_INSTRUCTIONS = [
  'Devicons is a free library of developer, brand, framework, and tooling logos as SVGs and React, Vue, and Svelte components.',
  'Call search_icons first and use the returned slug; never guess a slug.',
  'Call get_icon for SVG markup, variant URLs, and ready-to-paste code for the user\'s framework.',
  'Use list_categories and get_category to browse groups such as databases or LLM providers.',
  'The SVG files and packages are MIT licensed; the logos are trademarks of their owners.',
].join(' ');

export function createDeviconsServer(source: DataSource, version: string): McpServer {
  const server = new McpServer(
    { name: 'devicons', title: 'Devicons', version },
    { instructions: SERVER_INSTRUCTIONS },
  );
  registerDeviconsTools(server, source);
  return server;
}
