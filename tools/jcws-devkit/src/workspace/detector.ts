import path from "node:path";
import { loadConfig } from "../config/loader.js";
import type { CommandContext, DoctorCheck, WorkspaceInfo } from "../core/types.js";
import { FileSystem } from "../filesystem/file-system.js";

export function detectWorkspace(context: CommandContext, fs = new FileSystem()): WorkspaceInfo {
  const loaded = loadConfig(context.cwd, context.configPath);
  const repositoryRoot = path.resolve(context.cwd);
  const checks: DoctorCheck[] = [];
  const frontendRoot = loaded.config.frontendCandidates
    .map((candidate) => path.resolve(repositoryRoot, candidate))
    .find((candidate) => fs.exists(path.join(candidate, "package.json")) && fs.exists(path.join(candidate, loaded.config.sourceDirectory)));

  const packageJson = frontendRoot ? path.join(frontendRoot, "package.json") : undefined;
  const sourceRoot = frontendRoot ? path.join(frontendRoot, loaded.config.sourceDirectory) : undefined;
  const localesRoot = frontendRoot ? path.join(frontendRoot, loaded.config.localesDirectory) : undefined;
  const gitRoot = fs.exists(path.join(repositoryRoot, ".git")) ? repositoryRoot : undefined;

  checks.push({ name: "Repository", status: fs.exists(repositoryRoot) ? "pass" : "fail", message: repositoryRoot });
  checks.push({ name: "Frontend", status: frontendRoot ? "pass" : "fail", message: frontendRoot ?? "No frontend candidate contains both package.json and the configured source directory." });
  checks.push({ name: "Source", status: sourceRoot && fs.exists(sourceRoot) ? "pass" : "fail", message: sourceRoot ?? "Source directory unresolved." });
  checks.push({ name: "Locales", status: localesRoot && fs.exists(localesRoot) ? "pass" : "warn", message: localesRoot ?? "Locales directory unresolved." });
  checks.push({ name: "Git", status: gitRoot ? "pass" : "warn", message: gitRoot ?? "No .git directory found at repository root." });

  return { repositoryRoot, ...(frontendRoot ? { frontendRoot } : {}), ...(packageJson ? { packageJson } : {}), ...(sourceRoot ? { sourceRoot } : {}), ...(localesRoot ? { localesRoot } : {}), ...(gitRoot ? { gitRoot } : {}), checks };
}
