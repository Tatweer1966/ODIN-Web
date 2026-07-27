import { z } from "zod";

export const logLevelSchema = z.enum(["trace", "debug", "info", "warn", "error", "fatal"]);

export const devkitConfigSchema = z.object({
  projectName: z.string().min(1).default("ODIN-Web"),
  logLevel: logLevelSchema.default("info"),
  reportsDirectory: z.string().min(1).default("reports")
});

export type DevkitConfig = z.infer<typeof devkitConfigSchema>;
