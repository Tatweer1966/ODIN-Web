import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { doctorCommand } from "../src/commands/doctor.js";

describe("doctorCommand", () => {
  it("returns structured checks", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "jcws-doctor-"));
    fs.writeFileSync(path.join(cwd, "package.json"), "{}", "utf8");
    const checks = doctorCommand({ cwd });
    expect(checks.length).toBeGreaterThanOrEqual(4);
    expect(checks.some((check) => check.name === "Node.js")).toBe(true);
    expect(checks.some((check) => check.name === "Configuration")).toBe(true);
  });
});
