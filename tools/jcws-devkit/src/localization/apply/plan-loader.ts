import fs from "node:fs";

import { z } from "zod";

import type { ClassifiedLocalizationPlan } from "../classification/types.js";
import type { LocalizationApplyDiagnostic } from "./types.js";

const findingKindSchema = z.enum([
  "jsx-text",
  "string-literal",
  "template-literal",
]);

const statusSchema = z.enum([
  "new",
  "existing-value",
  "existing-key",
]);

const confidenceSchema = z.enum([
  "high",
  "medium",
  "low",
]);

const categorySchema = z.enum([
  "ui-text",
  "button-label",
  "form-label",
  "page-title",
  "message",
  "http-header",
  "http-method",
  "mime-type",
  "url",
  "route",
  "css-class",
  "color",
  "identifier",
  "file-path",
  "technical",
  "unknown",
]);

const classifiedEntrySchema = z.object({
  id: z.string().min(1),
  key: z.string().min(1),
  sourceValue: z.string(),
  filePath: z.string().min(1),
  line: z.number().int().positive(),
  column: z.number().int().positive(),
  kind: findingKindSchema,
  status: statusSchema,
  existingKey: z.string().min(1).optional(),
  classification: z.object({
    category: categorySchema,
    confidence: confidenceSchema,
    export: z.boolean(),
    score: z.number(),
    reasons: z.array(z.string()),
  }),
});

export const classifiedLocalizationPlanSchema = z.object({
  repositoryRoot: z.string().min(1),
  sourceRoot: z.string().min(1),
  generatedAt: z.string().min(1),
  filesScanned: z.number().int().nonnegative(),
  findingsCount: z.number().int().nonnegative(),
  entries: z.array(classifiedEntrySchema),
  summary: z.object({
    newKeys: z.number().int().nonnegative(),
    existingValues: z.number().int().nonnegative(),
    existingKeys: z.number().int().nonnegative(),
    highConfidence: z.number().int().nonnegative(),
    mediumConfidence: z.number().int().nonnegative(),
    lowConfidence: z.number().int().nonnegative(),
    exportable: z.number().int().nonnegative(),
    ignored: z.number().int().nonnegative(),
    categories: z.record(z.string(), z.number().int().nonnegative()),
  }),
});

export class LocalizationApplyPlanError extends Error {
  public constructor(
    message: string,
    public readonly diagnostic: LocalizationApplyDiagnostic,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "LocalizationApplyPlanError";
  }
}

function createPlanError(
  diagnostic: LocalizationApplyDiagnostic,
  cause?: unknown,
): LocalizationApplyPlanError {
  return new LocalizationApplyPlanError(
    diagnostic.message,
    diagnostic,
    cause === undefined ? undefined : { cause },
  );
}

export function loadClassifiedLocalizationPlan(
  planPath: string,
): ClassifiedLocalizationPlan {
  if (!fs.existsSync(planPath)) {
    throw createPlanError({
      code: "PLAN_FILE_NOT_FOUND",
      message: `Classified localization plan not found: ${planPath}`,
      filePath: planPath,
    });
  }

  let contents: string;

  try {
    contents = fs.readFileSync(planPath, "utf8");
  } catch (caught) {
    throw createPlanError(
      {
        code: "PLAN_FILE_UNREADABLE",
        message: `Unable to read classified localization plan: ${planPath}`,
        filePath: planPath,
      },
      caught,
    );
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(contents) as unknown;
  } catch (caught) {
    throw createPlanError(
      {
        code: "PLAN_JSON_INVALID",
        message: `Classified localization plan is not valid JSON: ${planPath}`,
        filePath: planPath,
      },
      caught,
    );
  }

  const validation =
    classifiedLocalizationPlanSchema.safeParse(parsed);

  if (!validation.success) {
    throw createPlanError({
      code: "PLAN_SCHEMA_INVALID",
      message: `Classified localization plan does not match the required schema: ${validation.error.message}`,
      filePath: planPath,
    });
  }

  return validation.data as ClassifiedLocalizationPlan;
}
