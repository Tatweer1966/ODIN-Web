import crypto from "node:crypto";

import {
  findKeyByValue,
  hasLocaleKey,
} from "./catalog-utils.js";
import { TranslationKeyGenerator } from "./key-generator.js";

import type { LocalizationScanResult } from "../types.js";
import type {
  LocalizationMigrationEntry,
  LocalizationMigrationPlan,
  MigrationPlannerOptions,
} from "./types.js";

const VALID_KEY_SEGMENT_PATTERN =
  /^[A-Za-z][A-Za-z0-9_-]*$/;

function normalizeKeySegment(
  segment: string,
): string {
  const normalized = segment
    .trim()
    .normalize("NFKD")
    .replace(/\p{Mark}/gu, "")
    .replace(/[^A-Za-z0-9_-]+/g, "");

  const nonEmptySegment =
    normalized.length > 0
      ? normalized
      : "text";

  const prefixedSegment = /^[0-9]/u.test(
    nonEmptySegment,
  )
    ? `n${nonEmptySegment}`
    : nonEmptySegment;

  if (
    !VALID_KEY_SEGMENT_PATTERN.test(
      prefixedSegment,
    )
  ) {
    return "text";
  }

  return prefixedSegment;
}

function normalizeTranslationKey(
  key: string,
): string {
  const segments = key
    .split(".")
    .map((segment) =>
      normalizeKeySegment(segment),
    )
    .filter((segment) => segment.length > 0);

  return segments.length > 0
    ? segments.join(".")
    : "common.text";
}

export class LocalizationMigrationPlanner {
  private readonly keyGenerator =
    new TranslationKeyGenerator();

  createPlan(
    scanResult: LocalizationScanResult,
    options: MigrationPlannerOptions = {},
  ): LocalizationMigrationPlan {
    const namespace = options.namespace ?? "common";
    const usedKeys = new Set<string>();
    const entries: LocalizationMigrationEntry[] = [];

    for (const finding of scanResult.findings) {
      const existingKey =
        options.existingEnglishCatalog
          ? findKeyByValue(
              options.existingEnglishCatalog.values,
              finding.value,
            )
          : undefined;

      const candidateKey =
        existingKey ??
        this.keyGenerator.generate({
          finding,
          namespace,
        });

      let generatedKey = normalizeTranslationKey(
        candidateKey,
      );

      generatedKey = this.makeUniqueKey(
        generatedKey,
        usedKeys,
      );

      const keyAlreadyExists =
        options.existingEnglishCatalog
          ? hasLocaleKey(
              options.existingEnglishCatalog.values,
              generatedKey,
            )
          : false;

      let status:
        | "new"
        | "existing-value"
        | "existing-key" = "new";

      if (existingKey !== undefined) {
        status = "existing-value";
      }
      else if (keyAlreadyExists) {
        status = "existing-key";
      }

      usedKeys.add(generatedKey);

      entries.push({
        id: this.createEntryId(
          finding.filePath,
          finding.line,
          finding.column,
          finding.value,
        ),
        key: generatedKey,
        sourceValue: finding.value,
        filePath: finding.filePath,
        line: finding.line,
        column: finding.column,
        kind: finding.kind,
        status,
        ...(existingKey !== undefined
          ? {
              existingKey:
                normalizeTranslationKey(
                  existingKey,
                ),
            }
          : {}),
      });
    }

    return {
      repositoryRoot: scanResult.repositoryRoot,
      sourceRoot: scanResult.sourceRoot,
      generatedAt: new Date().toISOString(),
      filesScanned: scanResult.filesScanned,
      findingsCount: scanResult.findings.length,
      entries,
      summary: {
        newKeys: entries.filter(
          (entry) => entry.status === "new",
        ).length,
        existingValues: entries.filter(
          (entry) =>
            entry.status === "existing-value",
        ).length,
        existingKeys: entries.filter(
          (entry) =>
            entry.status === "existing-key",
        ).length,
      },
    };
  }

  private makeUniqueKey(
    baseKey: string,
    usedKeys: Set<string>,
  ): string {
    if (!usedKeys.has(baseKey)) {
      return baseKey;
    }

    let suffix = 2;

    while (
      usedKeys.has(
        `${baseKey}${String(suffix)}`,
      )
    ) {
      suffix += 1;
    }

    return `${baseKey}${String(suffix)}`;
  }

  private createEntryId(
    filePath: string,
    line: number,
    column: number,
    value: string,
  ): string {
    return crypto
      .createHash("sha256")
      .update(
        [
          filePath,
          String(line),
          String(column),
          value,
        ].join(":"),
      )
      .digest("hex")
      .slice(0, 16);
  }
}
