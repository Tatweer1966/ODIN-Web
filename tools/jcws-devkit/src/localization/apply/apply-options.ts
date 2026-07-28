import path from "node:path";

import type { LocalizationConfidence } from "../classification/types.js";
import type {
  ApplyMode,
  LocalizationApplyOptions,
} from "./types.js";

export interface ResolveLocalizationApplyOptionsInput {
  readonly planPath?: string;
  readonly reportPath?: string;
  readonly minimumConfidence?: LocalizationConfidence;
  readonly includeNonExportable?: boolean;
  readonly mode?: ApplyMode;
}

const DEFAULT_PLAN_PATH =
  "reports/localization-classified-plan.json";
const DEFAULT_REPORT_PATH =
  "reports/localization-apply.json";

export function resolveLocalizationApplyOptions(
  repositoryRoot: string,
  input: ResolveLocalizationApplyOptionsInput = {},
): LocalizationApplyOptions {
  return {
    planPath: path.resolve(
      repositoryRoot,
      input.planPath ?? DEFAULT_PLAN_PATH,
    ),
    reportPath: path.resolve(
      repositoryRoot,
      input.reportPath ?? DEFAULT_REPORT_PATH,
    ),
    minimumConfidence:
      input.minimumConfidence ?? "high",
    includeNonExportable:
      input.includeNonExportable ?? false,
    mode: input.mode ?? "dry-run",
  };
}
