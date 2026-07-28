import fs from "node:fs";

import { resolveWorkspacePath } from "../shared/path-utils.js";

import type { LocalizationApplyFileGroup } from "../types.js";

export interface LocatedLocalizationSource {
  readonly filePath: string;
  readonly absolutePath: string;
  readonly exists: boolean;
  readonly readable: boolean;
  readonly size: number;
}

export function locateLocalizationSources(
  workspaceRoot: string,
  groups: readonly LocalizationApplyFileGroup[],
): readonly LocatedLocalizationSource[] {
  return groups.map((group) => {
    const absolutePath = resolveWorkspacePath(
      workspaceRoot,
      group.filePath,
    );

    if (!fs.existsSync(absolutePath)) {
      return {
        filePath: group.filePath,
        absolutePath,
        exists: false,
        readable: false,
        size: 0,
      };
    }

    let readable = true;
    try {
      fs.accessSync(absolutePath, fs.constants.R_OK);
    } catch {
      readable = false;
    }

    const stats = fs.statSync(absolutePath);
    return {
      filePath: group.filePath,
      absolutePath,
      exists: stats.isFile(),
      readable: readable && stats.isFile(),
      size: stats.isFile() ? stats.size : 0,
    };
  });
}
