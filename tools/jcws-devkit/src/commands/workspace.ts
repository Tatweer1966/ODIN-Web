import path from "node:path";
import { loadConfig } from "../config/loader.js";
import type { CommandContext, WorkspaceInfo } from "../core/types.js";
import { writeJsonReport, writeMarkdownReport } from "../reports/writer.js";
import { detectWorkspace } from "../workspace/detector.js";
import { workspaceMarkdown } from "../workspace/formatter.js";

export function workspaceCommand(context: CommandContext): WorkspaceInfo {
  const info = detectWorkspace(context);
  const loaded = loadConfig(context.cwd, context.configPath);
  const reports = path.resolve(context.cwd, loaded.config.reportsDirectory);
  writeJsonReport(reports, "workspace.json", info);
  writeMarkdownReport(reports, "workspace.md", workspaceMarkdown(info));
  return info;
}
