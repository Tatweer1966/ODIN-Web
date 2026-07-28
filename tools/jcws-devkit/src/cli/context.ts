import type { Command } from "commander";

import type { CommandContext } from "../core/types.js";

interface RootCommandOptions {
  cwd: string;
  config?: string;
}

export function createCommandContext(
  program: Command,
): CommandContext {
  const options = program.opts<RootCommandOptions>();

  return options.config
    ? {
        cwd: options.cwd,
        configPath: options.config,
      }
    : {
        cwd: options.cwd,
      };
}
