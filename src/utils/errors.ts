export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details?: string[];

  constructor(statusCode: number, message: string, details?: string[]) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// 400: input is invalid (bad JSON, missing fields, wrong types)
export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: string[]) {
    super(400, message, details);
  }
}

// 404: product or route does not exist
export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(404, message);
  }
}