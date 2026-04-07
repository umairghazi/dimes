export class RepositoryError extends Error {
  constructor(
    public readonly message: string,
    public readonly operation: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "RepositoryError";
    Error.captureStackTrace(this, this.constructor);
  }
}
