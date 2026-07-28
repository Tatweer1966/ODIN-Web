import path from "node:path";

import { AstProject } from "../ast/ast-project.js";
import { HardcodedStringScanner } from "../localization/hardcoded-string-scanner.js";

import type { CommandContext } from "../core/types.js";
import type { LocalizationScanResult } from "../localization/types.js";

export interface LocaleScanOptions {
  source?: string;
  tsconfig?: string;
}

export function localeScanCommand(
  context: CommandContext,
  options: LocaleScanOptions = {},
): LocalizationScanResult {
  const repositoryRoot = path.resolve(context.cwd);

  const astProject = new AstProject({
    repositoryRoot,
    sourceRoot: options.source ?? "src",
    ...(options.tsconfig
      ? { tsConfigPath: options.tsconfig }
      : {}),
  });

  const scanner = new HardcodedStringScanner(astProject);

  return scanner.scan();
}