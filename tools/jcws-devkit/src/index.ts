import process from "node:process";
import { Command } from "commander";
import { configCommand } from "./commands/config.js";
import { doctorCommand } from "./commands/doctor.js";
import { DEVKIT_VERSION, versionCommand } from "./commands/version.js";

const program = new Command();

program
  .name("jcws")
  .description("JCWS engineering and governance toolkit")
  .version(DEVKIT_VERSION)
  .option("--cwd <path>", "working directory", process.cwd())
  .option("--config <path>", "configuration file path");

program
  .command("version")
  .description("print the DevKit version")
  .action(() => {
    process.stdout.write(`${versionCommand()}\n`);
  });

program
  .command("config")
  .description("print the resolved configuration")
  .action(() => {
    const options = program.opts<{ cwd: string; config?: string }>();
    const context = options.config ? { cwd: options.cwd, configPath: options.config } : { cwd: options.cwd };
    process.stdout.write(`${configCommand(context)}\n`);
  });

program
  .command("doctor")
  .description("run foundation environment checks")
  .action(() => {
    const options = program.opts<{ cwd: string; config?: string }>();
    const context = options.config ? { cwd: options.cwd, configPath: options.config } : { cwd: options.cwd };
    const checks = doctorCommand(context);

    for (const check of checks) {
      process.stdout.write(`[${check.status.toUpperCase()}] ${check.name}: ${check.message}\n`);
    }

    if (checks.some((check) => check.status === "fail")) {
      process.exitCode = 1;
    }
  });

await program.parseAsync(process.argv);
