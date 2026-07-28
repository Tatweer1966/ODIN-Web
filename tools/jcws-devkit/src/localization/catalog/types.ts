export type LocalizationCatalogValue =
  | string
  | LocalizationCatalogTree;

export interface LocalizationCatalogTree {
  [key: string]: LocalizationCatalogValue;
}

export interface LocalizationCatalogConflict {
  key: string;
  values: string[];
  sourceFiles: string[];
}

export interface LocalizationCatalogCollision {
  key: string;
  conflictingKey: string;
  reason: string;
}

export interface LocalizationCatalogDuplicateValue {
  value: string;
  keys: string[];
}

export interface LocalizationCatalogReport {
  generatedAt: string;
  namespace: string;
  totalPlanEntries: number;
  exportableEntries: number;
  ignoredEntries: number;
  catalogEntries: number;
  duplicateValues: LocalizationCatalogDuplicateValue[];
  conflicts: LocalizationCatalogConflict[];
  collisions: LocalizationCatalogCollision[];
  warnings: string[];
  valid: boolean;
}

export interface LocalizationCatalogBuildResult {
  catalog: LocalizationCatalogTree;
  report: LocalizationCatalogReport;
}
