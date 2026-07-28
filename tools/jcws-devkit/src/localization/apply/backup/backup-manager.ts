import fs from "node:fs";
import path from "node:path";

import { calculateFileChecksum } from "./checksum.js";
import { writeLocalizationBackupManifest } from "./manifest.js";
import {
  BackupCreationError,
  ChecksumMismatchError,
  SourceNotFoundError,
} from "../shared/errors.js";
import {
  resolveWorkspacePath,
  toWorkspaceRelativePath,
} from "../shared/path-utils.js";

import type {
  LocalizationBackupFile,
  LocalizationBackupManifest,
} from "./manifest.js";
import type { LocatedLocalizationSource } from "./source-locator.js";

function createBackupId(createdAt: string): string {
  return createdAt
    .replace(/[-:]/gu, "")
    .replace(/\.\d{3}Z$/u, "Z");
}

export interface CreateLocalizationBackupInput {
  readonly workspaceRoot: string;
  readonly backupBasePath: string;
  readonly sources: readonly LocatedLocalizationSource[];
  readonly createdAt?: string;
}

export interface CreateLocalizationBackupResult {
  readonly manifest: LocalizationBackupManifest;
  readonly manifestPath: string;
}

export function createLocalizationBackup(
  input: CreateLocalizationBackupInput,
): CreateLocalizationBackupResult {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const backupRoot = path.resolve(
    input.backupBasePath,
    createBackupId(createdAt),
  );
  const files: LocalizationBackupFile[] = [];

  try {
    for (const source of input.sources) {
      if (!source.exists || !source.readable) {
        throw new SourceNotFoundError(
          `Source file is unavailable for backup: ${source.filePath}`,
        );
      }

      const originalPath = resolveWorkspacePath(
        input.workspaceRoot,
        source.filePath,
      );
      const relativePath = toWorkspaceRelativePath(
        input.workspaceRoot,
        originalPath,
      );
      const backupPath = path.join(
        backupRoot,
        "files",
        relativePath,
      );

      fs.mkdirSync(path.dirname(backupPath), {
        recursive: true,
      });
      fs.copyFileSync(originalPath, backupPath);

      const checksum = calculateFileChecksum(originalPath);
      const backupChecksum = calculateFileChecksum(backupPath);
      if (checksum !== backupChecksum) {
        throw new ChecksumMismatchError(
          `Backup checksum mismatch: ${source.filePath}`,
        );
      }

      files.push({
        originalPath,
        backupPath,
        checksum,
        size: source.size,
      });
    }

    const manifest: LocalizationBackupManifest = {
      version: 1,
      createdAt,
      workspaceRoot: path.resolve(input.workspaceRoot),
      backupRoot,
      files,
    };
    const manifestPath = writeLocalizationBackupManifest(
      manifest,
    );
    return { manifest, manifestPath };
  } catch (caught) {
    if (
      caught instanceof SourceNotFoundError ||
      caught instanceof ChecksumMismatchError
    ) {
      throw caught;
    }
    throw new BackupCreationError(
      `Unable to create localization backup: ${backupRoot}`,
      { cause: caught },
    );
  }
}
