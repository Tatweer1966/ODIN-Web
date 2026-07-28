import { describe, expect, it } from "vitest";

import type { ClassifiedLocalizationEntry } from "../../../../src/localization/classification/types.js";
import { rewriteLocalizationSource } from "../../../../src/localization/apply/ast/index.js";

function entry(
  overrides: Partial<ClassifiedLocalizationEntry>,
): ClassifiedLocalizationEntry {
  return {
    id: "entry-1",
    key: "common.save",
    sourceValue: "Save",
    filePath: "src/example.tsx",
    line: 1,
    column: 1,
    kind: "jsx-text",
    status: "new",
    classification: {
      category: "button-label",
      confidence: "high",
      export: true,
      score: 1,
      reasons: [],
    },
    ...overrides,
  };
}

describe("rewriteLocalizationSource", () => {
  it("rewrites JSX text", () => {
    const source = "export const View = () => <button>Save</button>;";
    const result = rewriteLocalizationSource("src/example.tsx", source, [
      entry({ line: 1, column: 34 }),
    ]);

    expect(result.rewrittenText).toContain('<button>{t("common.save")}</button>');
    expect(result.changes).toHaveLength(1);
    expect(result.diagnostics).toHaveLength(0);
  });

  it("rewrites a string literal", () => {
    const source = 'toast.success("Saved");';
    const result = rewriteLocalizationSource("src/example.ts", source, [
      entry({
        kind: "string-literal",
        sourceValue: "Saved",
        key: "messages.saved",
        line: 1,
        column: 15,
      }),
    ]);

    expect(result.rewrittenText).toBe('toast.success(t("messages.saved"));');
  });

  it("rewrites a no-substitution template literal", () => {
    const source = "const label = `Save`;";
    const result = rewriteLocalizationSource("src/example.ts", source, [
      entry({ kind: "template-literal", line: 1, column: 15 }),
    ]);

    expect(result.rewrittenText).toBe('const label = t("common.save");');
  });

  it("rewrites a template expression with interpolation variables", () => {
    const source = "const message = `Welcome ${name}`;";
    const result = rewriteLocalizationSource("src/example.ts", source, [
      entry({
        kind: "template-literal",
        sourceValue: "Welcome ${name}",
        key: "messages.welcome",
        line: 1,
        column: 17,
      }),
    ]);

    expect(result.rewrittenText).toBe(
      'const message = t("messages.welcome", { name });',
    );
  });

  it("supports a custom translation function", () => {
    const source = 'const label = "Save";';
    const result = rewriteLocalizationSource(
      "src/example.ts",
      source,
      [entry({ kind: "string-literal", line: 1, column: 15 })],
      { translationFunction: "i18n.t" },
    );

    expect(result.rewrittenText).toBe('const label = i18n.t("common.save");');
  });

  it("returns a diagnostic when the source value cannot be found", () => {
    const source = "export const value = 1;";
    const result = rewriteLocalizationSource("src/example.ts", source, [
      entry({ kind: "string-literal", line: 1, column: 1 }),
    ]);

    expect(result.changed).toBe(false);
    expect(result.diagnostics[0]?.status).toBe("not-found");
  });

  it("uses location data to select the nearest repeated value", () => {
    const source = 'const first = "Save";\nconst second = "Save";';
    const result = rewriteLocalizationSource("src/example.ts", source, [
      entry({ kind: "string-literal", line: 2, column: 16 }),
    ]);

    expect(result.rewrittenText).toContain('const first = "Save";');
    expect(result.rewrittenText).toContain('const second = t("common.save");');
  });

  it("rewrites multiple entries from bottom to top", () => {
    const source = 'const first = "Save";\nconst second = "Cancel";';
    const result = rewriteLocalizationSource("src/example.ts", source, [
      entry({ kind: "string-literal", line: 1, column: 15 }),
      entry({
        id: "entry-2",
        kind: "string-literal",
        sourceValue: "Cancel",
        key: "common.cancel",
        line: 2,
        column: 16,
      }),
    ]);

    expect(result.rewrittenText).toBe(
      'const first = t("common.save");\nconst second = t("common.cancel");',
    );
    expect(result.changes).toHaveLength(2);
  });
});
