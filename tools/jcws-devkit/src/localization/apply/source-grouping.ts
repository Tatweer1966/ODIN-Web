import fs from "node:fs";
import path from "node:path";

import type { ClassifiedLocalizationEntry } from "../classification/types.js";
import type { LocalizationApplyFileGroup } from "./types.js";

function normalizeRepositoryPath(filePath: string): string {
  return filePath.replace(/[\\/]+/gu, path.sep);
}

function compareEntries(
  left: ClassifiedLocalizationEntry,
  right: ClassifiedLocalizationEntry,
): number {
  if (left.line !== right.line) {
    return right.line - left.line;
  }

  if (left.column !== right.column) {
    return right.column - left.column;
  }

  return left.id.localeCompare(right.id);
}

export function groupLocalizationEntriesByFile(
  repositoryRoot: string,
  entries: readonly ClassifiedLocalizationEntry[],
): readonly LocalizationApplyFileGroup[] {
  const entriesByFile = new Map<
    string,
    ClassifiedLocalizationEntry[]
  >();

  for (const entry of entries) {
    const existing = entriesByFile.get(entry.filePath) ?? [];
    existing.push(entry);
    entriesByFile.set(entry.filePath, existing);
  }

  return [...entriesByFile.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([filePath, groupedEntries]) => {
      const absolutePath = path.resolve(
        repositoryRoot,
        normalizeRepositoryPath(filePath),
      );

      return {
        filePath,
        absolutePath,
        exists: fs.existsSync(absolutePath),
        entries: [...groupedEntries].sort(compareEntries),
      };
    });
}
