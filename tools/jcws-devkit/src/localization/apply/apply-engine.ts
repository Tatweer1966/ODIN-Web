import path from "node:path";

import {
  resolveLocalizationApplyOptions,
  type ResolveLocalizationApplyOptionsInput,
} from "./apply-options.js";
import { selectLocalizationEntries } from "./confidence-filter.js";
import { loadClassifiedLocalizationPlan } from "./plan-loader.js";
import { createLocalizationApplyReport } from "./report.js";
import { writeLocalizationApplyReport } from "./report-writer.js";
import { groupLocalizationEntriesByFile } from "./source-grouping.js";

import type {
  LocalizationApplyContext,
  LocalizationApplyResult,
} from "./types.js";

export class LocalizationApplyEngine {
  public run(
    repositoryRootInput: string,
    optionsInput: ResolveLocalizationApplyOptionsInput = {},
  ): LocalizationApplyResult {
    const repositoryRoot = path.resolve(
      repositoryRootInput,
    );
    const options = resolveLocalizationApplyOptions(
      repositoryRoot,
      optionsInput,
    );
    const context: LocalizationApplyContext = {
      repositoryRoot,
      startedAt: new Date().toISOString(),
      options,
    };

    const plan = loadClassifiedLocalizationPlan(
      options.planPath,
    );
    const selection = selectLocalizationEntries(
      plan.entries,
      {
        minimumConfidence: options.minimumConfidence,
        includeNonExportable:
          options.includeNonExportable,
      },
    );
    const groups = groupLocalizationEntriesByFile(
      repositoryRoot,
      selection.accepted,
    );
    const report = createLocalizationApplyReport({
      context,
      loadedEntries: plan.entries.length,
      selection,
      groups,
    });

    writeLocalizationApplyReport(report);

    return {
      plan,
      selection,
      groups,
      report,
    };
  }
}
