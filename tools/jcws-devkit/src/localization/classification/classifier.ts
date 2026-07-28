import path from "node:path";

import type {
  LocalizationMigrationEntry,
  LocalizationMigrationPlan,
} from "../migration/types.js";
import type {
  ClassifiedLocalizationEntry,
  ClassifiedLocalizationPlan,
  LocalizationCategory,
  LocalizationClassification,
  LocalizationConfidence,
} from "./types.js";

const HTTP_HEADERS = new Set([
  "accept",
  "accept-encoding",
  "accept-language",
  "authorization",
  "cache-control",
  "connection",
  "content-disposition",
  "content-encoding",
  "content-length",
  "content-type",
  "cookie",
  "etag",
  "host",
  "if-modified-since",
  "origin",
  "pragma",
  "referer",
  "set-cookie",
  "transfer-encoding",
  "user-agent",
  "www-authenticate",
  "x-api-key",
  "x-request-id",
]);

const HTTP_METHODS = new Set([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
  "CONNECT",
  "TRACE",
]);

const MIME_TYPE_PATTERN =
  /^[a-z][a-z0-9.+-]*\/[a-z0-9][a-z0-9.+-]*$/i;

const URL_PATTERN =
  /^(?:https?:\/\/|wss?:\/\/|mailto:|tel:)/i;

