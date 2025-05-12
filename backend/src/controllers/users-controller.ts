import { Request, Response, NextFunction } from 'express';
import { UsersService, createUserSchema, updateUserSchema } from '../services/users-service';
import { ApiResponse } from '../utils/response';
import bcrypt from 'bcrypt';

interface AuthRequest extends Request {
  companyId?: string;
  userId?: string;
  userRole?: string;
}

export class UsersController {
  private service: UsersService;

  constructor() {
    this.service = new UsersService();
  }

  /**
   * Get all users for a company
   */
  getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      const users = await this.service.getAllUsers(companyId);
      return ApiResponse.success(res, users);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Get a user by ID
   */
  getUserById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const companyId = req.companyId as string;
      
      // If a regular user is trying to access another user's profile, block it
      if (req.userRole === 'customer' && id !== req.userId) {
        return ApiResponse.forbidden(res, 'You can only access your own profile');
      }
      
      const user = await this.service.getUserById(id, companyId);
      return ApiResponse.success(res, user);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Create a new user
   */
  createUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      const { password, ...userData } = req.body;
      
      // Validate request body
      try {
        createUserSchema.parse(userData);
      } catch (error) {
        return ApiResponse.validationError(res, error);
      }

      // Hash password if provided
      let passwordHash;
      if (password) {
        passwordHash = await bcrypt.hash(password, 10);
      }
      
      const user = await this.service.createUser({
        ...userData,
        ...(passwordHash && { passwordHash })
      }, companyId);
      
      return ApiResponse.success(res, user, 'User created successfully', 201);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Update a user
   */
  updateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const companyId = req.companyId as string;
      
      // If a regular user is trying to update another user's profile, block it
      if (req.userRole === 'customer' && id !== req.userId) {
        return ApiResponse.forbidden(res, 'You can only update your own profile');
      }

      // If it's a password update, handle separately
      if (req.body.password) {
        const { password, ...userData } = req.body;
        const passwordHash = await bcrypt.hash(password, 10);
        
        // Validate request body
        try {
          updateUserSchema.parse(userData);
        } catch (error) {
          return ApiResponse.validationError(res, error);
        }
        
        const user = await this.service.updateUser(id, {
          ...userData,
          passwordHash
        }, companyId);
        
        return ApiResponse.success(res, user, 'User updated successfully');
      }
      
      // For regular updates
      try {
        updateUserSchema.parse(req.body);
      } catch (error) {
        return ApiResponse.validationError(res, error);
      }

      const user = await this.service.updateUser(id, req.body, companyId);
      return ApiResponse.success(res, user, 'User updated successfully');
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Deactivate a user (soft delete)
   */
  deactivateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const companyId = req.companyId as string;
      
      // Prevent self-deactivation
      if (id === req.userId) {
        return ApiResponse.badRequest(res, 'You cannot deactivate your own account');
      }
      
      await this.service.deactivateUser(id, companyId);
      return ApiResponse.success(res, null, 'User deactivated successfully');
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Reactivate a user
   */
  reactivateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const companyId = req.companyId as string;
      await this.service.reactivateUser(id, companyId);
      return ApiResponse.success(res, null, 'User reactivated successfully');
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Get users by role
   */
  getUsersByRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { role } = req.params;
      const companyId = req.companyId as string;
      const users = await this.service.getUsersByRole(role, companyId);
      return ApiResponse.success(res, users);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * SUPERADMIN: Get all users across all companies
   */
  getAllUsersAcrossCompanies = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Optional filter params
      const { role, companyId } = req.query;
      
      const users = await this.service.getAllUsersAcrossCompanies({
        role: role as string | undefined,
        companyId: companyId as string | undefined
      });
      
      return ApiResponse.success(res, users);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * SUPERADMIN: Create a new admin user for any company
   */
  createAdminUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { companyId, password, ...userData } = req.body;
      
      if (!companyId) {
        return ApiResponse.badRequest(res, 'Company ID is required');
      }
      
      // Force role to be admin_l1 or admin_l2
      if (!userData.role || !['admin_l1', 'admin_l2'].includes(userData.role)) {
        return ApiResponse.badRequest(res, 'Role must be either admin_l1 or admin_l2');
      }
      
      // Validate request body
      try {
        createUserSchema.parse(userData);
      } catch (error) {
        return ApiResponse.validationError(res, error);
      }

      // Hash password if provided
      let passwordHash;
      if (password) {
        passwordHash = await bcrypt.hash(password, 10);
      } else {
        return ApiResponse.badRequest(res, 'Password is required');
      }
      
      const user = await this.service.createUser({
        ...userData,
        passwordHash
      }, companyId);
      
      return ApiResponse.success(res, user, 'Admin user created successfully', 201);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * SUPERADMIN: Get system-wide statistics
   */
  getSystemStatistics = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.service.getSystemStatistics();
      return ApiResponse.success(res, stats);
    } catch (error) {
      next(error);
      return undefined;
    }
  };
} 