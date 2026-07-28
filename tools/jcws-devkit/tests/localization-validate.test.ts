import { describe, expect, it } from "vitest";

import { LocalizationCatalogValidator } from "../src/localization/validation/validator.js";

describe("LocalizationCatalogValidator", () => {
  it("accepts a valid nested catalog", () => {
    const result =
      new LocalizationCatalogValidator().validate({
        dashboard: {
          save: "Save",
          title: "Dashboard",
        },
        users: {
          deleteUser: "Delete User",
        },
      });

    expect(result.report.valid).toBe(true);
    expect(result.report.summary.errors).toBe(0);
    expect(result.report.summary.stringEntries).toBe(
      3,
    );
  });

  it("reports empty translations", () => {
    const result =
      new LocalizationCatalogValidator().validate({
        dashboard: {
          save: "",
        },
      });

    expect(result.report.valid).toBe(false);

    expect(
      result.report.issues.some(
        (issue) =>
          issue.type === "empty-translation" &&
          issue.key === "dashboard.save",
      ),
    ).toBe(true);
  });

  it("reports invalid key segments", () => {
    const result =
      new LocalizationCatalogValidator().validate({
        "dashboard title": {
          save: "Save",
        },
      });

    expect(result.report.valid).toBe(false);

    expect(
      result.report.issues.some(
        (issue) => issue.type === "invalid-key",
      ),
    ).toBe(true);
  });

  it("reports invalid catalog nodes", () => {
    const result =
      new LocalizationCatalogValidator().validate({
        dashboard: ["Save"],
      });

    expect(result.report.valid).toBe(false);

    expect(
      result.report.issues.some(
        (issue) => issue.type === "invalid-node",
      ),
    ).toBe(true);
  });

  it("reports malformed placeholders", () => {
    const result =
      new LocalizationCatalogValidator().validate({
        users: {
          welcome: "Welcome {name",
        },
      });

    expect(result.report.valid).toBe(false);

    expect(
      result.report.issues.some(
        (issue) =>
          issue.type === "malformed-placeholder",
      ),
    ).toBe(true);
  });

  it("warns about duplicate values", () => {
    const result =
      new LocalizationCatalogValidator().validate({
        common: {
          save: "Save",
        },
        dashboard: {
          save: "Save",
        },
      });

    expect(result.report.valid).toBe(true);
    expect(result.report.summary.warnings).toBe(1);

    expect(
      result.report.issues.some(
        (issue) =>
          issue.type === "duplicate-value",
      ),
    ).toBe(true);
  });
});
