import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config/loader.js";

describe("loadConfig", () => {
  it("returns defaults when no file exists", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "jcws-config-"));
    const loaded = loadConfig(cwd);
    expect(loaded.config.projectName).toBe("ODIN-Web");
    expect(loaded.config.logLevel).toBe("info");
  });

  it("validates a supplied configuration", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "jcws-config-"));
    fs.writeFileSync(
      path.join(cwd, "jcws-devkit.config.json"),
      JSON.stringify({ projectName: "JCWS", logLevel: "debug", reportsDirectory: "out" }),
      "utf8"
    );
    const loaded = loadConfig(cwd);
    expect(loaded.config).toEqual({
      projectName: "JCWS",
      logLevel: "debug",
      reportsDirectory: "out"
    });
  });
});
