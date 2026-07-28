import type {
  LocalizationMigrationEntry,
  LocalizationMigrationPlan,
} from "../migration/types.js";

export type LocalizationConfidence =
  | "high"
  | "medium"
  | "low";

export type LocalizationCategory =
  | "ui-text"
  | "button-label"
  | "form-label"
  | "page-title"
  | "message"
  | "http-header"
  | "http-method"
  | "mime-type"
  | "url"
  | "route"
  | "css-class"
  | "color"
  | "identifier"
  | "file-path"
  | "technical"
  | "unknown";

export interface LocalizationClassification {
  category: LocalizationCategory;
  confidence: LocalizationConfidence;
  export: boolean;
  score: number;
  reasons: string[];
}

export interface ClassifiedLocalizationEntry
  extends LocalizationMigrationEntry {
  classification: LocalizationClassification;
}

export interface ClassifiedLocalizationPlan
  extends Omit<
    LocalizationMigrationPlan,
    "entries" | "summary"
  > {
  entries: ClassifiedLocalizationEntry[];
  summary: LocalizationMigrationPlan["summary"] & {
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
    exportable: number;
    ignored: number;
    categories: Record<string, number>;
  };
}
