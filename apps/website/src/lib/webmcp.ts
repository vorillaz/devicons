// Registers the Devicons agent tools with WebMCP so an agent driving the
// browser can call them on any page. The specs are rendered into the page at
// build time (components/webmcp.astro); zod and the API client load only on
// an agent's first tool call.
import type { WebmcpToolSpec } from '@dev.icons/agent/webmcp';

interface ModelContext {
  registerTool(tool: WebmcpToolSpec & { execute: Execute }): Promise<void> | void;
}

type Execute = (input: unknown) => Promise<unknown>;

// The spec puts modelContext on document; Chrome's early-preview builds
// exposed it on navigator.
const getModelContext = (): ModelContext | undefined =>
  (document as { modelContext?: ModelContext }).modelContext ??
  (navigator as { modelContext?: ModelContext }).modelContext;

let runtime: Promise<(name: string, input: unknown) => Promise<unknown>> | undefined;

const loadRuntime = () =>
  (runtime ??= Promise.all([
    import('@dev.icons/agent/webmcp'),
    import('@dev.icons/agent/source'),
  ]).then(([{ runWebmcpTool }, { createHttpSource }]) => {
    // Same origin, so preview deploys answer from their own build.
    const source = createHttpSource({ baseUrl: location.origin });
    return (name, input) => runWebmcpTool(source, name, input);
  }));

const execute =
  (name: string): Execute =>
  async input => {
    try {
      return await (await loadRuntime())(name, input);
    } catch (err) {
      // Usually a stale chunk after a deploy; let the next call retry.
      runtime = undefined;
      console.error(`webmcp ${name} failed to load`, err);
      return {
        content: [{ type: 'text', text: 'Devicons tools failed to load. Reload the page and retry.' }],
        isError: true,
      };
    }
  };

export function registerWebmcpTools(specs: WebmcpToolSpec[]): void {
  const modelContext = getModelContext();
  if (!modelContext) return;
  for (const spec of specs) {
    // Registration lives as long as the document; ClientRouter navigations
    // keep it, so the tools are never unregistered.
    Promise.resolve()
      .then(() => modelContext.registerTool({ ...spec, execute: execute(spec.name) }))
      .catch(err => console.error(`webmcp: could not register ${spec.name}`, err));
  }
}
