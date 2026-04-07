export class HttpRepositoryError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly operation: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "HttpRepositoryError";
    Error.captureStackTrace(this, this.constructor);
  }
}
