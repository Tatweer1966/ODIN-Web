import fs from "node:fs";
import path from "node:path";

import type { CommandContext } from "../core/types.js";
import { detectWorkspace } from "../workspace/detector.js";

export interface LocalizationProjectOverrides {
  readonly source?: string;
  readonly tsconfig?: string;
}

export interface ResolvedLocalizationProjectOptions {
  readonly