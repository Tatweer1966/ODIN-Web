import type { WorkspaceInfo } from "../core/types.js";

export function workspaceMarkdown(info: WorkspaceInfo): string {
  const lines = ["# JCWS Workspace Report", "", `- Repository: \`${info.repositoryRoot}\``, `- Frontend: \`${info.frontendRoot ?? "not found"}\``, `- Source: \`${info.sourceRoot ?? "not found"}\``, `- Locales: \`${info.localesRoot ?? "not found"}\``, "", "| Check | Status | Message |", "|---|---|---|"];
  for (const check of info.checks) lines.push(`| ${check.name} | ${check.status.toUpperCase()} | ${check.message.replaceAll("|", "\\|")} |`);
  return `${lines.join("\n")}\n`;
}
