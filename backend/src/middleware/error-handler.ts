import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';
import logger from '../utils/logger';
import { server } from '../config';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Convert to AppError if not already
  const appError = err instanceof AppError
    ? err
    : new AppError(err.message || 'Internal server error');
  
  // Default error status and message
  const statusCode = appError.statusCode || 500;
  const message = appError.message || 'Something went wrong';
  
  // Prepare response
  const response: any = {
    success: false,
    message,
    ...(server.isDev && { stack: appError.stack }),
  };
  
  // Include validation errors if available
  if (appError.errors) {
    response.errors = appError.errors;
  }
  
  // Log error for server-side issues
  if (statusCode >= 500) {
    logger.error({
      err: {
        message: err.message,
        stack: err.stack,
      },
      request: {
        method: req.method,
        path: req.path,
      },
    }, 'Server error');
  } else {
    // For client errors, log less verbosely
    logger.info({
      statusCode,
      message,
      path: req.path,
    }, 'Client error');
  }
  
  // Send response
  res.status(statusCode).json(response);
}; 