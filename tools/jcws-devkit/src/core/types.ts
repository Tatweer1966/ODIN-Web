export interface CommandContext {
  readonly cwd: string;
  readonly configPath?: string;
}

export interface DoctorCheck {
  readonly name: string;
  readonly status: "pass" | "warn" | "fail";
  readonly message: string;
}
