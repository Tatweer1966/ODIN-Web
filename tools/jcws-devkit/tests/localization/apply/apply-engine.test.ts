import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { LocalizationApplyEngine } from "../../../src/localization/apply/apply-engine.js";
import { selectLocalizationEntries } from "../../../src/localization/apply/confidence-filter.js";
import { LocalizationApplyPlanError } from "../../../src/localization/apply/plan-loader.js";

import type {
  ClassifiedLocalizationEntry,
  ClassifiedLocalizationPlan,
  LocalizationConfidence,
} from "../../../src/localization/classification/types.js";

const temporaryDirectories: string[] = [];

function createTemporaryRepository(): string {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "jcws-apply-"),
  );
  temporaryDirectories.push(directory);
  return directory;
}

function createEntry(
  id: string,
  confidence: LocalizationConfidence,
  exportable: boolean,
  filePath = "frontend/src/App.tsx",
): ClassifiedLocalizationEntry {
  return {
    id,
    key: `odin.app.${id}`,
    sourceValue: `Value ${id}`,
    filePath,
    line: 10,
    column: 5,
    kind: "jsx-text",
    status: "new",
    classification: {
      category: "ui-text",
      confidence,
      export: exportable,
      score: 100,
      reasons: ["test"],
    },
  };
}

function createPlan(
  repositoryRoot: string,
  entries: readonly ClassifiedLocalizationEntry[],
): ClassifiedLocalizationPlan {
  return {
    repositoryRoot,
    sourceRoot: path.join(repositoryRoot, "frontend/src"),
    generatedAt: "2026-07-28T00:00:00.000Z",
    filesScanned: 1,
    findingsCount: entries.length,
    entries: [...entries],
    summary: {
      newKeys: entries.length,
      existingValues: 0,
      existingKeys: 0,
      highConfidence: entries.filter(
        (entry) =>
          entry.classification.confidence === "high",
      ).length,
      mediumConfidence: entries.filter(
        (entry) =>
          entry.classification.confidence === "medium",
      ).length,
      lowConfidence: entries.filter(
        (entry) =>
          entry.classification.confidence === "low",
      ).length,
      exportable: entries.filter(
        (entry) => entry.classification.export,
      ).length,
      ignored: entries.filter(
        (entry) => !entry.classification.export,
      ).length,
      categories: {
        "ui-text": entries.length,
      },
    },
  };
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, {
      recursive: true,
      force: true,
    });
  }
});

describe("selectLocalizationEntries", () => {
  it("selects only exportable entries meeting the confidence threshold", () => {
    const entries = [
      createEntry("high", "high", true),
      createEntry("medium", "medium", true),
      createEntry("low", "low", true),
      createEntry("ignored", "high", false),
    ];

    const selection = selectLocalizationEntries(entries, {
      minimumConfidence: "medium",
      includeNonExportable: false,
    });

    expect(
      selection.accepted.map((entry) => entry.id),
    ).toEqual(["high", "medium"]);
    expect(
      selection.rejected.map((entry) => entry.id),
    ).toEqual(["low", "ignored"]);
  });

  it("can include non-exportable entries explicitly", () => {
    const selection = selectLocalizationEntries(
      [createEntry("ignored", "high", false)],
      {
        minimumConfidence: "high",
        includeNonExportable: true,
      },
    );

    expect(selection.accepted).toHaveLength(1);
  });
});

describe("LocalizationApplyEngine", () => {
  it("loads, filters, groups, and writes a dry-run report", () => {
    const repositoryRoot = createTemporaryRepository();
    const sourcePath = path.join(
      repositoryRoot,
      "frontend/src/App.tsx",
    );
    const planPath = path.join(
      repositoryRoot,
      "reports/classified.json",
    );
    const reportPath = path.join(
      repositoryRoot,
      "reports/apply.json",
    );

    fs.mkdirSync(path.dirname(sourcePath), {
      recursive: true,
    });
    fs.mkdirSync(path.dirname(planPath), {
      recursive: true,
    });
    fs.writeFileSync(sourcePath, "export {};\n", "utf8");

    const entries = [
      createEntry("high", "high", true),
      createEntry("medium", "medium", true),
    ];
    fs.writeFileSync(
      planPath,
      JSON.stringify(
        createPlan(repositoryRoot, entries),
        null,
        2,
      ),
      "utf8",
    );

    const result = new LocalizationApplyEngine().run(
      repositoryRoot,
      {
        planPath,
        reportPath,
        minimumConfidence: "high",
      },
    );

    expect(result.report.valid).toBe(true);
    expect(result.report.summary).toMatchObject({
      loadedEntries: 2,
      selectedEntries: 1,
      rejectedEntries: 1,
      sourceFiles: 1,
      missingSourceFiles: 0,
      dryRun: true,
    });
    expect(result.groups[0]?.entries[0]?.id).toBe(
      "high",
    );
    expect(fs.existsSync(reportPath)).toBe(true);
  });

  it("reports missing source files without rewriting anything", () => {
    const repositoryRoot = createTemporaryRepository();
    const planPath = path.join(
      repositoryRoot,
      "reports/classified.json",
    );
    const reportPath = path.join(
      repositoryRoot,
      "reports/apply.json",
    );

    fs.mkdirSync(path.dirname(planPath), {
      recursive: true,
    });
    fs.writeFileSync(
      planPath,
      JSON.stringify(
        createPlan(repositoryRoot, [
          createEntry("missing", "high", true),
        ]),
        null,
        2,
      ),
      "utf8",
    );

    const result = new LocalizationApplyEngine().run(
      repositoryRoot,
      {
        planPath,
        reportPath,
      },
    );

    expect(result.report.valid).toBe(false);
    expect(
      result.report.diagnostics[0]?.code,
    ).toBe("SOURCE_FILE_NOT_FOUND");
    expect(
      result.report.summary.missingSourceFiles,
    ).toBe(1);
  });

  it("throws a typed error when the plan file is missing", () => {
    const repositoryRoot = createTemporaryRepository();

    expect(() =>
      new LocalizationApplyEngine().run(repositoryRoot, {
        planPath: "reports/missing.json",
      }),
    ).toThrowError(LocalizationApplyPlanError);
  });

  it("rejects a plan that violates the classified-plan schema", () => {
    const repositoryRoot = createTemporaryRepository();
    const planPath = path.join(
      repositoryRoot,
      "reports/invalid.json",
    );

    fs.mkdirSync(path.dirname(planPath), {
      recursive: true,
    });
    fs.writeFileSync(
      planPath,
      JSON.stringify({ entries: [] }),
      "utf8",
    );

    try {
      new LocalizationApplyEngine().run(repositoryRoot, {
        planPath,
      });
      throw new Error("Expected plan loading to fail.");
    } catch (caught) {
      expect(caught).toBeInstanceOf(
        LocalizationApplyPlanError,
      );
      expect(
        (caught as LocalizationApplyPlanError)
          .diagnostic.code,
      ).toBe("PLAN_SCHEMA_INVALID");
    }
  });
});
