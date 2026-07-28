export type LocalizationFindingKind =
  | "jsx-text"
  | "string-literal"
  | "template-literal";

export interface LocalizationFinding {
  filePath: string;
  line: number;
  column: number;
  kind: LocalizationFindingKind;
  value: string;
}

export interface LocalizationScanResult {
  repositoryRoot: string;
  sourceRoot: string;
  filesScanned: number;
  findings: LocalizationFinding[];
}