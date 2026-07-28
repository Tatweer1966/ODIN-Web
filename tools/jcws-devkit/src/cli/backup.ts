import type { Command } from "commander";

import { backupCommand } from "../commands/backup.js";
import { cleanCommand } from "../commands/clean.js";
import { restoreCommand } from "../commands/restore.js";

import type { CommandContext } from "../core/types.js";

type ContextFactory = () => CommandContext;

interface CleanOptions {
  keep?: number;
}

export function registerBackupCommands(
  program: Command,
  context: ContextFactory,
): void {
  program
    .command("backup")
    .description("Create backup")
    .argument("<files...>")
    .action((files: string[]) => {
      const manifest = backupCommand(context(), files);

      console.log(
        `Backup ${manifest.id}: ${String(manifest.entries.length)} file(s)`,
      );
    });

  program
    .command("restore")
    .description("Restore backup")
    .argument("<manifest>")
    .action((manifest: string) => {
      const result = restoreCommand(manifest);

      console.log(
        `Restored ${String(result.entries.length)} file(s) from ${result.id}`,
      );
    });

  program
    .command("clean")
    .description("Clean old backups")
    .option(
      "--keep <count>",
      "Number of backups to keep",
      (value: string) => Number.parseInt(value, 10),
    )
    .action((options: CleanOptions) => {
      const removed = cleanCommand(
        context(),
        options.keep,
      );

      console.log(
        `Removed ${String(removed.length)} old backup(s)`,
      );
    });
}
