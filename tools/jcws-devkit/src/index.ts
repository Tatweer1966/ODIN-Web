import process from "node:process";
import { Command } from "commander";

import { backupCommand } from "./commands/backup.js";
import { cleanCommand } from "./commands/clean.js";
import { configCommand } from "./commands/config.js";
import { doctorCommand } from "./commands/doctor.js";
import { restoreCommand } from "./commands/restore.js";
import { DEVKIT_VERSION, versionCommand } from "./commands/version.js";
import { workspaceCommand } from "./commands/workspace.js";

import type { CommandContext } from "./core/types.js";

const program = new Command();

program
  .name("jcws")
  .description("JCWS Engineering & Governance Toolkit")
  .version(DEVKIT_VERSION)
  .option("--cwd <path>", "Repository root", process.cwd())
  .option("--config <path>", "Configuration file");

function context(): CommandContext {
  const options = program.opts<{
    cwd: string;
    config?: string;
  }>();

  if (options.config) {
    return {
      cwd: options.cwd,
      configPath: options.config,
    };
  }

  return {
    cwd: options.cwd,
  };
}

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
  .description("Run environment and workspace checks")
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
  .description("Detect the ODIN-Web workspace")
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

program
  .command("backup")
  .description("Back up selected repository files")
  .argument("<files...>", "Files relative to repository root")
  .action((files: string[]) => {
    const manifest = backupCommand(context(), files);

    console.log(
      `Backup ${manifest.id}: ${String(manifest.entries.length)} file(s)`,
    );
  });

program
  .command("restore")
  .description("Restore files from a backup manifest")
  .argument("<manifest>", "Path to manifest.json")
  .action((manifestPath: string) => {
    const result = restoreCommand(manifestPath);

    console.log(
      `Restored ${String(result.entries.length)} file(s) from ${result.id}`,
    );
  });

program
  .command("clean")
  .description("Remove old backups according to retention policy")
  .option(
    "--keep <count>",
    "Number of newest backups to keep",
    (value: string) => Number.parseInt(value, 10),
  )
  .action((options: { keep?: number }) => {
    const removed = cleanCommand(context(), options.keep);

    console.log(`Removed ${String(removed.length)} old backup(s)`);
  });

await program.parseAsync(process.argv);