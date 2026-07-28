import fs from "node:fs";
import path from "node:path";

import { LocalizationClassifier } from "../localization/classification/classifier.js";
import { createClassificationMarkdownReport } from "../localization/classification/markdown-report.js";

import type { CommandContext } from "../core/types.js";
import type { ClassifiedLocalizationPlan } from "../localization/classification/types.js";
import type { LocalizationMigrationPlan } from "../localization/migration/types.js";

export interface LocaleClassifyOptions {
  plan: string;
  output?: string;
  report?: string;
}

function readMigrationPlan(
  repositoryRoot: string,
  planPath: string,
): LocalizationMigrationPlan {
  const absolutePath = path.resolve(
    repositoryRoot,
    planPath,
  );

  if (!fs.existsSync(absolutePath)) {
    throw new Error(
      `Migration plan not found: ${absolutePath}`,
    );
  }

  const content = fs.readFileSync(
    absolutePath,
    "utf8",
  );

  return JSON.parse(content) as LocalizationMigrationPlan;
}

function writeTextFile(
  filePath: string,
  content: string,
): void {
  fs.mkdirSync(path.dirname(filePath), {
    recursive: true,
  });

  fs.writeFileSync(filePath, content, "utf8");
}

export function localeClassifyCommand(
  context: CommandContext,
  options: LocaleClassifyOptions,
): ClassifiedLocalizationPlan {
  const repositoryRoot = path.resolve(context.cwd);

  const migrationPlan = readMigrationPlan(
    repositoryRoot,
    options.plan,
  );

  const classifier = new LocalizationClassifier();
  const classifiedPlan =
    classifier.classify(migrationPlan);

  if (options.output) {
    const outputPath = path.resolve(
      repositoryRoot,
      options.output,
    );

    writeTextFile(
      outputPath,
      `${JSON.stringify(classifiedPlan, null, 2)}\n`,
    );
  }

  if (options.report) {
    const reportPath = path.resolve(
      repositoryRoot,
      options.report,
    );

    writeTextFile(
      reportPath,
      createClassificationMarkdownReport(
        classifiedPlan,
      ),
    );
  }

  return classifiedPlan;
}
