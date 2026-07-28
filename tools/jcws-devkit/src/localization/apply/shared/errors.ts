export class LocalizationMigrationError extends Error {
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "LocalizationMigrationError";
  }
}

export class WorkspaceValidationError extends LocalizationMigrationError {
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "WorkspaceValidationError";
  }
}

export class SourceNotFoundError extends LocalizationMigrationError {
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "SourceNotFoundError";
  }
}

export class BackupCreationError extends LocalizationMigrationError {
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "BackupCreationError";
  }
}

export class ChecksumMismatchError extends LocalizationMigrationError {
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ChecksumMismatchError";
  }
}
