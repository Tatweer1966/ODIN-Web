import type {
  ClassifiedLocalizationEntry,
  LocalizationConfidence,
} from "../classification/types.js";
import type { LocalizationApplySelection } from "./types.js";

const confidenceRank: Readonly<
  Record<LocalizationConfidence, number>
> = {
  low: 1,
  medium: 2,
  high: 3,
};

export interface SelectLocalizationEntriesOptions {
  readonly minimumConfidence: LocalizationConfidence;
  readonly includeNonExportable: boolean;
}

function isAccepted(
  entry: ClassifiedLocalizationEntry,
  options: SelectLocalizationEntriesOptions,
): boolean {
  if (
    !options.includeNonExportable &&
    !entry.classification.export
  ) {
    return false;
  }

  return (
    confidenceRank[entry.classification.confidence] >=
    confidenceRank[options.minimumConfidence]
  );
}

export function selectLocalizationEntries(
  entries: readonly ClassifiedLocalizationEntry[],
  options: SelectLocalizationEntriesOptions,
): LocalizationApplySelection {
  const accepted: ClassifiedLocalizationEntry[] = [];
  const rejected: ClassifiedLocalizationEntry[] = [];

  for (const entry of entries) {
    if (isAccepted(entry, options)) {
      accepted.push(entry);
    } else {
      rejected.push(entry);
    }
  }

  return {
    accepted,
    rejected,
  };
}
