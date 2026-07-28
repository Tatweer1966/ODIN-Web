function Get-RelativePathCompat {
    param(
        [Parameter(Mandatory = $true)]
        [string] $BasePath,

        [Parameter(Mandatory = $true)]
        [string] $TargetPath
    )

    $baseFull = [System.IO.Path]::GetFullPath($BasePath)
    $targetFull = [System.IO.Path]::GetFullPath($TargetPath)

    if (-not $baseFull.EndsWith([System.IO.Path]::DirectorySeparatorChar)) {
        $baseFull += [System.IO.Path]::DirectorySeparatorChar
    }

    $baseUri = New-Object System.Uri($baseFull)
    $targetUri = New-Object System.Uri($targetFull)

    $relativeUri = $baseUri.MakeRelativeUri($targetUri)
    $relativePath = [System.Uri]::UnescapeDataString(
        $relativeUri.ToString()
    )

    return $relativePath.Replace(
        [System.IO.Path]::AltDirectorySeparatorChar,
        [System.IO.Path]::DirectorySeparatorChar
    )
}
param(
    [string] $DevkitRoot = (Get-Location).Path,
    [switch] $SkipChecks
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Write-Step {
    param([string] $Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Write-FileUtf8 {
    param(
        [Parameter(Mandatory = $true)][string] $Path,
        [Parameter(Mandatory = $true)][string] $Content
    )

    $directory = Split-Path -Parent $Path
    if ($directory) {
        New-Item -ItemType Directory -Path $directory -Force | Out-Null
    }

    [System.IO.File]::WriteAllText(
        $Path,
        $Content,
        (New-Object System.Text.UTF8Encoding($false))
    )
}

function Backup-Path {
    param(
        [Parameter(Mandatory = $true)][string] $Path,
        [Parameter(Mandatory = $true)][string] $BackupRoot
    )

    if (-not (Test-Path $Path)) {
        return
    }

    $relative = Get-RelativePathCompat -BasePath $DevkitRoot -TargetPath $Path
    $target = Join-Path $BackupRoot $relative
    $targetDirectory = Split-Path -Parent $target
    New-Item -ItemType Directory -Path $targetDirectory -Force | Out-Null
    Copy-Item -Path $Path -Destination $target -Force
}

$DevkitRoot = (Resolve-Path $DevkitRoot).Path
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $DevkitRoot "reports\locale-apply-installer-backup-$timestamp"

Write-Step "Validating jcws-devkit root"

$requiredFiles = @(
    "package.json",
    "src\cli\locale.ts",
    "src\localization\migration\types.ts",
    "src\localization\classification\types.ts"
)

foreach ($relativePath in $requiredFiles) {
    $fullPath = Join-Path $DevkitRoot $relativePath
    if (-not (Test-Path $fullPath)) {
        throw "Required file not found: $fullPath"
    }
}

Write-Step "Creating installer backup"
New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null

$pathsToBackup = @(
    "src\localization\apply",
    "src\commands\locale-apply.ts",
    "src\commands\locale-rollback.ts",
    "src\cli\locale.ts",
    "tests\localization-apply.test.ts",
    "tests\localization-rollback.test.ts"
)

foreach ($relativePath in $pathsToBackup) {
    Backup-Path -Path (Join-Path $DevkitRoot $relativePath) -BackupRoot $backupRoot
}

Write-Step "Writing localization apply infrastructure"

$typesTs = @'
import type { ClassifiedLocalizationEntry } from "../classification/types.js";

export type ApplyConfidence = "high" | "medium" | "low";

export type ApplyStatus =
  | "applied"
  | "skipped"
  | "failed"
  | "planned";

export type ApplySkipReason =
  | "not-exportable"
  | "below-confidence-threshold"
  | "file-not-found"
  | "source-mismatch"
  | "ambiguous-location"
  | "unsupported-context"
  | "already-translated"
  | "dry-run";

export interface LocaleApplyOptions {
  planPath: string;
  sourceRoot?: string;
  tsconfigPath?: string;
  namespace?: string;
  backupDirectory?: string;
  reportPath?: string;
  minimumConfidence?: ApplyConfidence;
  dryRun?: boolean;
  overwrite?: boolean;
}

export interface LocaleRollbackOptions {
  manifestPath: string;
  dryRun?: boolean;
}

export interface ApplyEntryResult {
  id: string;
  key: string;
  filePath: string;
  line: number;
  column: number;
  sourceValue: string;
  status: ApplyStatus;
  reason?: ApplySkipReason | string;
  message?: string;
}

export interface ApplyFileResult {
  filePath: string;
  absolutePath: string;
  changed: boolean;
  backupPath?: string;
  checksumBefore?: string;
  checksumAfter?: string;
  replacements: number;
  skipped: number;
  failed: number;
  entries: ApplyEntryResult[];
}

export interface ApplyManifestFile {
  filePath: string;
  absolutePath: string;
  backupPath: string;
  checksumBefore: string;
  checksumAfter: string;
}

export interface LocaleApplyManifest {
  version: 1;
  repositoryRoot: string;
  planPath: string;
  namespace: string;
  generatedAt: string;
  dryRun: boolean;
  backupDirectory: string;
  files: ApplyManifestFile[];
}

export interface LocaleApplySummary {
  filesConsidered: number;
  filesChanged: number;
  entriesConsidered: number;
  applied: number;
  planned: number;
  skipped: number;
  failed: number;
}

export interface LocaleApplyReport {
  version: 1;
  repositoryRoot: string;
  planPath: string;
  sourceRoot: string;
  namespace: string;
  generatedAt: string;
  durationMs: number;
  dryRun: boolean;
  minimumConfidence: ApplyConfidence;
  backupDirectory: string;
  manifestPath?: string;
  summary: LocaleApplySummary;
  files: ApplyFileResult[];
}

export interface PreparedApplyEntry {
  entry: ClassifiedLocalizationEntry;
  absolutePath: string;
}
'@

$optionsTs = @'
import path from "node:path";

import type { CommandContext } from "../../core/types.js";
import type {
  ApplyConfidence,
  LocaleApplyOptions,
} from "./types.js";

const confidenceOrder: Record<ApplyConfidence, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

export interface ResolvedLocaleApplyOptions {
  planPath: string;
  sourceRoot: string;
  tsconfigPath?: string;
  namespace: string;
  backupDirectory: string;
  reportPath: string;
  minimumConfidence: ApplyConfidence;
  dryRun: boolean;
  overwrite: boolean;
}

export function resolveLocaleApplyOptions(
  context: CommandContext,
  options: LocaleApplyOptions,
): ResolvedLocaleApplyOptions {
  const minimumConfidence = options.minimumConfidence ?? "medium";

  if (!(minimumConfidence in confidenceOrder)) {
    throw new Error(
      `Unsupported minimum confidence: ${minimumConfidence}`,
    );
  }

  return {
    planPath: path.resolve(context.cwd, options.planPath),
    sourceRoot: path.resolve(
      context.cwd,
      options.sourceRoot ?? "src",
    ),
    ...(options.tsconfigPath
      ? {
          tsconfigPath: path.resolve(
            context.cwd,
            options.tsconfigPath,
          ),
        }
      : {}),
    namespace: options.namespace ?? "common",
    backupDirectory: path.resolve(
      context.cwd,
      options.backupDirectory ??
        "reports/localization-backups",
    ),
    reportPath: path.resolve(
      context.cwd,
      options.reportPath ??
        "reports/localization-apply.json",
    ),
    minimumConfidence,
    dryRun: options.dryRun ?? false,
    overwrite: options.overwrite ?? false,
  };
}

export function meetsConfidenceThreshold(
  confidence: ApplyConfidence,
  threshold: ApplyConfidence,
): boolean {
  return confidenceOrder[confidence] >= confidenceOrder[threshold];
}
'@

$planLoaderTs = @'
import fs from "node:fs";

import { z } from "zod";

import type { ClassifiedLocalizationPlan } from "../classification/types.js";

const confidenceSchema = z.enum(["high", "medium", "low"]);

const classificationSchema = z.object({
  category: z.string(),
  confidence: confidenceSchema,
  export: z.boolean(),
  score: z.number(),
  reasons: z.array(z.string()),
});

const entrySchema = z.object({
  id: z.string(),
  key: z.string(),
  sourceValue: z.string(),
  filePath: z.string(),
  line: z.number().int().positive(),
  column: z.number().int().positive(),
  kind: z.enum([
    "jsx-text",
    "string-literal",
    "template-literal",
  ]),
  status: z.enum([
    "new",
    "existing-value",
    "existing-key",
  ]),
  existingKey: z.string().optional(),
  classification: classificationSchema,
});

const classifiedPlanSchema = z.object({
  repositoryRoot: z.string(),
  sourceRoot: z.string(),
  generatedAt: z.string(),
  filesScanned: z.number().int().nonnegative(),
  findingsCount: z.number().int().nonnegative(),
  entries: z.array(entrySchema),
  summary: z.record(z.string(), z.unknown()),
});

export function loadClassifiedLocalizationPlan(
  planPath: string,
): ClassifiedLocalizationPlan {
  if (!fs.existsSync(planPath)) {
    throw new Error(`Classified plan not found: ${planPath}`);
  }

  const raw = fs.readFileSync(planPath, "utf8");
  const parsed: unknown = JSON.parse(raw);
  const result = classifiedPlanSchema.safeParse(parsed);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Invalid classified localization plan:\n${details}`,
    );
  }

  return result.data as ClassifiedLocalizationPlan;
}
'@

$sourceGroupingTs = @'
import path from "node:path";

import type { ClassifiedLocalizationEntry } from "../classification/types.js";
import type { PreparedApplyEntry } from "./types.js";

export function groupApplyEntriesByFile(
  repositoryRoot: string,
  entries: ClassifiedLocalizationEntry[],
): Map<string, PreparedApplyEntry[]> {
  const groups = new Map<string, PreparedApplyEntry[]>();

  for (const entry of entries) {
    const absolutePath = path.resolve(
      repositoryRoot,
      entry.filePath,
    );
    const prepared: PreparedApplyEntry = {
      entry,
      absolutePath,
    };
    const existing = groups.get(entry.filePath) ?? [];
    existing.push(prepared);
    groups.set(entry.filePath, existing);
  }

  for (const group of groups.values()) {
    group.sort((left, right) => {
      if (left.entry.line !== right.entry.line) {
        return right.entry.line - left.entry.line;
      }

      return right.entry.column - left.entry.column;
    });
  }

  return groups;
}
'@

$backupManagerTs = @'
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export interface BackupResult {
  backupPath: string;
  checksum: string;
}

export function calculateFileChecksum(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(content).digest("hex");
}

export function createFileBackup(
  repositoryRoot: string,
  sourceFilePath: string,
  backupRoot: string,
): BackupResult {
  const relativePath = path.relative(
    repositoryRoot,
    sourceFilePath,
  );
  const backupPath = path.resolve(backupRoot, relativePath);

  fs.mkdirSync(path.dirname(backupPath), {
    recursive: true,
  });
  fs.copyFileSync(sourceFilePath, backupPath);

  return {
    backupPath,
    checksum: calculateFileChecksum(sourceFilePath),
  };
}

export function restoreBackup(
  backupPath: string,
  destinationPath: string,
): void {
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }

  fs.mkdirSync(path.dirname(destinationPath), {
    recursive: true,
  });
  fs.copyFileSync(backupPath, destinationPath);
}
'@

$reportWriterTs = @'
import fs from "node:fs";
import path from "node:path";

import type {
  LocaleApplyManifest,
  LocaleApplyReport,
} from "./types.js";

function writeJsonFile(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), {
    recursive: true,
  });
  fs.writeFileSync(
    filePath,
    `${JSON.stringify(value, null, 2)}\n`,
    "utf8",
  );
}

export function writeLocaleApplyReport(
  filePath: string,
  report: LocaleApplyReport,
): void {
  writeJsonFile(filePath, report);
}

export function writeLocaleApplyManifest(
  filePath: string,
  manifest: LocaleApplyManifest,
): void {
  writeJsonFile(filePath, manifest);
}

export function readLocaleApplyManifest(
  filePath: string,
): LocaleApplyManifest {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Apply manifest not found: ${filePath}`);
  }

  return JSON.parse(
    fs.readFileSync(filePath, "utf8"),
  ) as LocaleApplyManifest;
}
'@

$sourceLocatorTs = @'
import fs from "node:fs";

import type { ClassifiedLocalizationEntry } from "../classification/types.js";

export interface SourceLocationMatch {
  matched: boolean;
  reason?: "file-not-found" | "source-mismatch";
  lineText?: string;
}

export function verifySourceLocation(
  absolutePath: string,
  entry: ClassifiedLocalizationEntry,
): SourceLocationMatch {
  if (!fs.existsSync(absolutePath)) {
    return {
      matched: false,
      reason: "file-not-found",
    };
  }

  const content = fs.readFileSync(absolutePath, "utf8");
  const lines = content.split(/\r?\n/u);
  const lineText = lines[entry.line - 1];

  if (lineText === undefined) {
    return {
      matched: false,
      reason: "source-mismatch",
    };
  }

  if (!lineText.includes(entry.sourceValue)) {
    return {
      matched: false,
      reason: "source-mismatch",
      lineText,
    };
  }

  return {
    matched: true,
    lineText,
  };
}
'@

$applyEngineTs = @'
import fs from "node:fs";
import path from "node:path";

import type { CommandContext } from "../../core/types.js";
import type { ClassifiedLocalizationEntry } from "../classification/types.js";
import {
  calculateFileChecksum,
  createFileBackup,
} from "./backup-manager.js";
import {
  meetsConfidenceThreshold,
  resolveLocaleApplyOptions,
} from "./options.js";
import { loadClassifiedLocalizationPlan } from "./plan-loader.js";
import {
  writeLocaleApplyManifest,
  writeLocaleApplyReport,
} from "./report-writer.js";
import { groupApplyEntriesByFile } from "./source-grouping.js";
import { verifySourceLocation } from "./source-locator.js";
import type {
  ApplyEntryResult,
  ApplyFileResult,
  LocaleApplyManifest,
  LocaleApplyOptions,
  LocaleApplyReport,
} from "./types.js";

export interface LocaleApplyEngineResult {
  report: LocaleApplyReport;
  manifest?: LocaleApplyManifest;
}

export function runLocaleApply(
  context: CommandContext,
  options: LocaleApplyOptions,
): LocaleApplyEngineResult {
  const startedAt = Date.now();
  const resolved = resolveLocaleApplyOptions(context, options);
  const plan = loadClassifiedLocalizationPlan(resolved.planPath);

  const eligibleEntries = plan.entries.filter(
    (entry) =>
      entry.classification.export &&
      meetsConfidenceThreshold(
        entry.classification.confidence,
        resolved.minimumConfidence,
      ),
  );

  const groups = groupApplyEntriesByFile(
    plan.repositoryRoot,
    eligibleEntries,
  );
  const fileResults: ApplyFileResult[] = [];
  const manifestFiles: LocaleApplyManifest["files"] = [];

  for (const [filePath, preparedEntries] of groups) {
    const absolutePath = path.resolve(plan.repositoryRoot, filePath);
    const entryResults: ApplyEntryResult[] = [];
    let skipped = 0;
    let failed = 0;

    for (const prepared of preparedEntries) {
      const verification = verifySourceLocation(
        prepared.absolutePath,
        prepared.entry,
      );

      if (!verification.matched) {
        skipped += 1;
        entryResults.push({
          id: prepared.entry.id,
          key: prepared.entry.key,
          filePath: prepared.entry.filePath,
          line: prepared.entry.line,
          column: prepared.entry.column,
          sourceValue: prepared.entry.sourceValue,
          status: "skipped",
          reason: verification.reason ?? "source-mismatch",
          ...(verification.lineText
            ? { message: verification.lineText }
            : {}),
        });
        continue;
      }

      entryResults.push({
        id: prepared.entry.id,
        key: prepared.entry.key,
        filePath: prepared.entry.filePath,
        line: prepared.entry.line,
        column: prepared.entry.column,
        sourceValue: prepared.entry.sourceValue,
        status: "planned",
        reason: resolved.dryRun ? "dry-run" : "unsupported-context",
        message:
          "AST rewrite engine will be installed by Part 2.",
      });
    }

    if (!fs.existsSync(absolutePath)) {
      fileResults.push({
        filePath,
        absolutePath,
        changed: false,
        replacements: 0,
        skipped: entryResults.length,
        failed,
        entries: entryResults,
      });
      continue;
    }

    const checksumBefore = calculateFileChecksum(absolutePath);
    let backupPath: string | undefined;

    if (!resolved.dryRun && resolved.overwrite) {
      const backup = createFileBackup(
        plan.repositoryRoot,
        absolutePath,
        resolved.backupDirectory,
      );
      backupPath = backup.backupPath;
    }

    const fileResult: ApplyFileResult = {
      filePath,
      absolutePath,
      changed: false,
      ...(backupPath ? { backupPath } : {}),
      checksumBefore,
      checksumAfter: checksumBefore,
      replacements: 0,
      skipped,
      failed,
      entries: entryResults,
    };

    fileResults.push(fileResult);

    if (backupPath) {
      manifestFiles.push({
        filePath,
        absolutePath,
        backupPath,
        checksumBefore,
        checksumAfter: checksumBefore,
      });
    }
  }

  const allEntryResults = fileResults.flatMap(
    (file) => file.entries,
  );
  const report: LocaleApplyReport = {
    version: 1,
    repositoryRoot: plan.repositoryRoot,
    planPath: resolved.planPath,
    sourceRoot: resolved.sourceRoot,
    namespace: resolved.namespace,
    generatedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    dryRun: resolved.dryRun,
    minimumConfidence: resolved.minimumConfidence,
    backupDirectory: resolved.backupDirectory,
    summary: {
      filesConsidered: fileResults.length,
      filesChanged: 0,
      entriesConsidered: allEntryResults.length,
      applied: allEntryResults.filter(
        (entry) => entry.status === "applied",
      ).length,
      planned: allEntryResults.filter(
        (entry) => entry.status === "planned",
      ).length,
      skipped: allEntryResults.filter(
        (entry) => entry.status === "skipped",
      ).length,
      failed: allEntryResults.filter(
        (entry) => entry.status === "failed",
      ).length,
    },
    files: fileResults,
  };

  let manifest: LocaleApplyManifest | undefined;

  if (!resolved.dryRun && manifestFiles.length > 0) {
    const manifestPath = path.resolve(
      resolved.backupDirectory,
      "manifest.json",
    );

    manifest = {
      version: 1,
      repositoryRoot: plan.repositoryRoot,
      planPath: resolved.planPath,
      namespace: resolved.namespace,
      generatedAt: new Date().toISOString(),
      dryRun: false,
      backupDirectory: resolved.backupDirectory,
      files: manifestFiles,
    };

    report.manifestPath = manifestPath;
    writeLocaleApplyManifest(manifestPath, manifest);
  }

  writeLocaleApplyReport(resolved.reportPath, report);

  return {
    report,
    ...(manifest ? { manifest } : {}),
  };
}
'@

$rollbackEngineTs = @'
import path from "node:path";

import type { CommandContext } from "../../core/types.js";
import {
  calculateFileChecksum,
  restoreBackup,
} from "./backup-manager.js";
import { readLocaleApplyManifest } from "./report-writer.js";
import type { LocaleRollbackOptions } from "./types.js";

export interface LocaleRollbackResult {
  restored: number;
  skipped: number;
  files: Array<{
    filePath: string;
    status: "restored" | "skipped";
    message?: string;
  }>;
}

export function runLocaleRollback(
  context: CommandContext,
  options: LocaleRollbackOptions,
): LocaleRollbackResult {
  const manifestPath = path.resolve(
    context.cwd,
    options.manifestPath,
  );
  const manifest = readLocaleApplyManifest(manifestPath);
  const files: LocaleRollbackResult["files"] = [];

  for (const file of manifest.files) {
    if (options.dryRun) {
      files.push({
        filePath: file.filePath,
        status: "skipped",
        message: "Dry run: backup was not restored.",
      });
      continue;
    }

    const currentChecksum = calculateFileChecksum(
      file.absolutePath,
    );

    if (currentChecksum !== file.checksumAfter) {
      files.push({
        filePath: file.filePath,
        status: "skipped",
        message:
          "Current file checksum differs from apply manifest.",
      });
      continue;
    }

    restoreBackup(file.backupPath, file.absolutePath);
    files.push({
      filePath: file.filePath,
      status: "restored",
    });
  }

  return {
    restored: files.filter((file) => file.status === "restored")
      .length,
    skipped: files.filter((file) => file.status === "skipped")
      .length,
    files,
  };
}
'@

$indexTs = @'
export { runLocaleApply } from "./apply-engine.js";
export { runLocaleRollback } from "./rollback-engine.js";
export type {
  LocaleApplyOptions,
  LocaleApplyReport,
  LocaleApplyManifest,
  LocaleRollbackOptions,
} from "./types.js";
'@

Write-FileUtf8 -Path (Join-Path $DevkitRoot "src\localization\apply\types.ts") -Content $typesTs
Write-FileUtf8 -Path (Join-Path $DevkitRoot "src\localization\apply\options.ts") -Content $optionsTs
Write-FileUtf8 -Path (Join-Path $DevkitRoot "src\localization\apply\plan-loader.ts") -Content $planLoaderTs
Write-FileUtf8 -Path (Join-Path $DevkitRoot "src\localization\apply\source-grouping.ts") -Content $sourceGroupingTs
Write-FileUtf8 -Path (Join-Path $DevkitRoot "src\localization\apply\backup-manager.ts") -Content $backupManagerTs
Write-FileUtf8 -Path (Join-Path $DevkitRoot "src\localization\apply\report-writer.ts") -Content $reportWriterTs
Write-FileUtf8 -Path (Join-Path $DevkitRoot "src\localization\apply\source-locator.ts") -Content $sourceLocatorTs
Write-FileUtf8 -Path (Join-Path $DevkitRoot "src\localization\apply\apply-engine.ts") -Content $applyEngineTs
Write-FileUtf8 -Path (Join-Path $DevkitRoot "src\localization\apply\rollback-engine.ts") -Content $rollbackEngineTs
Write-FileUtf8 -Path (Join-Path $DevkitRoot "src\localization\apply\index.ts") -Content $indexTs

Write-Step "Writing Phase 1 smoke tests"

$testTs = @'
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  calculateFileChecksum,
  createFileBackup,
  restoreBackup,
} from "../src/localization/apply/backup-manager.js";
import { meetsConfidenceThreshold } from "../src/localization/apply/options.js";

