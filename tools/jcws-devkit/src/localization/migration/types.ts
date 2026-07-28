import type {
  LocalizationFinding,
  LocalizationFindingKind,
} from "../types.js";

export interface LocaleCatalog {
  locale: string;
  filePath: string;
  values: Record<string, unknown>;
}

export interface LocalizationMigrationEntry {
  id: string;
  key: string;
  sourceValue: string;
  filePath: string;
  line: number;
  column: number;
  kind: LocalizationFindingKind;
  status: "new" | "existing-value" | "existing-key";
  existingKey?: string;
}

export interface LocalizationMigrationPlan {
  repositoryRoot: string;
  sourceRoot: string;
  generatedAt: string;
  filesScanned: number;
  findingsCount: number;
  entries: LocalizationMigrationEntry[];
  summary: {
    newKeys: number;
    existingValues: number;
    existingKeys: number;
  };
}

export interface MigrationPlannerOptions {
  namespace?: string;
  existingEnglishCatalog?: LocaleCatalog;
}

export interface FindingKeyContext {
  finding: LocalizationFinding;
  namespace: string;
}