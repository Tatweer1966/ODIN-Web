import { loadConfig } from "../config/loader.js";
import type { CommandContext } from "../core/types.js";

export function configCommand(context: CommandContext): string {
  const loaded = loadConfig(context.cwd, context.configPath);
  return JSON.stringify({ path: loaded.path, config: loaded.config }, null, 2);
}
