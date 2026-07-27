import pino, { type Logger } from "pino";
import type { DevkitConfig } from "../config/schema.js";

export function createLogger(config: DevkitConfig): Logger {
  return pino({
    level: config.logLevel,
    base: { application: "jcws-devkit" }
  });
}
