export { locateLocalizationNode } from "./node-locator.js";
export {
  buildJsxTranslationExpression,
  buildTranslationCall,
} from "./replacement-builder.js";
export { rewriteLocalizationSource } from "./rewrite-engine.js";
export type {
  LocalizationFileRewriteResult,
  LocalizationRewriteChange,
  LocalizationRewriteDiagnostic,
  LocalizationRewriteOptions,
  LocalizationRewriteStatus,
} from "./types.js";
