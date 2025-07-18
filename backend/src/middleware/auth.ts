import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwt as jwtConfig } from '../config';

// Define request with auth properties
export interface AuthRequest extends Request {
  companyId?: string;
  userId?: string;
  userRole?: string;
  user?: {
    id: string;
    [key: string]: any;
  };
}

// JWT verification middleware
export const checkJwt = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Get the auth header
  const authHeader = req.headers.authorization;
  
  console.log('Auth header:', authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Invalid auth header:', authHeader);
    return res.status(401).json({
      success: false,
      message: 'Authorization header missing or invalid',
    });
  }
  
  // Extract token
  const token = authHeader.split(' ')[1];
  console.log('Token received:', token.substring(0, 10) + '...');
  
  try {
    // Verify token
    const decoded = jwt.verify(token, jwtConfig.secret) as {
      userId: string;
      companyId: string;
      role: string;
      'https://sparrowx.com/roles': string[];
      'https://sparrowx.com/company_id': string;
    };
    
    console.log('Token decoded successfully:', {
      userId: decoded.userId,
      companyId: decoded.companyId,
      role: decoded.role
    });
    
    // Set user info on request
    req.userId = decoded.userId;
    req.companyId = decoded.companyId;
    req.userRole = decoded.role;
    
    next();
    return;
  } catch (error) {
    console.error('Token verification failed:', error);
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
  const originalUrl = req.originalUrl;
  console.log(`[extractCompanyId] Processing request: ${req.method} ${originalUrl}`);

  // First check if companyId exists in route params
  if (req.params.companyId) {
    req.companyId = req.params.companyId;
    console.log(`[extractCompanyId] Found companyId in params: ${req.companyId}`);
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
      console.log(`[extractCompanyId] Extracted companyId from token: ${req.companyId}`);
    } catch (error: any) {
      // Continue even if token verification fails
      // This allows public routes to work without a token
      console.log('[extractCompanyId] Failed to extract companyId from token:', error.message);
    }
  }
  else {
    console.log('[extractCompanyId] No authorization header found');
  }
  
  console.log(`[extractCompanyId] Final companyId: ${req.companyId || 'undefined'}`);
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