import process from "node:process";
import type { CommandContext, DoctorCheck } from "../core/types.js";
import { loadConfig } from "../config/loader.js";
import { detectWorkspace } from "../workspace/detector.js";

function nodeMajorVersion(): number { return Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10); }

export function doctorCommand(context: CommandContext): DoctorCheck[] {
  const loaded = loadConfig(context.cwd, context.configPath);
  const workspace = detectWorkspace(context);
  return [
    { name: "Node.js", status: nodeMajorVersion() >= 20 ? "pass" : "fail", message: `Detected Node.js ${process.versions.node}; Node.js 20 or later is required.` },
    { name: "Configuration", status: "pass", message: `Loaded configuration for ${loaded.config.projectName} from ${loaded.path}` },
    ...workspace.checks
  ];
}
