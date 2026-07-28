import path from "node:path";

import { AstProject } from "../ast/ast-project.js";
import { HardcodedStringScanner } from "../localization/hardcoded-string-scanner.js";
import { LocaleCatalogLoader } from "../localization/locale-catalog-loader.js";
import { LocalizationMigrationPlanner } from "../localization/migration/planner.js";

import type { CommandContext } from "../core/types.js";
import type { LocalizationMigrationPlan } from "../localization/migration/types.js";

export interface LocalePlanOptions {
  source?: string;
  tsconfig?: string;
  namespace?: string;
  englishCatalog?: string;
}

export function localePlanCommand(
  context: CommandContext,
  options: LocalePlanOptions = {},
): LocalizationMigrationPlan {
  const repositoryRoot = path.resolve(context.cwd);

  const astProject = new AstProject({
    repositoryRoot,
    sourceRoot: options.source ?? "src",
    ...(options.tsconfig
      ? { tsConfigPath: options.tsconfig }
      : {}),
  });

  const scanner = new HardcodedStringScanner(astProject);
  const scanResult = scanner.scan();

  const catalog = options.englishCatalog
    ? new LocaleCatalogLoader().load(
        repositoryRoot,
        "en",
        options.englishCatalog,
      )
    : undefined;

  const planner = new LocalizationMigrationPlanner();

  return planner.createPlan(scanResult, {
    namespace: options.namespace ?? "common",
    ...(catalog
      ? { existingEnglishCatalog: catalog }
      : {}),
  });
}