import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export class FileSystem {
  exists(target: string): boolean {
    return fs.existsSync(target);
  }

  ensureDirectory(target: string): void {
    fs.mkdirSync(target, { recursive: true });
  }

  readText(target: string): string {
    return fs.readFileSync(target, "utf8");
  }

  writeText(target: string, value: string): void {
    this.ensureDirectory(path.dirname(target));
    fs.writeFileSync(target, value, "utf8");
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
  readJson<T>(target: string): T {
    return JSON.parse(this.readText(target)) as T;
  }

  writeJson(target: string, value: unknown): void {
    this.writeText(target, `${JSON.stringify(value, null, 2)}\n`);
  }

  copy(source: string, destination: string): void {
    this.ensureDirectory(path.dirname(destination));
    fs.copyFileSync(source, destination);
  }

  remove(target: string): void {
    fs.rmSync(target, { recursive: true, force: true });
  }

  listDirectories(target: string): string[] {
    if (!this.exists(target)) {
      return [];
    }

    return fs
      .readdirSync(target, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(target, entry.name));
  }

  stat(target: string): fs.Stats {
    return fs.statSync(target);
  }

  hash(target: string): string {
    return crypto
      .createHash("sha256")
      .update(fs.readFileSync(target))
      .digest("hex");
  }
}