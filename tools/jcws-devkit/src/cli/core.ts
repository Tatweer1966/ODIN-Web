import process from "node:process";

import type { Command } from "commander";

import { configCommand } from "../commands/config.js";
import { doctorCommand } from "../commands/doctor.js";
import {
  versionCommand,
} from "../commands/version.js";
import { workspaceCommand } from "../commands/workspace.js";

import type { CommandContext } from "../core/types.js";

type ContextFactory = () => CommandContext;

export function registerCoreCommands(
  program: Command,
  context: ContextFactory,
): void {
  program
    .command("version")
    .description("Print the DevKit version")
    .action(() => {
      console.log(versionCommand());
    });

  program
    .command("config")
    .description("Print the resolved configuration")
    .action(() => {
      console.log(configCommand(context()));
    });

  program
    .command("doctor")
    .description("Run environment checks")
    .action(() => {
      const checks = doctorCommand(context());

      for (const check of checks) {
        console.log(
          `[${check.status.toUpperCase()}] ${check.name}: ${check.message}`,
        );
      }

      if (checks.some((check) => check.status === "fail")) {
        process.exitCode = 1;
      }
    });

  program
    .command("workspace")
    .description("Detect workspace")
    .action(() => {
      const info = workspaceCommand(context());

      for (const check of info.checks) {
        console.log(
          `[${check.status.toUpperCase()}] ${check.name}: ${check.message}`,
        );
      }

      if (info.checks.some((check) => check.status === "fail")) {
        process.exitCode = 1;
      }
    });
}
