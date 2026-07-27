import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { writeJsonReport, writeMarkdownReport } from "../src/reports/writer.js";

describe("report writer", () => {
  it("writes JSON and Markdown reports", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "jcws-reports-"));
    const jsonPath = writeJsonReport(directory, "sample.json", { ok: true });
    const markdownPath = writeMarkdownReport(directory, "sample.md", "# Report");
    expect(fs.existsSync(jsonPath)).toBe(true);
    expect(fs.readFileSync(markdownPath, "utf8")).toBe("# Report\n");
  });
});
