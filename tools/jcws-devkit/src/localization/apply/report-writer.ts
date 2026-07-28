import fs from "node:fs";
import path from "node:path";

import type { LocalizationApplyReport } from "./types.js";

export function writeLocalizationApplyReport(
  report: LocalizationApplyReport,
): void {
  fs.mkdirSync(path.dirname(report.reportPath), {
    recursive: true,
  });

  fs.writeFileSync(
    report.reportPath,
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8",
  );
}
