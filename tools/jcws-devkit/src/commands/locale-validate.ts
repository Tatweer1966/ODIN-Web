import fs from "node:fs";
import path from "node:path";

import { LocalizationCatalogValidator } from "../localization/validation/validator.js";

import type { CommandContext } from "../core/types.js";
import type { LocalizationValidationResult } from "../localization/validation/types.js";

export interface LocaleValidateOptions {
  catalog: string;
  report: string;
}

function readJsonFile(
  filePath: string,
): unknown {
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Localization catalog not found: ${filePath}`,
    );
  }

  const contents = fs.readFileSync(
    filePath,
    "utf8",
  );

  try {
    return JSON.parse(contents) as unknown;
  }
  catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    throw new Error(
      `Failed to parse localization catalog ${filePath}: ${message}`,
    );
  }
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

export function localeValidateCommand(
  context: CommandContext,
  options: LocaleValidateOptions,
): LocalizationValidationResult {
  const repositoryRoot = path.resolve(context.cwd);

  const catalogPath = path.resolve(
    repositoryRoot,
    options.catalog,
  );

  const reportPath = path.resolve(
    repositoryRoot,
    options.report,
  );

  const catalog = readJsonFile(catalogPath);

  const validator =
    new LocalizationCatalogValidator();

  const result = validator.validate(
    catalog,
    catalogPath,
  );

  writeJsonFile(reportPath, result.report);

  return result;
}
