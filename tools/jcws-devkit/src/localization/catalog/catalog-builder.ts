import type {
  ClassifiedLocalizationEntry,
  ClassifiedLocalizationPlan,
} from "../classification/types.js";

import type {
  LocalizationCatalogBuildResult,
  LocalizationCatalogCollision,
  LocalizationCatalogConflict,
  LocalizationCatalogDuplicateValue,
  LocalizationCatalogTree,
  LocalizationCatalogValue,
} from "./types.js";

interface CatalogCandidate {
  fullKey: string;
  catalogKey: string;
  value: string;
  filePath: string;
}

function isCatalogTree(
  value: LocalizationCatalogValue | undefined,
): value is LocalizationCatalogTree {
  return typeof value === "object";
}

function stripNamespace(
  key: string,
  namespace: string,
): string {
  const prefix = `${namespace}.`;

  if (key === namespace) {
    return "";
  }

  if (key.startsWith(prefix)) {
    return key.slice(prefix.length);
  }

  return key;
}

function normalizeKey(key: string): string {
  return key
    .split(".")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .join(".");
}

function toCandidate(
  entry: ClassifiedLocalizationEntry,
  namespace: string,
): CatalogCandidate | undefined {
  if (!entry.classification.export) {
    return undefined;
  }

  const catalogKey = normalizeKey(
    stripNamespace(entry.key, namespace),
  );

  if (catalogKey.length === 0) {
    return undefined;
  }

  return {
    fullKey: entry.key,
    catalogKey,
    value: entry.sourceValue,
    filePath: entry.filePath,
  };
}

function sortTree(
  tree: LocalizationCatalogTree,
): LocalizationCatalogTree {
  const sorted: LocalizationCatalogTree = {};

  const keys = Object.keys(tree).sort((left, right) =>
    left.localeCompare(right),
  );

  for (const key of keys) {
    const value = tree[key];

    if (value === undefined) {
      continue;
    }

    sorted[key] = isCatalogTree(value)
      ? sortTree(value)
      : value;
  }

  return sorted;
}

function findConflicts(
  candidates: CatalogCandidate[],
): LocalizationCatalogConflict[] {
  const entriesByKey = new Map<
    string,
    CatalogCandidate[]
  >();

  for (const candidate of candidates) {
    const existingEntries =
      entriesByKey.get(candidate.catalogKey) ?? [];

    existingEntries.push(candidate);

    entriesByKey.set(
      candidate.catalogKey,
      existingEntries,
    );
  }

  const conflicts: LocalizationCatalogConflict[] = [];

  for (const [key, entries] of entriesByKey) {
    const values = [
      ...new Set(
        entries.map((entry) => entry.value),
      ),
    ].sort((left, right) =>
      left.localeCompare(right),
    );

    if (values.length <= 1) {
      continue;
    }

    const sourceFiles = [
      ...new Set(
        entries.map((entry) => entry.filePath),
      ),
    ].sort((left, right) =>
      left.localeCompare(right),
    );

    conflicts.push({
      key,
      values,
      sourceFiles,
    });
  }

  return conflicts.sort((left, right) =>
    left.key.localeCompare(right.key),
  );
}

function findDuplicateValues(
  candidates: CatalogCandidate[],
): LocalizationCatalogDuplicateValue[] {
  const keysByValue = new Map<string, Set<string>>();

  for (const candidate of candidates) {
    const keys =
      keysByValue.get(candidate.value) ??
      new Set<string>();

    keys.add(candidate.catalogKey);

    keysByValue.set(candidate.value, keys);
  }

  const duplicates: LocalizationCatalogDuplicateValue[] =
    [];

  for (const [value, keys] of keysByValue) {
    if (keys.size <= 1) {
      continue;
    }

    duplicates.push({
      value,
      keys: [...keys].sort((left, right) =>
        left.localeCompare(right),
      ),
    });
  }

  return duplicates.sort((left, right) =>
    left.value.localeCompare(right.value),
  );
}

function findCollisions(
  keys: string[],
): LocalizationCatalogCollision[] {
  const keySet = new Set(keys);

  const collisions: LocalizationCatalogCollision[] =
    [];

  for (const key of keys) {
    const segments = key.split(".");

    for (
      let index = 1;
      index < segments.length;
      index += 1
    ) {
      const parentKey = segments
        .slice(0, index)
        .join(".");

      if (!keySet.has(parentKey)) {
        continue;
      }

      collisions.push({
        key,
        conflictingKey: parentKey,
        reason:
          "A catalog key cannot be both a string and an object.",
      });
    }
  }

  return collisions.sort((left, right) => {
    const keyComparison = left.key.localeCompare(
      right.key,
    );

    if (keyComparison !== 0) {
      return keyComparison;
    }

    return left.conflictingKey.localeCompare(
      right.conflictingKey,
    );
  });
}

