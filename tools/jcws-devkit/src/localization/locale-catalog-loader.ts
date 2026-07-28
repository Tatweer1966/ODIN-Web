import path from "node:path";

import { FileSystem } from "../filesystem/file-system.js";

import type { LocaleCatalog } from "./migration/types.js";

export class LocaleCatalogLoader {
  constructor(
    private readonly fileSystem = new FileSystem(),
  ) {}

  load(
    repositoryRoot: string,
    locale: string,
    localeFilePath: string,
  ): LocaleCatalog {
    const resolvedPath = path.resolve(
      repositoryRoot,
      localeFilePath,
    );

    if (!this.fileSystem.exists(resolvedPath)) {
      throw new Error(
        `Locale catalog not found: ${resolvedPath}`,
      );
    }

    const values =
      this.fileSystem.readJson<Record<string, unknown>>(
        resolvedPath,
      );

    return {
      locale,
      filePath: resolvedPath,
      values,
    };
  }
}