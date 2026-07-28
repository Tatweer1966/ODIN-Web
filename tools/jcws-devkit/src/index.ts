import process from "node:process";

import { buildProgram } from "./cli/program.js";

const program = buildProgram();

await program.parseAsync(process.argv);
