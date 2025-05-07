import { auth, AuthResult } from 'express-oauth2-jwt-bearer';
import { Request, Response, NextFunction } from 'express';
import { auth0 } from '../config';

// Auth0 JWT verification middleware
export const checkJwt = auth({
  audience: auth0.audience,
  issuerBaseURL: `https://${auth0.domain}/`,
  tokenSigningAlg: 'RS256',
});

// Define request with auth0 properties
export interface AuthRequest extends Request {
  auth?: AuthResult;
  companyId?: string;
}

// Extract company ID from JWT and set in request
export const extractCompanyId = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  if (!req.auth?.payload) {
    return next();
  }

  const companyId = req.auth.payload['https://sparrowx.com/company_id'] as string | undefined;
  
  if (companyId) {
    req.companyId = companyId;
  }
  
  next();
};

// Role-based access control middleware
export const checkRole = (role: string | string[]): (req: AuthRequest, res: Response, next: NextFunction) => Response | void => {
  return (req: AuthRequest, res: Response, next: NextFunction): Response | void => {
    if (!req.auth?.payload) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Missing token',
      });
    }

    const roles = req.auth.payload['https://sparrowx.com/roles'] as string[] || [];
    
    // Check if user has any of the required roles
    const requiredRoles = Array.isArray(role) ? role : [role];
    const hasRequiredRole = requiredRoles.some(r => roles.includes(r));
    
    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden - Insufficient permissions',
      });
    }
    
    next();
  };
}; 