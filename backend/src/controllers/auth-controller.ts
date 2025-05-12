import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/response';
import { UsersService, createUserSchema } from '../services/users-service';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { jwt as jwtConfig } from '../config';

interface AuthRequest extends Request {
  companyId?: string;
  userId?: string;
}

export class AuthController {
  private usersService: UsersService;

  constructor() {
    this.usersService = new UsersService();
  }

  /**
   * Handle user login
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return ApiResponse.badRequest(res, 'Email and password are required');
      }

      // Find user by email (this will automatically filter by company if a company ID is provided)
      const user = await this.usersService.getUserByEmailWithPassword(email);
      
      if (!user) {
        return ApiResponse.unauthorized(res, 'Invalid credentials');
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.passwordHash);
      if (!passwordMatch) {
        return ApiResponse.unauthorized(res, 'Invalid credentials');
      }

      // Check if user is active
      if (!user.isActive) {
        return ApiResponse.unauthorized(res, 'Account is disabled');
      }

      // Generate tokens
      const { accessToken, refreshToken } = this.generateTokens(user);

      return ApiResponse.success(res, {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          companyId: user.companyId,
        },
        accessToken,
        refreshToken
      });
    } catch (error) {
      next(error);
      return undefined;
    }
  }

  /**
   * Handle user registration/signup
   */
  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const { companyId } = req.params;
      const { password, ...userData } = req.body;

      if (!password) {
        return ApiResponse.badRequest(res, 'Password is required');
      }

      // Validate user data
      try {
        createUserSchema.parse(userData);
      } catch (error) {
        return ApiResponse.validationError(res, error);
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user with company isolation
      const user = await this.usersService.createUser({
        ...userData,
        passwordHash,
        role: 'customer', // Force role to be 'customer' for signup
      }, companyId);

      if (!user) {
        return ApiResponse.serverError(res, 'Failed to create user');
      }

      // Generate tokens
      const { accessToken, refreshToken } = this.generateTokens(user);

      return ApiResponse.success(
        res, 
        { 
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            companyId: user.companyId
          },
          accessToken,
          refreshToken
        }, 
        'User created successfully', 
        201
      );
    } catch (error) {
      next(error);
      return undefined;
    }
  }

  /**
   * Refresh JWT token
   */
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return ApiResponse.badRequest(res, 'Refresh token is required');
      }

      // Verify refresh token
      try {
        const decoded = jwt.verify(refreshToken, jwtConfig.refreshSecret) as {
          userId: string;
          companyId: string;
          role: string;
        };

        // Get user details
        const user = await this.usersService.getUserById(decoded.userId, decoded.companyId);

        // Generate new tokens
        const tokens = this.generateTokens(user);

        return ApiResponse.success(res, tokens);
      } catch (error) {
        return ApiResponse.unauthorized(res, 'Invalid refresh token');
      }
    } catch (error) {
      next(error);
      return undefined;
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      const companyId = req.companyId;

      if (!userId || !companyId) {
        return ApiResponse.unauthorized(res, 'Authentication required');
      }

      const user = await this.usersService.getUserById(userId, companyId);

      if (!user) {
        return ApiResponse.notFound(res, 'User not found');
      }

      return ApiResponse.success(res, {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          address: user.address,
          role: user.role,
          companyId: user.companyId,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }
      });
    } catch (error) {
      next(error);
      return undefined;
    }
  }

  /**
   * Update current user profile
   */
  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      const companyId = req.companyId;

      if (!userId || !companyId) {
        return ApiResponse.unauthorized(res, 'Authentication required');
      }

      // Update user with current user's ID
      const user = await this.usersService.updateUser(userId, req.body, companyId);

      if (!user) {
        return ApiResponse.notFound(res, 'User not found');
      }

      return ApiResponse.success(res, {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          address: user.address,
          role: user.role,
          companyId: user.companyId,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }
      }, 'Profile updated successfully');
    } catch (error) {
      next(error);
      return undefined;
    }
  }

  /**
   * Change password
   */
  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      const companyId = req.companyId;
      const { currentPassword, newPassword } = req.body;

      if (!userId || !companyId) {
        return ApiResponse.unauthorized(res, 'Authentication required');
      }

      if (!currentPassword || !newPassword) {
        return ApiResponse.badRequest(res, 'Current password and new password are required');
      }

      // Get user with password
      const user = await this.usersService.getUserByIdWithPassword(userId, companyId);

      // Verify current password
      const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!passwordMatch) {
        return ApiResponse.badRequest(res, 'Current password is incorrect');
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 10);

      // Update password
      await this.usersService.updateUser(userId, { passwordHash }, companyId);

      return ApiResponse.success(res, null, 'Password changed successfully');
    } catch (error) {
      next(error);
      return undefined;
    }
  }

  /**
   * Generate JWT access and refresh tokens
   */
  private generateTokens(user: any) {
    // Access token payload
    const accessPayload = {
      userId: user.id,
      companyId: user.companyId,
      role: user.role,
      'https://sparrowx.com/roles': [user.role],
      'https://sparrowx.com/company_id': user.companyId
    };

    // Refresh token payload - minimal information
    const refreshPayload = {
      userId: user.id,
      companyId: user.companyId,
      role: user.role
    };

    // Generate tokens
    const accessToken = jwt.sign(
      accessPayload,
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    const refreshToken = jwt.sign(
      refreshPayload,
      jwtConfig.refreshSecret,
      { expiresIn: jwtConfig.refreshExpiresIn }
    );

    return { accessToken, refreshToken };
  }
} 