// WebMCP (https://webmachinelearning.github.io/webmcp/): the same tools as the
// MCP server, registered in the page with document.modelContext.registerTool.
// The site computes webmcpToolSpecs() at build time so the page only ships
// JSON; runWebmcpTool loads lazily, on the first call an agent makes.
import * as z from 'zod/v4';
import type { DataSource } from './source.ts';
import {
  READ_ONLY,
  TOOL_HANDLERS,
  TOOL_INFO,
  TOOL_INPUTS,
  TOOL_NAMES,
  fail,
  type ToolName,
  type ToolResult,
} from './tools.ts';

// zod sets its English messages as an import side effect that the site's
// bundler drops, leaving agents with a bare "Invalid input". Set it here.
z.config(z.locales.en());

export interface WebmcpToolSpec {
  name: ToolName;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: { readOnlyHint: boolean };
}

/** JSON-serializable tool definitions, minus the execute callback. */
export const webmcpToolSpecs = (): WebmcpToolSpec[] =>
  TOOL_NAMES.map(name => {
    // The dialect URI only adds bytes to every page.
    const { $schema: _, ...inputSchema } = z.toJSONSchema(TOOL_INPUTS[name], { io: 'input' });
    return {
      name,
      ...TOOL_INFO[name],
      inputSchema,
      annotations: { readOnlyHint: READ_ONLY.readOnlyHint },
    };
  });

const isToolName = (name: string): name is ToolName =>
  (TOOL_NAMES as readonly string[]).includes(name);

/**
 * Validates raw agent input with the tool's schema and runs it. Never
 * rejects: a rejected execute promise reaches the agent as a bare
 * OperationError, so every failure comes back as a readable isError result.
 */
export async function runWebmcpTool(
  source: DataSource,
  name: string,
  rawInput: unknown,
): Promise<ToolResult> {
  if (!isToolName(name)) return fail(`Unknown tool "${name}".`);
  const parsed = TOOL_INPUTS[name].safeParse(rawInput ?? {});
  if (!parsed.success) return fail(`Invalid input for ${name}: ${z.prettifyError(parsed.error)}`);
  try {
    // The union of handler signatures collapses to an intersection of
    // inputs; parsed.data matches TOOL_INPUTS[name] by construction.
    const run = TOOL_HANDLERS[name] as (s: DataSource, input: unknown) => Promise<ToolResult>;
    return await run(source, parsed.data);
  } catch (err) {
    console.error(`webmcp ${name} failed`, err);
    return fail(`${name} hit an unexpected error.`);
  }
}
