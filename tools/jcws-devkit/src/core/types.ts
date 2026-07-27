export interface CommandContext {
  readonly cwd: string;
  readonly configPath?: string;
}

export interface DoctorCheck {
  readonly name: string;
  readonly status: "pass" | "warn" | "fail";
  readonly message: string;
}

export interface WorkspaceInfo {
  readonly repositoryRoot: string;
  readonly frontendRoot?: string;
  readonly packageJson?: string;
  readonly sourceRoot?: string;
  readonly localesRoot?: string;
  readonly gitRoot?: string;
  readonly checks: readonly DoctorCheck[];
}

export interface BackupManifestEntry {
  readonly source: string;
  readonly destination: string;
  readonly sha256: string;
  readonly size: number;
}

export interface BackupManifest {
  readonly id: string;
  readonly createdAt: string;
  readonly repositoryRoot: string;
  readonly entries: readonly BackupManifestEntry[];
}
