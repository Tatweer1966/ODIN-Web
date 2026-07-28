export { manageReactTranslationImports } from "./import-manager.js";
export { locateLocalizationNode } from "./node-locator.js";
export {
  buildJsxTranslationExpression,
  buildTranslationCall,
} from "./replacement-builder.js";
export { rewriteLocalizationSource } from "./rewrite-engine.js";
export type {
  LocalizationFileRewriteResult,
  LocalizationImportManagementResult,
  LocalizationRewriteChange,
  LocalizationRewriteDiagnostic,
  LocalizationRewriteOptions,
  LocalizationRewriteStatus,
} from "./types.js";
