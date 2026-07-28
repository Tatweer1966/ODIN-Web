import { describe, expect, it } from "vitest";

import { LocalizationCatalogBuilder } from "../src/localization/catalog/catalog-builder.js";

import type {
  ClassifiedLocalizationEntry,
  ClassifiedLocalizationPlan,
} from "../src/localization/classification/types.js";

function createPlan(): ClassifiedLocalizationPlan {
  return {
    repositoryRoot: "C:/project",
    sourceRoot: "C:/project/frontend/src",
    generatedAt: "2026-07-27T00:00:00.000Z",
    filesScanned: 2,
    findingsCount: 4,
    entries: [
      {
        id: "1",
        key: "odin.dashboard.save",
        sourceValue: "Save",
        filePath: "frontend/src/pages/Dashboard.tsx",
        line: 10,
        column: 5,
        kind: "jsx-text",
        status: "new",
        classification: {
          category: "ui-text",
          confidence: "high",
          export: true,
          score: 95,
          reasons: ["JSX text"],
        },
      },
      {
        id: "2",
        key: "odin.users.deleteUser",
        sourceValue: "Delete User",
        filePath: "frontend/src/components/UserDialog.tsx",
        line: 20,
        column: 5,
        kind: "string-literal",
        status: "new",
        classification: {
          category: "ui-text",
          confidence: "high",
          export: true,
          score: 75,
          reasons: ["UI component"],
        },
      },
      {
        id: "3",
        key: "odin.api.contentType",
        sourceValue: "Content-Type",
        filePath: "frontend/src/api.ts",
        line: 30,
        column: 5,
        kind: "string-literal",
        status: "new",
        classification: {
          category: "http-header",
          confidence: "low",
          export: false,
          score: 0,
          reasons: ["HTTP header"],
        },
      },
      {
        id: "4",
        key: "odin.common.save",
        sourceValue: "Save",
        filePath: "frontend/src/components/Toolbar.tsx",
        line: 40,
        column: 5,
        kind: "string-literal",
        status: "new",
        classification: {
          category: "ui-text",
          confidence: "medium",
          export: true,
          score: 60,
          reasons: ["UI component"],
        },
      },
    ],
    summary: {
      newKeys: 4,
      existingValues: 0,
      existingKeys: 0,
      highConfidence: 2,
      mediumConfidence: 1,
      lowConfidence: 1,
      exportable: 3,
      ignored: 1,
      categories: {
        "ui-text": 3,
        "http-header": 1,
      },
    },
  };
}

function createEntry(
  overrides: Partial<ClassifiedLocalizationEntry>,
): ClassifiedLocalizationEntry {
  const firstEntry = createPlan().entries.at(0);

  if (firstEntry === undefined) {
    throw new Error("Test fixture must contain at least one entry.");
  }

  return {
    ...structuredClone(firstEntry),
    ...overrides,
  };
}

describe("LocalizationCatalogBuilder", () => {
  it("creates a nested deterministic catalog", () => {
    const result = new LocalizationCatalogBuilder().build(
      createPlan(),
      "odin",
    );

    expect(result.catalog).toEqual({
      common: {
        save: "Save",
      },
      dashboard: {
        save: "Save",
      },
      users: {
        deleteUser: "Delete User",
      },
    });

    expect(result.report.catalogEntries).toBe(3);
    expect(result.report.valid).toBe(true);
  });

  it("reports duplicate values without failing", () => {
    const result = new LocalizationCatalogBuilder().build(
      createPlan(),
      "odin",
    );

    expect(result.report.duplicateValues).toEqual([
      {
        value: "Save",
        keys: [
          "common.save",
          "dashboard.save",
        ],
      },
    ]);
  });

  it("detects conflicting duplicate keys", () => {
    const plan = createPlan();

    plan.entries.push(
      createEntry({
        id: "5",
        key: "odin.dashboard.save",
        sourceValue: "Store",
      }),
    );

    const result = new LocalizationCatalogBuilder().build(
      plan,
      "odin",
    );

    expect(result.report.valid).toBe(false);
    expect(result.report.conflicts).toHaveLength(1);
    expect(result.report.conflicts[0]?.key).toBe(
      "dashboard.save",
    );
  });

  it("detects string and object collisions", () => {
    const plan = createPlan();

    plan.entries.push(
      createEntry({
        id: "6",
        key: "odin.dashboard",
        sourceValue: "Dashboard",
      }),
    );

    const result = new LocalizationCatalogBuilder().build(
      plan,
      "odin",
    );

    expect(result.report.valid).toBe(false);
    expect(result.report.collisions).toHaveLength(1);
  });
});