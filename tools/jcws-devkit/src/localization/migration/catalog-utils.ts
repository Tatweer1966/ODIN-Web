export interface FlatLocaleEntry {
  key: string;
  value: string;
}

export function flattenLocaleCatalog(
  value: Record<string, unknown>,
  prefix = "",
): FlatLocaleEntry[] {
  const entries: FlatLocaleEntry[] = [];

  for (const [key, child] of Object.entries(value)) {
    const fullKey =
      prefix.length > 0 ? `${prefix}.${key}` : key;

    if (typeof child === "string") {
      entries.push({
        key: fullKey,
        value: child,
      });

      continue;
    }

    if (
      child !== null &&
      typeof child === "object" &&
      !Array.isArray(child)
    ) {
      entries.push(
        ...flattenLocaleCatalog(
          child as Record<string, unknown>,
          fullKey,
        ),
      );
    }
  }

  return entries;
}

export function findKeyByValue(
  catalog: Record<string, unknown>,
  targetValue: string,
): string | undefined {
  const normalizedTarget = normalizeValue(targetValue);

  return flattenLocaleCatalog(catalog).find(
    (entry) =>
      normalizeValue(entry.value) === normalizedTarget,
  )?.key;
}

export function hasLocaleKey(
  catalog: Record<string, unknown>,
  key: string,
): boolean {
  const segments = key.split(".");
  let current: unknown = catalog;

  for (const segment of segments) {
    if (
      current === null ||
      typeof current !== "object" ||
      Array.isArray(current)
    ) {
      return false;
    }

    const record = current as Record<string, unknown>;

    if (!(segment in record)) {
      return false;
    }

    current = record[segment];
  }

  return typeof current === "string";
}

function normalizeValue(value: string): string {
  return value.replace(/\s+/gu, " ").trim().toLowerCase();
}