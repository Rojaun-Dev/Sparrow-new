import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

/**
 * Validates if the authenticated user has the required role
 * @param allowedRoles Array of roles that are allowed to access the route
 */
export const validateRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized - No user found', 401);
      }

      const hasRole = allowedRoles.includes(req.user.role);
      
      if (!hasRole) {
        throw new AppError('Forbidden - Insufficient permissions', 403);
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  };
}; 