function insertCatalogValue(
  tree: LocalizationCatalogTree,
  key: string,
  value: string,
): void {
  const segments = key.split(".");

  let current = tree;

  for (
    let index = 0;
    index < segments.length;
    index += 1
  ) {
    const segment = segments[index];

    if (segment === undefined) {
      continue;
    }

    const isLeaf =
      index === segments.length - 1;

    if (isLeaf) {
      current[segment] = value;
      continue;
    }

    const existingValue = current[segment];

    if (isCatalogTree(existingValue)) {
      current = existingValue;
      continue;
    }

    const child: LocalizationCatalogTree = {};

    current[segment] = child;
    current = child;
  }
}

function countExportableEntries(
  plan: ClassifiedLocalizationPlan,
): number {
  return plan.entries.filter(
    (entry) => entry.classification.export,
  ).length;
}

function countSkippedNamespaceEntries(
  plan: ClassifiedLocalizationPlan,
  namespace: string,
): number {
  return plan.entries.filter((entry) => {
    if (!entry.classification.export) {
      return false;
    }

    const key = normalizeKey(
      stripNamespace(entry.key, namespace),
    );

    return key.length === 0;
  }).length;
}

export class LocalizationCatalogBuilder {
  public build(
    plan: ClassifiedLocalizationPlan,
    namespace: string,
  ): LocalizationCatalogBuildResult {
    const candidates = plan.entries
      .map((entry) => toCandidate(entry, namespace))
      .filter(
        (
          candidate,
        ): candidate is CatalogCandidate =>
          candidate !== undefined,
      );

    const conflicts = findConflicts(candidates);

    const uniqueCandidatesByKey = new Map<
      string,
      CatalogCandidate
    >();

    for (const candidate of candidates) {
      if (
        uniqueCandidatesByKey.has(
          candidate.catalogKey,
        )
      ) {
        continue;
      }

      uniqueCandidatesByKey.set(
        candidate.catalogKey,
        candidate,
      );
    }

    const uniqueCandidates = [
      ...uniqueCandidatesByKey.values(),
    ].sort((left, right) =>
      left.catalogKey.localeCompare(
        right.catalogKey,
      ),
    );

    const collisions = findCollisions(
      uniqueCandidates.map(
        (candidate) => candidate.catalogKey,
      ),
    );

    const conflictingKeys = new Set(
      conflicts.map((conflict) => conflict.key),
    );

    const collidingKeys = new Set<string>();

    for (const collision of collisions) {
      collidingKeys.add(collision.key);
      collidingKeys.add(
        collision.conflictingKey,
      );
    }

    const catalog: LocalizationCatalogTree = {};

    let catalogEntries = 0;

    for (const candidate of uniqueCandidates) {
      if (
        conflictingKeys.has(candidate.catalogKey) ||
        collidingKeys.has(candidate.catalogKey)
      ) {
        continue;
      }

      insertCatalogValue(
        catalog,
        candidate.catalogKey,
        candidate.value,
      );

      catalogEntries += 1;
    }

    const warnings: string[] = [];

    const skippedNamespaceEntries =
      countSkippedNamespaceEntries(
        plan,
        namespace,
      );

    if (skippedNamespaceEntries > 0) {
      warnings.push(
        `${String(skippedNamespaceEntries)} exportable entry or entries had no key below namespace "${namespace}".`,
      );
    }

    if (conflicts.length > 0) {
      warnings.push(
        `${String(conflicts.length)} duplicate-key conflict or conflicts were excluded.`,
      );
    }

    if (collisions.length > 0) {
      warnings.push(
        `${String(collisions.length)} key-tree collision or collisions were excluded.`,
      );
    }

    const exportableEntries =
      countExportableEntries(plan);

    return {
      catalog: sortTree(catalog),
      report: {
        generatedAt: new Date().toISOString(),
        namespace,
        totalPlanEntries: plan.entries.length,
        exportableEntries,
        ignoredEntries:
          plan.entries.length - exportableEntries,
        catalogEntries,
        duplicateValues:
          findDuplicateValues(uniqueCandidates),
        conflicts,
        collisions,
        warnings,
        valid:
          conflicts.length === 0 &&
          collisions.length === 0,
      },
    };
  }
}