export class AppError extends Error {
  statusCode: number;
  details?: string[];

  constructor(statusCode: number, message: string, details?: string[]) {
    super(message); 
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

// 400: the client sent bad input (invalid JSON, missing fields, wrong types)
export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: string[]) {
    super(400, message, details);
    this.name = "ValidationError";
  }
}

// 404: does not exist
export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(404, message);
    this.name = "NotFoundError";
  }
}