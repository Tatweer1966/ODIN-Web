import type { ClassifiedLocalizationEntry } from "../../classification/types.js";

export type LocalizationRewriteStatus =
  | "rewritten"
  | "not-found"
  | "ambiguous"
  | "unsupported"
  | "source-mismatch";

export interface LocalizationRewriteOptions {
  readonly translationFunction: string;
}

export interface LocalizationRewriteDiagnostic {
  readonly entryId: string;
  readonly filePath: string;
  readonly status: Exclude<LocalizationRewriteStatus, "rewritten">;
  readonly message: string;
}

export interface LocalizationRewriteChange {
  readonly entryId: string;
  readonly filePath: string;
  readonly kind: ClassifiedLocalizationEntry["kind"];
  readonly key: string;
  readonly before: string;
  readonly after: string;
  readonly start: number;
  readonly end: number;
}

export interface LocalizationFileRewriteResult {
  readonly filePath: string;
  readonly originalText: string;
  readonly rewrittenText: string;
  readonly changes: readonly LocalizationRewriteChange[];
  readonly diagnostics: readonly LocalizationRewriteDiagnostic[];
  readonly changed: boolean;
}
