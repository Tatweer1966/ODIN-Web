import fs from "node:fs";
import path from "node:path";

import { z } from "zod";

export interface LocalizationBackupFile {
  readonly originalPath: string;
  readonly backupPath: string;
  readonly checksum: string;
  readonly size: number;
}

export interface LocalizationBackupManifest {
  readonly version: 1;
  readonly createdAt: string;
  readonly workspaceRoot: string;
  readonly backupRoot: string;
  readonly files: readonly LocalizationBackupFile[];
}

const backupFileSchema = z.object({
  originalPath: z.string().min(1),
  backupPath: z.string().min(1),
  checksum: z.string().regex(/^[a-f0-9]{64}$/u),
  size: z.number().int().nonnegative(),
});

export const localizationBackupManifestSchema = z.object({
  version: z.literal(1),
  createdAt: z.string().min(1),
  workspaceRoot: z.string().min(1),
  backupRoot: z.string().min(1),
  files: z.array(backupFileSchema),
});

export function writeLocalizationBackupManifest(
  manifest: LocalizationBackupManifest,
): string {
  const manifestPath = path.join(
    manifest.backupRoot,
    "manifest.json",
  );
  fs.mkdirSync(path.dirname(manifestPath), {
    recursive: true,
  });
  fs.writeFileSync(
    manifestPath,
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  return manifestPath;
}
