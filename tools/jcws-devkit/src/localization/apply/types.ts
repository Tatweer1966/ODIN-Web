import type {
  ClassifiedLocalizationEntry,
  ClassifiedLocalizationPlan,
  LocalizationConfidence,
} from "../classification/types.js";

export type ApplyMode = "dry-run" | "apply";

export interface LocalizationApplyOptions {
  readonly planPath: string;
  readonly reportPath: string;
  readonly minimumConfidence: LocalizationConfidence;
  readonly includeNonExportable: boolean;
  readonly mode: ApplyMode;
}

export interface LocalizationApplyContext {
  readonly repositoryRoot: string;
  readonly startedAt: string;
  readonly options: LocalizationApplyOptions;
}

export interface LocalizationApplyFileGroup {
  readonly filePath: string;
  readonly absolutePath: string;
  readonly exists: boolean;
  readonly entries: readonly ClassifiedLocalizationEntry[];
}

export interface LocalizationApplySelection {
  readonly accepted: readonly ClassifiedLocalizationEntry[];
  readonly rejected: readonly ClassifiedLocalizationEntry[];
}

export type LocalizationApplyDiagnosticCode =
  | "PLAN_FILE_NOT_FOUND"
  | "PLAN_FILE_UNREADABLE"
  | "PLAN_JSON_INVALID"
  | "PLAN_SCHEMA_INVALID"
  | "SOURCE_FILE_NOT_FOUND";

export interface LocalizationApplyDiagnostic {
  readonly code: LocalizationApplyDiagnosticCode;
  readonly message: string;
  readonly filePath?: string;
  readonly entryId?: string;
}

export interface LocalizationApplySummary {
  readonly loadedEntries: number;
  readonly selectedEntries: number;
  readonly rejectedEntries: number;
  readonly sourceFiles: number;
  readonly missingSourceFiles: number;
  readonly dryRun: boolean;
}

export interface LocalizationApplyReport {
  readonly version: 1;
  readonly generatedAt: string;
  readonly repositoryRoot: string;
  readonly planPath: string;
  readonly reportPath: string;
  readonly mode: ApplyMode;
  readonly minimumConfidence: LocalizationConfidence;
  readonly includeNonExportable: boolean;
  readonly summary: LocalizationApplySummary;
  readonly files: readonly LocalizationApplyFileGroup[];
  readonly diagnostics: readonly LocalizationApplyDiagnostic[];
  readonly valid: boolean;
}

export interface LocalizationApplyResult {
  readonly plan: ClassifiedLocalizationPlan;
  readonly selection: LocalizationApplySelection;
  readonly groups: readonly LocalizationApplyFileGroup[];
  readonly report: LocalizationApplyReport;
}
