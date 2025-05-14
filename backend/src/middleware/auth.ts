import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwt as jwtConfig } from '../config';

// Define request with auth properties
export interface AuthRequest extends Request {
  companyId?: string;
  userId?: string;
  userRole?: string;
}

// JWT verification middleware
export const checkJwt = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Get the auth header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authorization header missing or invalid',
    });
  }
  
  // Extract token
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify token
    const decoded = jwt.verify(token, jwtConfig.secret) as {
      userId: string;
      companyId: string;
      role: string;
      'https://sparrowx.com/roles': string[];
      'https://sparrowx.com/company_id': string;
    };
    
    // Set user info on request
    req.userId = decoded.userId;
    req.companyId = decoded.companyId;
    req.userRole = decoded.role;
    
    next();
    return;
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

// Extract company ID from request parameters or JWT
export const extractCompanyId = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  // First check if companyId exists in route params
  if (req.params.companyId) {
    req.companyId = req.params.companyId;
    return next();
  }
  
  // Otherwise try to extract from JWT if available
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, jwtConfig.secret) as {
        companyId: string;
        'https://sparrowx.com/company_id': string;
      };
      
      req.companyId = decoded.companyId || decoded['https://sparrowx.com/company_id'];
    } catch (error) {
      // Continue even if token verification fails
      // This allows public routes to work without a token
    }
  }
  
  next();
};

// Role-based access control middleware
export const checkRole = (role: string | string[]): (req: AuthRequest, res: Response, next: NextFunction) => Response | void => {
  return (req: AuthRequest, res: Response, next: NextFunction): Response | void => {
    if (!req.userRole) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Missing token',
      });
    }
    
    // Check if user has any of the required roles
    const requiredRoles = Array.isArray(role) ? role : [role];
    const hasRequiredRole = requiredRoles.includes(req.userRole);
    
    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden - Insufficient permissions',
      });
    }
    
    next();
  };
}; 