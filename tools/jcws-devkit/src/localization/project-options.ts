import fs from "node:fs";
import path from "node:path";

import type { CommandContext } from "../core/types.js";
import { detectWorkspace } from "../workspace/detector.js";

export interface LocalizationProjectOverrides {
  readonly source?: string;
  readonly tsconfig?: string;
}

export interface ResolvedLocalizationProjectOptions {
  readonly source: string;
  readonly tsconfig: string;
}

const TYPESCRIPT_CONFIG_CANDIDATES = [
  "tsconfig.app.json",
  "tsconfig.json",
] as const;

export function resolveLocalizationProjectOptions(
  context: CommandContext,
  overrides: LocalizationProjectOverrides = {},
): ResolvedLocalizationProjectOptions {
  const repositoryRoot = path.resolve(context.cwd);
  const workspace = detectWorkspace(context);

  const source = overrides.source
    ? path.relative(
        repositoryRoot,
        path.resolve(repositoryRoot, overrides.source),
      )
    : workspace.sourceRoot
      ? path.relative(repositoryRoot, workspace.sourceRoot)
      : "src";

  const tsconfig = overrides.tsconfig
    ? path.relative(
        repositoryRoot,
        path.resolve(repositoryRoot, overrides.tsconfig),
      )
    : resolveWorkspaceTsconfig(repositoryRoot, workspace.frontendRoot);

  return {
    source: normalizeRelativePath(source),
    tsconfig: normalizeRelativePath(tsconfig),
  };
}

function resolveWorkspaceTsconfig(
  repositoryRoot: string,
  frontendRoot?: string,
): string {
  const roots = frontendRoot
    ? [frontendRoot, repositoryRoot]
    : [repositoryRoot];

  for (const root of roots) {
    for (const candidate of TYPESCRIPT_CONFIG_CANDIDATES) {
      const absolutePath = path.join(root, candidate);

      if (fs.existsSync(absolutePath)) {
        return path.relative(repositoryRoot, absolutePath);
      }
    }
  }

  throw new Error(
    "Unable to resolve a TypeScript configuration. Pass --tsconfig explicitly or add tsconfig.app.json/tsconfig.json to the detected frontend.",
  );
}

function normalizeRelativePath(value: string): string {
  return value.split(path.sep).join("/");
}
