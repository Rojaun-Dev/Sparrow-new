import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/response';
import { UsersService, createUserSchema } from '../services/users-service';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { jwt as jwtConfig } from '../config';
import { EmailService } from '../services/email-service';
import crypto from 'crypto';

interface AuthRequest extends Request {
  companyId?: string;
  userId?: string;
}

export class AuthController {
  private usersService: UsersService;
  private emailService: EmailService;

  constructor() {
    this.usersService = new UsersService();
    this.emailService = new EmailService();
  }

  /**
   * Handle user login
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, rememberMe } = req.body;

      if (!email || !password) {
        return ApiResponse.badRequest(res, 'Email and password are required');
      }

      // Find user by email (this will automatically filter by company if a company ID is provided)
      const user = await this.usersService.getUserByEmailWithPassword(email);
      
      if (!user) {
        return ApiResponse.unauthorized(res, 'Invalid credentials');
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.passwordHash || '');
      if (!passwordMatch) {
        return ApiResponse.unauthorized(res, 'Invalid credentials');
      }

      // Check if user is active
      if (!user.isActive) {
        return ApiResponse.unauthorized(res, 'Account is disabled');
      }

      // Generate tokens with rememberMe flag
      const { accessToken, refreshToken } = this.generateTokens(user, !!rememberMe);

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
      const { accessToken, refreshToken } = this.generateTokens(user, false);

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
        const tokens = this.generateTokens(user, false);

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
          trn: user.trn,
          role: user.role,
          companyId: user.companyId,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          notificationPreferences: user.notificationPreferences
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
          trn: user.trn,
          role: user.role,
          companyId: user.companyId,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          notificationPreferences: user.notificationPreferences
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
      const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash || '');
      if (!passwordMatch) {
        return ApiResponse.badRequest(res, 'Current password is incorrect');
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 10);

      // Update password
      await this.usersService.updateUser(userId, { passwordHash }, companyId);

      // Send confirmation email
      try {
        await this.emailService.sendPasswordChangedEmail(user.email, user.firstName);
      } catch (emailError) {
        console.error('Failed to send password changed email:', emailError);
        // Continue processing - this is not critical
      }

      return ApiResponse.success(res, null, 'Password changed successfully');
    } catch (error) {
      next(error);
      return undefined;
    }
  }

  /**
   * Request a password reset (forgot password)
   */
  async requestPasswordReset(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      
      if (!email) {
        return ApiResponse.badRequest(res, 'Email is required');
      }

      // Find user by email
      const user = await this.usersService.getUserByEmailForPasswordReset(email);
      
      // If no user found, still return success to avoid email enumeration
      if (!user) {
        return ApiResponse.success(res, null, 'If your email exists in our system, you will receive a password reset link');
      }

      // Generate a reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

      // Update user with reset token
      await this.usersService.updateUser(
        user.id,
        {
          resetToken,
          resetTokenExpires
        },
        user.companyId
      );

      // Get frontend URL from environment or config
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const resetUrl = `${frontendUrl}/reset-password`;

      // Send reset email
      await this.emailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        user.firstName,
        resetUrl
      );

      return ApiResponse.success(res, null, 'If your email exists in our system, you will receive a password reset link');
    } catch (error) {
      next(error);
      return undefined;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return ApiResponse.badRequest(res, 'Token and new password are required');
      }

      // Find user by reset token
      const user = await this.usersService.getUserByResetToken(token);
      
      if (!user) {
        return ApiResponse.badRequest(res, 'Invalid or expired token');
      }

      // Check if token is expired
      if (!user.resetTokenExpires || new Date(user.resetTokenExpires) < new Date()) {
        return ApiResponse.badRequest(res, 'Reset token has expired');
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 10);

      // Update user password and clear reset token
      await this.usersService.updateUser(
        user.id,
        {
          passwordHash,
          resetToken: null,
          resetTokenExpires: null
        },
        user.companyId
      );

      // Send confirmation email
      try {
        await this.emailService.sendPasswordChangedEmail(user.email, user.firstName);
      } catch (emailError) {
        console.error('Failed to send password changed email:', emailError);
        // Continue processing - this is not critical
      }

      return ApiResponse.success(res, null, 'Password has been reset successfully');
    } catch (error) {
      next(error);
      return undefined;
    }
  }

  /**
   * Get user notification preferences
   */
  async getNotificationPreferences(req: AuthRequest, res: Response, next: NextFunction) {
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
        preferences: user.notificationPreferences || {
          email: true,
          sms: false,
          push: false,
          packageUpdates: { email: true, sms: false, push: false },
          billingUpdates: { email: true, sms: false, push: false },
          marketingUpdates: { email: false, sms: false, push: false }
        }
      });
    } catch (error) {
      next(error);
      return undefined;
    }
  }

  /**
   * Update user notification preferences
   */
  async updateNotificationPreferences(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      const companyId = req.companyId;
      const { preferences } = req.body;

      if (!userId || !companyId) {
        return ApiResponse.unauthorized(res, 'Authentication required');
      }

      if (!preferences) {
        return ApiResponse.badRequest(res, 'Notification preferences are required');
      }

      // Update user with notification preferences
      const user = await this.usersService.updateUser(userId, { 
        notificationPreferences: preferences 
      }, companyId);

      if (!user) {
        return ApiResponse.notFound(res, 'User not found');
      }

      return ApiResponse.success(res, {
        preferences: user.notificationPreferences
      }, 'Notification preferences updated successfully');
    } catch (error) {
      next(error);
      return undefined;
    }
  }

  /**
   * Generate JWT access and refresh tokens
   */
  private generateTokens(user: any, rememberMe = false) {
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

    // Set expiration times based on rememberMe flag
    const accessTokenExpiry = rememberMe ? '7d' : jwtConfig.expiresIn; // 7 days if rememberMe, otherwise default (1h)
    const refreshTokenExpiry = rememberMe ? '30d' : jwtConfig.refreshExpiresIn; // 30 days if rememberMe, otherwise default (7d)

    // Generate tokens
    const accessToken = jwt.sign(
      accessPayload,
      jwtConfig.secret,
      { expiresIn: accessTokenExpiry } as SignOptions
    );

    const refreshToken = jwt.sign(
      refreshPayload,
      jwtConfig.refreshSecret,
      { expiresIn: refreshTokenExpiry } as SignOptions
    );

    return { accessToken, refreshToken };
  }
} 