import { describe, it, expect } from "vitest";
import { nodeVersionError } from "../src/node-version";

describe("nodeVersionError", () => {
  it("accepts Node 20 and newer", () => {
    expect(nodeVersionError("20.0.0")).toBeNull();
    expect(nodeVersionError("24.21.0")).toBeNull();
  });

  it("explains how to upgrade on older Node", () => {
    const message = nodeVersionError("18.19.1");
    expect(message).toContain("Node.js 20");
    expect(message).toContain("18.19.1");
  });
});
