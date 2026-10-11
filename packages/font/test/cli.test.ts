import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.resolve(__dirname, "../dist/cli.mjs");

describe("devicons CLI bundle", () => {
  // The release workflow builds before semantic-release stamps the new
  // version into package.json, so the CLI must read it at runtime.
  it.skipIf(!fs.existsSync(CLI))("reports the version from the shipped package.json", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "devicons-cli-"));
    fs.mkdirSync(path.join(dir, "dist"));
    fs.copyFileSync(CLI, path.join(dir, "dist/cli.mjs"));
    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({ name: "devicons", version: "9.9.9", type: "module" }),
    );
    const out = execFileSync(process.execPath, [path.join(dir, "dist/cli.mjs"), "--version"]);
    expect(out.toString().trim()).toBe("9.9.9");
  });
});
