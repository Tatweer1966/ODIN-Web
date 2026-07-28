import process from "node:process";

import { Command } from "commander";

import { registerBackupCommands } from "./backup.js";
import { createCommandContext } from "./context.js";
import { registerCoreCommands } from "./core.js";
import { registerLocaleCommands } from "./locale.js";

import {
  DEVKIT_VERSION,
} from "../commands/version.js";

export function buildProgram(): Command {
  const program = new Command();

  program
    .name("jcws")
    .description(
      "JCWS Engineering & Governance Toolkit",
    )
    .version(DEVKIT_VERSION)
    .option(
      "--cwd <path>",
      "Repository root",
      process.cwd(),
    )
    .option(
      "--config <path>",
      "Configuration file",
    );

  const context = () =>
    createCommandContext(program);

  registerCoreCommands(program, context);
  registerBackupCommands(program, context);
  registerLocaleCommands(program, context);

  return program;
}
