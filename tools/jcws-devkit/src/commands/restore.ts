import type { BackupManifest } from "../core/types.js";
import { BackupService } from "../backup/service.js";

export function restoreCommand(manifestPath: string): BackupManifest { return new BackupService().restore(manifestPath); }
