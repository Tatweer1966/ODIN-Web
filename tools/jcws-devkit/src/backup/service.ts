import path from "node:path";
import { loadConfig } from "../config/loader.js";
import type { BackupManifest, BackupManifestEntry, CommandContext } from "../core/types.js";
import { FileSystem } from "../filesystem/file-system.js";

function backupId(date = new Date()): string { return date.toISOString().replaceAll(":", "-").replaceAll(".", "-"); }

export class BackupService {
  constructor(private readonly fs = new FileSystem()) {}

  create(context: CommandContext, files: readonly string[]): BackupManifest {
    const loaded = loadConfig(context.cwd, context.configPath);
    const id = backupId();
    const root = path.resolve(context.cwd);
    const backupRoot = path.join(root, loaded.config.backupsDirectory, id);
    const entries: BackupManifestEntry[] = [];

    for (const input of files) {
      const source = path.resolve(root, input);
      if (!this.fs.exists(source) || !this.fs.stat(source).isFile()) continue;
      const relative = path.relative(root, source);
      const destination = path.join(backupRoot, "files", relative);
      this.fs.copy(source, destination);
      entries.push({ source, destination, sha256: this.fs.hash(source), size: this.fs.stat(source).size });
    }

    const manifest: BackupManifest = { id, createdAt: new Date().toISOString(), repositoryRoot: root, entries };
    this.fs.writeJson(path.join(backupRoot, "manifest.json"), manifest);
    return manifest;
  }

  restore(manifestPath: string): BackupManifest {
    const manifest = this.fs.readJson<BackupManifest>(manifestPath);
    for (const entry of manifest.entries) this.fs.copy(entry.destination, entry.source);
    return manifest;
  }

  clean(context: CommandContext, keep?: number): string[] {
    const loaded = loadConfig(context.cwd, context.configPath);
    const root = path.join(path.resolve(context.cwd), loaded.config.backupsDirectory);
    const retention = keep ?? loaded.config.backupRetention;
    const directories = this.fs.listDirectories(root).sort().reverse();
    const removed = directories.slice(retention);
    for (const directory of removed) this.fs.remove(directory);
    return removed;
  }
}
