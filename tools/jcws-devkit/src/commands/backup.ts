import type { BackupManifest, CommandContext } from "../core/types.js";
import { BackupService } from "../backup/service.js";

export function backupCommand(context: CommandContext, files: readonly string[]): BackupManifest {
  return new BackupService().create(context, files);
}
