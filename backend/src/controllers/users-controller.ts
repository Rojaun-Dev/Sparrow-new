import { Request, Response, NextFunction } from 'express';
import { UsersService, createUserSchema, updateUserSchema } from '../services/users-service';
import { ApiResponse } from '../utils/response';

interface AuthRequest extends Request {
  companyId?: string;
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
    }
  };

  /**
   * Get a user by ID
   */
  getUserById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const companyId = req.companyId as string;
      const user = await this.service.getUserById(id, companyId);
      return ApiResponse.success(res, user);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create a new user
   */
  createUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      
      // Validate request body
      try {
        createUserSchema.parse(req.body);
      } catch (error) {
        return ApiResponse.validationError(res, error);
      }

      const user = await this.service.createUser(req.body, companyId);
      return ApiResponse.success(res, user, 'User created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update a user
   */
  updateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const companyId = req.companyId as string;

      // Validate request body
      try {
        updateUserSchema.parse(req.body);
      } catch (error) {
        return ApiResponse.validationError(res, error);
      }

      const user = await this.service.updateUser(id, req.body, companyId);
      return ApiResponse.success(res, user, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Deactivate a user (soft delete)
   */
  deactivateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const companyId = req.companyId as string;
      await this.service.deactivateUser(id, companyId);
      return ApiResponse.success(res, null, 'User deactivated successfully');
    } catch (error) {
      next(error);
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
    }
  };
} 