function createTempDirectory(): string {
  return fs.mkdtempSync(
    path.join(os.tmpdir(), "jcws-locale-apply-"),
  );
}

describe("locale apply infrastructure", () => {
  it("orders confidence thresholds correctly", () => {
    expect(meetsConfidenceThreshold("high", "medium")).toBe(true);
    expect(meetsConfidenceThreshold("medium", "medium")).toBe(true);
    expect(meetsConfidenceThreshold("low", "medium")).toBe(false);
  });

  it("creates and restores file backups", () => {
    const root = createTempDirectory();
    const source = path.join(root, "src", "sample.ts");
    const backupRoot = path.join(root, "backups");

    fs.mkdirSync(path.dirname(source), { recursive: true });
    fs.writeFileSync(source, "before\n", "utf8");

    const result = createFileBackup(root, source, backupRoot);
    expect(fs.existsSync(result.backupPath)).toBe(true);
    expect(result.checksum).toBe(calculateFileChecksum(source));

    fs.writeFileSync(source, "after\n", "utf8");
    restoreBackup(result.backupPath, source);

    expect(fs.readFileSync(source, "utf8")).toBe("before\n");
  });
});
'@

Write-FileUtf8 -Path (Join-Path $DevkitRoot "tests\localization-apply-infrastructure.test.ts") -Content $testTs

Write-Step "Formatting generated files"
Push-Location $DevkitRoot
try {
    & npm exec prettier -- --write `
        "src/localization/apply/**/*.ts" `
        "tests/localization-apply-infrastructure.test.ts"

    if ($LASTEXITCODE -ne 0) {
        throw "Prettier failed with exit code $LASTEXITCODE"
    }

    if (-not $SkipChecks) {
        Write-Step "Running npm run check"
        & npm run check

        if ($LASTEXITCODE -ne 0) {
            throw "npm run check failed with exit code $LASTEXITCODE"
        }
    }
}
finally {
    Pop-Location
}

Write-Step "Part 1 completed"
Write-Host "Backup: $backupRoot"
Write-Host "Generated: src\localization\apply\*"
Write-Host "Generated: tests\localization-apply-infrastructure.test.ts"
Write-Host ""
Write-Host "This phase installs infrastructure only."
Write-Host "No source rewriting is enabled until Part 2 installs the AST rewriter."

