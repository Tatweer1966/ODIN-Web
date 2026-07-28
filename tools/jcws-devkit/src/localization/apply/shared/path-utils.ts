import fs from "node:fs";
import path from "node:path";

import { WorkspaceValidationError } from "./errors.js";

function normalizeSeparators(value: string): string {
  return value.replace(/[\\/]+/gu, path.sep);
}

export function isPathInsideWorkspace(
  workspaceRoot: string,
  candidatePath: string,
): boolean {
  const relative = path.relative(workspaceRoot, candidatePath);
  return (
    relative === "" ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  );
}

export function resolveWorkspacePath(
  workspaceRootInput: string,
  filePath: string,
): string {
  const workspaceRoot = path.resolve(workspaceRootInput);
  const candidatePath = path.resolve(
    workspaceRoot,
    normalizeSeparators(filePath),
  );

  if (!isPathInsideWorkspace(workspaceRoot, candidatePath)) {
    throw new WorkspaceValidationError(
      `Path resolves outside workspace: ${filePath}`,
    );
  }

  return candidatePath;
}

export function toWorkspaceRelativePath(
  workspaceRootInput: string,
  absolutePathInput: string,
): string {
  const workspaceRoot = path.resolve(workspaceRootInput);
  const absolutePath = path.resolve(absolutePathInput);

  if (!isPathInsideWorkspace(workspaceRoot, absolutePath)) {
    throw new WorkspaceValidationError(
      `Path is outside workspace: ${absolutePath}`,
    );
  }

  return path.relative(workspaceRoot, absolutePath);
}

export function resolveCanonicalWorkspaceRoot(
  workspaceRootInput: string,
): string {
  const workspaceRoot = path.resolve(workspaceRootInput);
  return fs.realpathSync.native(workspaceRoot);
}
