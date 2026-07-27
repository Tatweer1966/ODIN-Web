import { z } from "zod";

export const logLevelSchema = z.enum(["trace", "debug", "info", "warn", "error", "fatal"]);

export const devkitConfigSchema = z.object({
  projectName: z.string().min(1).default("ODIN-Web"),
  logLevel: logLevelSchema.default("info"),
  reportsDirectory: z.string().min(1).default("reports"),
  backupsDirectory: z.string().min(1).default(".jcws-backups"),
  frontendCandidates: z
    .array(z.string().min(1))
    .min(1)
    .default(["frontend", "apps/frontend", "client", "packages/web", "."]),
  sourceDirectory: z.string().min(1).default("src"),
  localesDirectory: z.string().min(1).default("src/locales"),
  backupRetention: z.number().int().min(1).max(365).default(30)
});

export type DevkitConfig = z.infer<typeof devkitConfigSchema>;
