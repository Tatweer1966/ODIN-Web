import fs from "node:fs";
import path from "node:path";

import { LocalizationCatalogBuilder } from "../localization/catalog/catalog-builder.js";

import type { CommandContext } from "../core/types.js";
import type { ClassifiedLocalizationPlan } from "../localization/classification/types.js";
import type { LocalizationCatalogBuildResult } from "../localization/catalog/types.js";

export interface LocaleCatalogOptions {
  plan: string;
  namespace: string;
  output: string;
  report: string;
}

function readClassifiedPlan(
  repositoryRoot: string,
  planPath: string,
): ClassifiedLocalizationPlan {
  const absolutePath = path.resolve(
    repositoryRoot,
    planPath,
  );

  if (!fs.existsSync(absolutePath)) {
    throw new Error(
      `Classified localization plan not found: ${absolutePath}`,
    );
  }

  return JSON.parse(
    fs.readFileSync(absolutePath, "utf8"),
  ) as ClassifiedLocalizationPlan;
}

function writeJsonFile(
  filePath: string,
  value: unknown,
): void {
  fs.mkdirSync(path.dirname(filePath), {
    recursive: true,
  });

  fs.writeFileSync(
    filePath,
    `${JSON.stringify(value, null, 2)}\n`,
    "utf8",
  );
}

export function localeCatalogCommand(
  context: CommandContext,
  options: LocaleCatalogOptions,
): LocalizationCatalogBuildResult {
  const repositoryRoot = path.resolve(context.cwd);

  const plan = readClassifiedPlan(
    repositoryRoot,
    options.plan,
  );

  const builder = new LocalizationCatalogBuilder();

  const result = builder.build(
    plan,
    options.namespace,
  );

  const outputPath = path.resolve(
    repositoryRoot,
    options.output,
  );

  const reportPath = path.resolve(
    repositoryRoot,
    options.report,
  );

  writeJsonFile(outputPath, result.catalog);
  writeJsonFile(reportPath, result.report);

  return result;
}
