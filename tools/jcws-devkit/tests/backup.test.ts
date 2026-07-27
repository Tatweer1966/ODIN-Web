import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { BackupService } from "../src/backup/service.js";

const created: string[] = [];
afterEach(() => { for (const item of created.splice(0)) fs.rmSync(item, { recursive: true, force: true }); });

describe("BackupService", () => {
  it("creates and restores a verified file backup", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "jcws-backup-")); created.push(root);
    fs.writeFileSync(path.join(root, "jcws-devkit.config.json"), "{}");
    fs.writeFileSync(path.join(root, "sample.txt"), "original");
    const service = new BackupService();
    const manifest = service.create({ cwd: root }, ["sample.txt"]);
    fs.writeFileSync(path.join(root, "sample.txt"), "changed");
    service.restore(path.join(root, ".jcws-backups", manifest.id, "manifest.json"));
    expect(fs.readFileSync(path.join(root, "sample.txt"), "utf8")).toBe("original");
    expect(manifest.entries[0]?.sha256).toHaveLength(64);
  });
});
