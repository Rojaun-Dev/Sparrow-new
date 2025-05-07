/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  errors?: any[];

  /**
   * Create a new AppError
   * @param message Error message
   * @param statusCode HTTP status code (default: 500)
   * @param errors Array of validation errors (optional)
   */
  constructor(message: string, statusCode = 500, errors?: any[]) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Indicates this is an expected error that can be handled gracefully
    this.errors = errors;

    // Capture stack trace (excludes the constructor call from the stack trace)
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create a 404 Not Found error
   */
  static notFound(message = 'Resource not found') {
    return new AppError(message, 404);
  }

  /**
   * Create a 400 Bad Request error
   */
  static badRequest(message = 'Bad request', errors?: any[]) {
    return new AppError(message, 400, errors);
  }

  /**
   * Create a 401 Unauthorized error
   */
  static unauthorized(message = 'Unauthorized') {
    return new AppError(message, 401);
  }

  /**
   * Create a 403 Forbidden error
   */
  static forbidden(message = 'Forbidden') {
    return new AppError(message, 403);
  }

  /**
   * Create a 422 Unprocessable Entity (validation) error
   */
  static validation(message = 'Validation error', errors?: any[]) {
    return new AppError(message, 422, errors);
  }

  /**
   * Create a 409 Conflict error
   */
  static conflict(message = 'Resource conflict', errors?: any[]) {
    return new AppError(message, 409, errors);
  }
} 