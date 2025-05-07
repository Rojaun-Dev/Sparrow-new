import { Response } from 'express';

/**
 * Utility class for generating consistent API responses
 */
export class ApiResponse {
  /**
   * Send a success response
   */
  static success(
    res: Response,
    data: any = null,
    message = 'Success',
    statusCode = 200
  ) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  /**
   * Send an error response
   */
  static error(
    res: Response,
    message = 'An error occurred',
    statusCode = 400,
    errors: any[] = []
  ) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors: errors.length > 0 ? errors : undefined,
    });
  }

  /**
   * Send a not found response
   */
  static notFound(res: Response, message = 'Resource not found') {
    return this.error(res, message, 404);
  }

  /**
   * Send an unauthorized response
   */
  static unauthorized(res: Response, message = 'Unauthorized') {
    return this.error(res, message, 401);
  }

  /**
   * Send a forbidden response
   */
  static forbidden(res: Response, message = 'Forbidden') {
    return this.error(res, message, 403);
  }

  /**
   * Send a validation error response
   */
  static validationError(res: Response, errors: any[] | any) {
    const errorArr = Array.isArray(errors) ? errors : [errors];
    return this.error(res, 'Validation error', 422, errorArr);
  }

  /**
   * Send a bad request response
   */
  static badRequest(res: Response, message = 'Bad Request') {
    return this.error(res, message, 400);
  }

  /**
   * Send a conflict response
   */
  static conflict(res: Response, message = 'Conflict') {
    return this.error(res, message, 409);
  }

  /**
   * Send a created response
   */
  static created(res: Response, data: any = null, message = 'Resource created successfully') {
    return this.success(res, data, message, 201);
  }
} 