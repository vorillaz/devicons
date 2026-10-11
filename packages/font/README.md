<p align="center">
   <a href="https://devicons.io">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/vorillaz/devicons/canary/apps/website/public/brand/lockup-dark.svg" />
      <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/vorillaz/devicons/canary/apps/website/public/brand/lockup-light.svg" />
      <img src="https://raw.githubusercontent.com/vorillaz/devicons/canary/apps/website/public/brand/lockup-light.svg" alt="Devicons" width="320" />
    </picture>
  </a>
</p>

# devicons

Icon font, CSS, and SVG sprite for developers.

- Website: https://devicons.io
- Documentation: https://devicons.io/docs/icon-font

## Install

```sh
npm install devicons
```

See the [icon font docs](https://devicons.io/docs/icon-font) for usage.

## CLI

Search, inspect, and download SVG logos from your terminal (Node 20+):

```sh
npx devicons search react            # find icons by name, alias, or tag
npx devicons info postgresql         # details, variants, component names
npx devicons svg react --mono        # print the SVG to stdout
npx devicons add react vue --out ./src/icons
npx devicons categories --json       # machine-readable output
```

The CLI reads from the free [Devicons API](https://devicons.io/docs/api/). See the [CLI docs](https://devicons.io/docs/cli/) for every command and exit code.

## MCP server

Give AI agents access to every Devicons logo. Use the hosted server at
`https://devicons.io/api/mcp`, or run it locally over stdio:

```json
{
  "mcpServers": {
    "devicons": { "command": "npx", "args": ["-y", "devicons", "mcp"] }
  }
}
```

Setup for Claude Code, Cursor, VS Code, and others: [MCP docs](https://devicons.io/docs/mcp/).
