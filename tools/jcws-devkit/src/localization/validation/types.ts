export type LocalizationValidationSeverity =
  | "error"
  | "warning";

export type LocalizationValidationIssueType =
  | "invalid-root"
  | "invalid-node"
  | "invalid-key"
  | "empty-object"
  | "empty-translation"
  | "malformed-placeholder"
  | "duplicate-value";

export interface LocalizationValidationIssue {
  severity: LocalizationValidationSeverity;
  type: LocalizationValidationIssueType;
  key: string;
  message: string;
  value?: string;
  relatedKeys?: string[];
}

export interface LocalizationValidationSummary {
  totalKeys: number;
  stringEntries: number;
  objectEntries: number;
  errors: number;
  warnings: number;
}

export interface LocalizationValidationReport {
  generatedAt: string;
  catalogPath?: string;
  valid: boolean;
  issues: LocalizationValidationIssue[];
  summary: LocalizationValidationSummary;
}

export interface LocalizationValidationResult {
  report: LocalizationValidationReport;
}
