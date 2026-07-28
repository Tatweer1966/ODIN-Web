export {
  resolveLocalizationApplyOptions,
  type ResolveLocalizationApplyOptionsInput,
} from "./apply-options.js";
export { LocalizationApplyEngine } from "./apply-engine.js";
export {
  selectLocalizationEntries,
  type SelectLocalizationEntriesOptions,
} from "./confidence-filter.js";
export {
  classifiedLocalizationPlanSchema,
  loadClassifiedLocalizationPlan,
  LocalizationApplyPlanError,
} from "./plan-loader.js";
export {
  createLocalizationApplyReport,
  type CreateLocalizationApplyReportInput,
} from "./report.js";
export { writeLocalizationApplyReport } from "./report-writer.js";
export { groupLocalizationEntriesByFile } from "./source-grouping.js";
export type {
  ApplyMode,
  LocalizationApplyContext,
  LocalizationApplyDiagnostic,
  LocalizationApplyDiagnosticCode,
  LocalizationApplyFileGroup,
  LocalizationApplyOptions,
  LocalizationApplyReport,
  LocalizationApplyResult,
  LocalizationApplySelection,
  LocalizationApplySummary,
} from "./types.js";
