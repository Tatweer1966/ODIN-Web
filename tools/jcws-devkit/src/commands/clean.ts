import type { CommandContext } from "../core/types.js";
import { BackupService } from "../backup/service.js";

export function cleanCommand(context: CommandContext, keep?: number): string[] { return new BackupService().clean(context, keep); }
