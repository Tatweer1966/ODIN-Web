import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import type { Command } from "commander";

import { localeValidateCommand } from "../commands/locale-validate.js";
import { localeCatalogCommand } from "../commands/locale-catalog.js";
import { localeClassifyCommand } from "../commands/locale-classify.js";
import { localePlanCommand } from "../commands/locale-plan.js";
import { localeScanCommand } from "../commands/locale-scan.js";

import type { CommandContext } from "../core/types.js";

type ContextFactory = () => CommandContext;

interface LocaleScanOptions {
  source: string;
  tsconfig?: string;
  json: boolean;
}

interface LocalePlanOptions {
  source: string;
  tsconfig?: string;
  namespace: string;
  englishCatalog?: string;
  output?: string;
}

interface LocaleClassifyCliOptions {
  plan: string;
  output: string;
  report: string;
}

interface LocaleCatalogCliOptions {
  plan: string;
  namespace: string;
  output: string;
  report: string;
}

interface LocaleValidateCliOptions {
  catalog: string;
  report: string;
}
export function registerLocaleCommands(
  program: Command,
  context: ContextFactory,
): void {
  const locale = program
    .command("locale")
    .description("Localization utilities");

  locale
    .command("scan")
    .description(
      "Scan repository for hard-coded text",
    )
    .option(
      "--source <path>",
      "Source directory",
      "src",
    )
    .option(
      "--tsconfig <path>",
      "TypeScript config",
    )
    .option(
      "--json",
      "Output JSON",
      false,
    )
    .action((options: LocaleScanOptions) => {
      const result = localeScanCommand(
        context(),
        {
          source: options.source,
          ...(options.tsconfig
            ? { tsconfig: options.tsconfig }
            : {}),
        },
      );

      if (options.json) {
        console.log(
          JSON.stringify(result, null, 2),
        );
        return;
      }

      console.log("");
      console.log("JCWS Localization Scan");
      console.log("--------------------------------");
      console.log(
        `Files scanned      : ${String(result.filesScanned)}`,
      );
      console.log(
        `Strings discovered : ${String(result.findings.length)}`,
      );

      for (const finding of result.findings) {
        console.log(
          `${finding.filePath}:${String(finding.line)}:${String(finding.column)}  ${finding.value}`,
        );
      }

      if (result.findings.length > 0) {
        process.exitCode = 1;
      }
    });

  locale
    .command("plan")
    .description(
      "Generate localization migration plan",
    )
    .option(
      "--source <path>",
      "Source directory",
      "src",
    )
    .option(
      "--tsconfig <path>",
      "TypeScript config",
    )
    .option(
      "--namespace <name>",
      "Namespace",
      "common",
    )
    .option(
      "--english-catalog <path>",
      "Existing en.json",
    )
    .option(
      "--output <path>",
      "Write JSON file",
    )
    .action((options: LocalePlanOptions) => {
      const commandContext = context();

      const plan = localePlanCommand(
        commandContext,
        {
          source: options.source,
          namespace: options.namespace,
          ...(options.tsconfig
            ? { tsconfig: options.tsconfig }
            : {}),
          ...(options.englishCatalog
            ? {
                englishCatalog:
                  options.englishCatalog,
              }
            : {}),
        },
      );

      const json = JSON.stringify(
        plan,
        null,
        2,
      );

      if (options.output) {
        const outputFile = path.resolve(
          commandContext.cwd,
          options.output,
        );

        fs.mkdirSync(
          path.dirname(outputFile),
          {
            recursive: true,
          },
        );

        fs.writeFileSync(
          outputFile,
          `${json}\n`,
          "utf8",
        );

        console.log(
          `Migration plan written to ${outputFile}`,
        );
      } else {
        console.log(json);
      }

      console.log("");
      console.log("Summary");
      console.log("-------");
      console.log(
        `New Keys        : ${String(plan.summary.newKeys)}`,
      );
      console.log(
        `Existing Values : ${String(plan.summary.existingValues)}`,
      );
      console.log(
        `Existing Keys   : ${String(plan.summary.existingKeys)}`,
      );
    });

  locale
    .command("classify")
    .description(
      "Classify localization migration candidates",
    )
    .requiredOption(
      "--plan <path>",
      "Migration plan JSON file",
    )
    .option(
      "--output <path>",
      "Write classified migration plan",
      "reports/localization-classified-plan.json",
    )
    .option(
      "--report <path>",
      "Write Markdown review report",
      "reports/localization-review.md",
    )
    .action(
      (options: LocaleClassifyCliOptions) => {
        const commandContext = context();

        const result = localeClassifyCommand(
          commandContext,
          {
            plan: options.plan,
            output: options.output,
            report: options.report,
          },
        );

        console.log("");
        console.log(
          "Localization Classification",
        );
        console.log(
          "---------------------------",
        );
        console.log(
          `High confidence   : ${String(result.summary.highConfidence)}`,
        );
        console.log(
          `Medium confidence : ${String(result.summary.mediumConfidence)}`,
        );
        console.log(
          `Low confidence    : ${String(result.summary.lowConfidence)}`,
        );
        console.log(
          `Exportable        : ${String(result.summary.exportable)}`,
        );
        console.log(
          `Ignored           : ${String(result.summary.ignored)}`,
        );

        console.log("");
        console.log(
          `Classified plan written to ${path.resolve(commandContext.cwd, options.output)}`,
        );
        console.log(
          `Review report written to ${path.resolve(commandContext.cwd, options.report)}`,
        );
      },
    );

  locale
    .command("catalog")
    .description(
      "Generate a localization catalog from a classified plan",
    )
    .requiredOption(
      "--plan <path>",
      "Classified localization plan JSON file",
    )
    .option(
      "--namespace <name>",
      "Catalog namespace",
      "odin",
    )
    .option(
      "--output <path>",
      "Write English localization catalog",
      "locales/en/odin.json",
    )
    .option(
      "--report <path>",
      "Write catalog validation report",
      "reports/localization-catalog.json",
    )
    .action(
      (options: LocaleCatalogCliOptions) => {
        const commandContext = context();

        const result = localeCatalogCommand(
          commandContext,
          {
            plan: options.plan,
            namespace: options.namespace,
            output: options.output,
            report: options.report,
          },
        );

        console.log("");
        console.log("Localization Catalog");
        console.log("--------------------");
        console.log(
          `Exportable entries : ${String(result.report.exportableEntries)}`,
        );
        console.log(
          `Catalog entries    : ${String(result.report.catalogEntries)}`,
        );
        console.log(
          `Ignored entries    : ${String(result.report.ignoredEntries)}`,
        );
        console.log(
          `Duplicate values   : ${String(result.report.duplicateValues.length)}`,
        );
        console.log(
          `Key conflicts      : ${String(result.report.conflicts.length)}`,
        );
        console.log(
          `Tree collisions    : ${String(result.report.collisions.length)}`,
        );
        console.log(
          `Valid              : ${result.report.valid ? "Yes" : "No"}`,
        );

        console.log("");
        console.log(
          `Catalog written to ${path.resolve(commandContext.cwd, options.output)}`,
        );
        console.log(
          `Report written to ${path.resolve(commandContext.cwd, options.report)}`,
        );

        if (!result.report.valid) {
          process.exitCode = 1;
        }
      },
    );

  locale
    .command("validate")
    .description(
      "Validate a localization catalog before source migration",
    )
    .requiredOption(
      "--catalog <path>",
      "Localization catalog JSON file",
    )
    .option(
      "--report <path>",
      "Write localization validation report",
      "reports/localization-validation.json",
    )
    .action(
      (options: LocaleValidateCliOptions) => {
        const commandContext = context();

        const result = localeValidateCommand(
          commandContext,
          {
            catalog: options.catalog,
            report: options.report,
          },
        );

        console.log("");
        console.log("Localization Validation");
        console.log("-----------------------");
        console.log(
          `Translation entries : ${String(result.report.summary.stringEntries)}`,
        );
        console.log(
          `Catalog objects     : ${String(result.report.summary.objectEntries)}`,
        );
        console.log(
          `Errors              : ${String(result.report.summary.errors)}`,
        );
        console.log(
          `Warnings            : ${String(result.report.summary.warnings)}`,
        );
        console.log(
          `Valid               : ${result.report.valid ? "Yes" : "No"}`,
        );

        console.log("");
        console.log(
          `Report written to ${path.resolve(commandContext.cwd, options.report)}`,
        );

        if (!result.report.valid) {
          process.exitCode = 1;
        }
      },
    );
}


