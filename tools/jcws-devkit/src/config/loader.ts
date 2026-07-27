import fs from "node:fs";
import path from "node:path";
import { devkitConfigSchema, type DevkitConfig } from "./schema.js";

const DEFAULT_FILE = "jcws-devkit.config.json";

export interface LoadedConfig {
  readonly config: DevkitConfig;
  readonly path: string;
}

export function loadConfig(cwd: string, explicitPath?: string): LoadedConfig {
  const configPath = path.resolve(cwd, explicitPath ?? DEFAULT_FILE);

  if (!fs.existsSync(configPath)) {
    return {
      config: devkitConfigSchema.parse({}),
      path: configPath
    };
  }

  const parsed: unknown = JSON.parse(fs.readFileSync(configPath, "utf8"));
  return {
    config: devkitConfigSchema.parse(parsed),
    path: configPath
  };
}
