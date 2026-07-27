import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { detectWorkspace } from "../src/workspace/detector.js";

const created: string[] = [];
afterEach(() => { for (const item of created.splice(0)) fs.rmSync(item, { recursive: true, force: true }); });

describe("detectWorkspace", () => {
  it("detects a frontend candidate", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "jcws-workspace-")); created.push(root);
    fs.writeFileSync(path.join(root, "jcws-devkit.config.json"), JSON.stringify({ frontendCandidates: ["frontend"] }));
    fs.mkdirSync(path.join(root, "frontend", "src", "locales"), { recursive: true });
    fs.writeFileSync(path.join(root, "frontend", "package.json"), "{}");
    const result = detectWorkspace({ cwd: root });
    expect(result.frontendRoot).toBe(path.join(root, "frontend"));
    expect(result.checks.find((check) => check.name === "Frontend")?.status).toBe("pass");
  });
});
