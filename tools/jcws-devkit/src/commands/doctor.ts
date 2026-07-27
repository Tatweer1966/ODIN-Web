import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import type { CommandContext, DoctorCheck } from "../core/types.js";
import { loadConfig } from "../config/loader.js";

function nodeMajorVersion(): number {
  return Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10);
}

export function doctorCommand(context: CommandContext): DoctorCheck[] {
  const checks: DoctorCheck[] = [];
  const loaded = loadConfig(context.cwd, context.configPath);

  checks.push({
    name: "Node.js",
    status: nodeMajorVersion() >= 20 ? "pass" : "fail",
    message: `Detected Node.js ${process.versions.node}; Node.js 20 or later is required.`
  });

  checks.push({
    name: "Working directory",
    status: fs.existsSync(context.cwd) ? "pass" : "fail",
    message: context.cwd
  });

  const packagePath = path.join(context.cwd, "package.json");
  checks.push({
    name: "Package manifest",
    status: fs.existsSync(packagePath) ? "pass" : "warn",
    message: fs.existsSync(packagePath) ? packagePath : "No package.json found in the working directory."
  });

  checks.push({
    name: "Configuration",
    status: "pass",
    message: `Loaded configuration for ${loaded.config.projectName} from ${loaded.path}`
  });

  return checks;
}
