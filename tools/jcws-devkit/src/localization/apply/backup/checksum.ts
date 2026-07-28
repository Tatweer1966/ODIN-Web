import { createHash } from "node:crypto";
import fs from "node:fs";

export function calculateFileChecksum(filePath: string): string {
  const contents = fs.readFileSync(filePath);
  return createHash("sha256").update(contents).digest("hex");
}

export function calculateFileChecksums(
  filePaths: readonly string[],
): ReadonlyMap<string, string> {
  return new Map(
    [...filePaths]
      .sort((left, right) => left.localeCompare(right))
      .map((filePath) => [
        filePath,
        calculateFileChecksum(filePath),
      ] as const),
  );
}