const ROUTE_PATTERN =
  /^\/(?:[a-z0-9._~!$&'()*+,;=:@%-]+\/?)*$/i;

const HEX_COLOR_PATTERN =
  /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

const FILE_PATH_PATTERN =
  /^(?:\.{0,2}[\\/])?(?:[\w.-]+[\\/])+[\w.-]+$/;

const FILE_NAME_PATTERN =
  /^[\w.-]+\.(?:json|js|jsx|ts|tsx|css|scss|svg|png|jpe?g|gif|webp|pdf|csv|xml|yaml|yml)$/i;

const IDENTIFIER_PATTERN =
  /^[a-z_$][a-z0-9_$]*(?:[._:-][a-z0-9_$]+)+$/i;

const TAILWIND_TOKEN_PATTERN =
  /^(?:(?:sm|md|lg|xl|2xl|hover|focus|active|disabled|dark|rtl|ltr):)*-?(?:block|hidden|flex|grid|inline|absolute|relative|fixed|sticky|items-|justify-|content-|self-|place-|gap-|space-|p[trblxy]?-[\w[\]./%-]+|m[trblxy]?-[\w[\]./%-]+|w-|h-|min-|max-|text-|font-|leading-|tracking-|bg-|border-|rounded|shadow|opacity-|z-|top-|right-|bottom-|left-|inset-|translate-|rotate-|scale-|cursor-|select-|overflow-|object-|transition|duration-|ease-).*/i;

const CSS_CLASS_LIST_PATTERN =
  /^(?:[a-z0-9_:[\]./%-]+\s+){1,}[a-z0-9_:[\]./%-]+$/i;

const TECHNICAL_FILE_PATTERN =
  /(?:^|[\\/])(?:api|client|http|axios|fetch|config|constants?|types?|schemas?|routes?|services?|store|utils?|helpers?)\.[jt]sx?$/i;

const UI_FILE_PATTERN =
  /(?:^|[\\/])(?:pages?|components?|views?|screens?|layouts?|features?)(?:[\\/]|$)/i;

function scoreToConfidence(
  score: number,
): LocalizationConfidence {
  if (score >= 70) {
    return "high";
  }

  if (score >= 40) {
    return "medium";
  }

  return "low";
}

function createResult(
  category: LocalizationCategory,
  score: number,
  exportValue: boolean,
  reasons: string[],
): LocalizationClassification {
  return {
    category,
    score,
    confidence: scoreToConfidence(score),
    export: exportValue,
    reasons,
  };
}

function looksLikeHumanText(value: string): boolean {
  if (!/[a-z]/i.test(value)) {
    return false;
  }

  if (value.includes(" ")) {
    return true;
  }

  return /^[A-Z][a-z]+(?:[A-Z][a-z]+)*$/.test(value);
}

function classifyTechnicalValue(
  value: string,
): LocalizationClassification | undefined {
  const normalized = value.trim();
  const lowerValue = normalized.toLowerCase();

  if (HTTP_HEADERS.has(lowerValue)) {
    return createResult(
      "http-header",
      0,
      false,
      ["Matches a known HTTP header name"],
    );
  }

  if (HTTP_METHODS.has(normalized.toUpperCase())) {
    return createResult(
      "http-method",
      0,
      false,
      ["Matches a known HTTP method"],
    );
  }

  if (MIME_TYPE_PATTERN.test(normalized)) {
    return createResult(
      "mime-type",
      0,
      false,
      ["Matches a MIME type"],
    );
  }

  if (URL_PATTERN.test(normalized)) {
    return createResult(
      "url",
      0,
      false,
      ["Matches an absolute URL or URI"],
    );
  }

  if (
    ROUTE_PATTERN.test(normalized) &&
    normalized !== "/" &&
    !normalized.includes(" ")
  ) {
    return createResult(
      "route",
      5,
      false,
      ["Looks like an application or API route"],
    );
  }

  if (HEX_COLOR_PATTERN.test(normalized)) {
    return createResult(
      "color",
      0,
      false,
      ["Matches a hexadecimal color value"],
    );
  }

  if (
    FILE_PATH_PATTERN.test(normalized) ||
    FILE_NAME_PATTERN.test(normalized)
  ) {
    return createResult(
      "file-path",
      5,
      false,
      ["Looks like a file name or file-system path"],
    );
  }

  const hasCssSyntax =
    normalized.includes("-") ||
    normalized.includes(":") ||
    normalized.includes("[") ||
    normalized.includes("]");

  if (
    TAILWIND_TOKEN_PATTERN.test(normalized) ||
    (
      CSS_CLASS_LIST_PATTERN.test(normalized) &&
      hasCssSyntax
    )
  ) {
    return createResult(
      "css-class",
      0,
      false,
      ["Looks like a CSS or Tailwind class value"],
    );
  }

  if (
    IDENTIFIER_PATTERN.test(normalized) &&
    !normalized.includes(" ")
  ) {
    return createResult(
      "identifier",
      15,
      false,
      ["Looks like a technical identifier or existing key"],
    );
  }

  return undefined;
}

function classifyEntry(
  entry: LocalizationMigrationEntry,
): LocalizationClassification {
  const value = entry.sourceValue.trim();

  if (value.length === 0) {
    return createResult(
      "technical",
      0,
      false,
      ["Empty or whitespace-only value"],
    );
  }

  const technicalResult = classifyTechnicalValue(value);

  if (technicalResult) {
    return technicalResult;
  }

  const baseName = path.basename(entry.filePath);
  const isTechnicalFile =
    TECHNICAL_FILE_PATTERN.test(entry.filePath);
  const isUiFile =
    UI_FILE_PATTERN.test(entry.filePath);
  const isJsxText =
    entry.kind === "jsx-text";

  if (isJsxText) {
    return createResult(
      "ui-text",
      95,
      true,
      [
        "Appears directly inside JSX",
        "Strongly likely to be visible to the user",
      ],
    );
  }
  const normalizedFilePath =
    entry.filePath.replaceAll("\\", "/");

  const isUiSource =
    isUiFile ||
    normalizedFilePath.includes("/components/") ||
    normalizedFilePath.includes("/pages/") ||
    normalizedFilePath.includes("/views/") ||
    normalizedFilePath.includes("/screens/") ||
    normalizedFilePath.includes("/layouts/") ||
    normalizedFilePath.includes("/features/");

  if (isUiSource && looksLikeHumanText(value)) {
    return createResult(
      "ui-text",
      75,
      true,
      [
        "Located in a UI-oriented source directory",
        "Value resembles natural-language text",
      ],
    );
  }

  if (looksLikeHumanText(value) && !isTechnicalFile) {
    return createResult(
      "unknown",
      60,
      true,
      [
        "Natural language",
        "Not inside technical infrastructure",
      ],
    );
  }

  if (isTechnicalFile) {
    return createResult(
      "technical",
      20,
      false,
      [
        `Located in technical source file ${baseName}`,
        "No strong user-interface context was detected",
      ],
    );
  }

  if (looksLikeHumanText(value)) {
    return createResult(
      "unknown",
      50,
      true,
      [
        "Value resembles natural-language text",
        "User-interface context is not conclusive",
      ],
    );
  }

  return createResult(
    "unknown",
    20,
    false,
    ["No strong evidence that the value is user-visible"],
  );
}

export class LocalizationClassifier {
  public classify(
    plan: LocalizationMigrationPlan,
  ): ClassifiedLocalizationPlan {
    const entries: ClassifiedLocalizationEntry[] =
      plan.entries.map((entry) => ({
        ...entry,
        classification: classifyEntry(entry),
      }));

    const categories: Record<string, number> = {};

    for (const entry of entries) {
      const category = entry.classification.category;
      categories[category] =
        (categories[category] ?? 0) + 1;
    }

    return {
      repositoryRoot: plan.repositoryRoot,
      sourceRoot: plan.sourceRoot,
      generatedAt: new Date().toISOString(),
      filesScanned: plan.filesScanned,
      findingsCount: plan.findingsCount,
      entries,
      summary: {
        ...plan.summary,
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
        categories,
      },
    };
  }
}




