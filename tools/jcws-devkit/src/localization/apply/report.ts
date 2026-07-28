import type {
  LocalizationApplyContext,
  LocalizationApplyDiagnostic,
  LocalizationApplyFileGroup,
  LocalizationApplyReport,
  LocalizationApplySelection,
} from "./types.js";

export interface CreateLocalizationApplyReportInput {
  readonly context: LocalizationApplyContext;
  readonly loadedEntries: number;
  readonly selection: LocalizationApplySelection;
  readonly groups: readonly LocalizationApplyFileGroup[];
}

function createMissingFileDiagnostics(
  groups: readonly LocalizationApplyFileGroup[],
): readonly LocalizationApplyDiagnostic[] {
  return groups
    .filter((group) => !group.exists)
    .flatMap((group) =>
      group.entries.map((entry) => ({
        code: "SOURCE_FILE_NOT_FOUND" as const,
        message: `Source file not found for localization entry: ${group.filePath}`,
        filePath: group.filePath,
        entryId: entry.id,
      })),
    );
}

export function createLocalizationApplyReport(
  input: CreateLocalizationApplyReportInput,
): LocalizationApplyReport {
  const diagnostics = createMissingFileDiagnostics(
    input.groups,
  );
  const missingSourceFiles = input.groups.filter(
    (group) => !group.exists,
  ).length;

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    repositoryRoot: input.context.repositoryRoot,
    planPath: input.context.options.planPath,
    reportPath: input.context.options.reportPath,
    mode: input.context.options.mode,
    minimumConfidence:
      input.context.options.minimumConfidence,
    includeNonExportable:
      input.context.options.includeNonExportable,
    summary: {
      loadedEntries: input.loadedEntries,
      selectedEntries: input.selection.accepted.length,
      rejectedEntries: input.selection.rejected.length,
      sourceFiles: input.groups.length,
      missingSourceFiles,
      dryRun: input.context.options.mode === "dry-run",
    },
    files: input.groups,
    diagnostics,
    valid: diagnostics.length === 0,
  };
}
