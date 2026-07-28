import { describe, expect, it } from "vitest";

import { LocalizationClassifier } from "../src/localization/classification/classifier.js";

import type { LocalizationMigrationPlan } from "../src/localization/migration/types.js";

function createPlan(): LocalizationMigrationPlan {
  return {
    repositoryRoot: "C:/project",
    sourceRoot: "C:/project/frontend/src",
    generatedAt: "2026-07-27T00:00:00.000Z",
    filesScanned: 2,
    findingsCount: 4,
    entries: [
      {
        id: "1",
        key: "odin.api.contentType",
        sourceValue: "Content-Type",
        filePath: "frontend/src/api.ts",
        line: 10,
        column: 5,
        kind: "string-literal",
        status: "new",
      },
      {
        id: "2",
        key: "odin.dashboard.save",
        sourceValue: "Save",
        filePath: "frontend/src/pages/Dashboard.tsx",
        line: 20,
        column: 8,
        kind: "jsx-text",
        status: "new",
      },
      {
        id: "3",
        key: "odin.api.json",
        sourceValue: "application/json",
        filePath: "frontend/src/api.ts",
        line: 11,
        column: 5,
        kind: "string-literal",
        status: "new",
      },
      {
        id: "4",
        key: "odin.users.deleteUser",
        sourceValue: "Delete User",
        filePath: "frontend/src/components/UserDialog.tsx",
        line: 30,
        column: 8,
        kind: "string-literal",
        status: "new",
      },
    ],
    summary: {
      newKeys: 4,
      existingValues: 0,
      existingKeys: 0,
    },
  };
}

describe("LocalizationClassifier", () => {
  it("ignores HTTP headers and MIME types", () => {
    const result = new LocalizationClassifier().classify(
      createPlan(),
    );

    const contentType = result.entries.find(
      (entry) => entry.sourceValue === "Content-Type",
    );

    const mimeType = result.entries.find(
      (entry) => entry.sourceValue === "application/json",
    );

    expect(contentType?.classification.export).toBe(false);
    expect(contentType?.classification.category).toBe(
      "http-header",
    );

    expect(mimeType?.classification.export).toBe(false);
    expect(mimeType?.classification.category).toBe(
      "mime-type",
    );
  });

  it("exports likely user-visible strings", () => {
    const result = new LocalizationClassifier().classify(
      createPlan(),
    );

    const save = result.entries.find(
      (entry) => entry.sourceValue === "Save",
    );

    const deleteUser = result.entries.find(
      (entry) => entry.sourceValue === "Delete User",
    );

    expect(save?.classification.export).toBe(true);
    expect(save?.classification.confidence).toBe("high");

    expect(deleteUser?.classification.export).toBe(true);
  });

  it("calculates classification totals", () => {
    const result = new LocalizationClassifier().classify(
      createPlan(),
    );

    expect(result.summary.exportable).toBe(2);
    expect(result.summary.ignored).toBe(2);
  });
});