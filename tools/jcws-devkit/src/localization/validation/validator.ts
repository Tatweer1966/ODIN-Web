import type {
  LocalizationValidationIssue,
  LocalizationValidationReport,
  LocalizationValidationResult,
} from "./types.js";

const KEY_SEGMENT_PATTERN =
  /^[A-Za-z][A-Za-z0-9_-]*$/;

const PLACEHOLDER_PATTERN =
  /\{\{\s*[A-Za-z_][A-Za-z0-9_.-]*\s*\}\}|\{\s*[A-Za-z_][A-Za-z0-9_.-]*\s*\}/g;

function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function hasMalformedPlaceholder(
  value: string,
): boolean {
  const withoutValidPlaceholders = value.replace(
    PLACEHOLDER_PATTERN,
    "",
  );

  return (
    withoutValidPlaceholders.includes("{") ||
    withoutValidPlaceholders.includes("}")
  );
}

function sortIssues(
  issues: LocalizationValidationIssue[],
): LocalizationValidationIssue[] {
  return [...issues].sort((left, right) => {
    const keyComparison = left.key.localeCompare(
      right.key,
    );

    if (keyComparison !== 0) {
      return keyComparison;
    }

    const severityComparison =
      left.severity.localeCompare(right.severity);

    if (severityComparison !== 0) {
      return severityComparison;
    }

    return left.type.localeCompare(right.type);
  });
}

export class LocalizationCatalogValidator {
  public validate(
    catalog: unknown,
    catalogPath?: string,
  ): LocalizationValidationResult {
    const issues: LocalizationValidationIssue[] = [];

    const keysByValue = new Map<string, string[]>();

    let totalKeys = 0;
    let stringEntries = 0;
    let objectEntries = 0;

    const visit = (
      value: unknown,
      keyPath: string,
    ): void => {
      if (typeof value === "string") {
        stringEntries += 1;
        totalKeys += 1;

        if (value.trim().length === 0) {
          issues.push({
            severity: "error",
            type: "empty-translation",
            key: keyPath,
            message:
              "Translation values must not be empty.",
            value,
          });
        }

        if (hasMalformedPlaceholder(value)) {
          issues.push({
            severity: "error",
            type: "malformed-placeholder",
            key: keyPath,
            message:
              "Translation contains an unmatched or malformed placeholder.",
            value,
          });
        }

        const existingKeys =
          keysByValue.get(value) ?? [];

        existingKeys.push(keyPath);
        keysByValue.set(value, existingKeys);

        return;
      }

      if (!isPlainObject(value)) {
        issues.push({
          severity: "error",
          type: "invalid-node",
          key: keyPath,
          message:
            "Catalog nodes must be strings or plain objects.",
        });

        return;
      }

      objectEntries += 1;

      const entries = Object.entries(value);

      if (
        entries.length === 0 &&
        keyPath.length > 0
      ) {
        issues.push({
          severity: "warning",
          type: "empty-object",
          key: keyPath,
          message:
            "Catalog object does not contain translation entries.",
        });
      }

      for (const [segment, childValue] of entries) {
        const childPath =
          keyPath.length === 0
            ? segment
            : `${keyPath}.${segment}`;

        if (!KEY_SEGMENT_PATTERN.test(segment)) {
          issues.push({
            severity: "error",
            type: "invalid-key",
            key: childPath,
            message:
              `Invalid catalog key segment "${segment}". Keys must begin with a letter and contain only letters, numbers, underscores, or hyphens.`,
          });
        }

        visit(childValue, childPath);
      }
    };

    if (!isPlainObject(catalog)) {
      issues.push({
        severity: "error",
        type: "invalid-root",
        key: "",
        message:
          "Localization catalog root must be a plain object.",
      });
    }
    else {
      visit(catalog, "");
    }

    for (const [value, keys] of keysByValue) {
      if (keys.length <= 1) {
        continue;
      }

      const sortedKeys = [...keys].sort(
        (left, right) =>
          left.localeCompare(right),
      );

      issues.push({
        severity: "warning",
        type: "duplicate-value",
        key: sortedKeys[0] ?? "",
        message:
          `The same translation value is used by ${String(sortedKeys.length)} catalog keys.`,
        value,
        relatedKeys: sortedKeys,
      });
    }

    const sortedIssues = sortIssues(issues);

    const errors = sortedIssues.filter(
      (issue) => issue.severity === "error",
    ).length;

    const warnings = sortedIssues.length - errors;

    const report: LocalizationValidationReport = {
      generatedAt: new Date().toISOString(),
      valid: errors === 0,
      issues: sortedIssues,
      summary: {
        totalKeys,
        stringEntries,
        objectEntries,
        errors,
        warnings,
      },
    };

    if (catalogPath !== undefined) {
      report.catalogPath = catalogPath;
    }

    return {
      report,
    };
  }
}
