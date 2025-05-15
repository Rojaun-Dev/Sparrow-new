import { z } from 'zod';
import { UsersRepository } from '../repositories/users-repository';
import { AppError } from '../utils/app-error';
import { and, eq, sql } from 'drizzle-orm';
import { users } from '../db/schema/users';

// Validation schema for user creation
export const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  phone: z.string().optional(),
  address: z.string().optional(),
  trn: z.string().optional(),
  pickupLocationId: z.string().optional(),
  role: z.enum(['customer', 'admin_l1', 'admin_l2', 'super_admin']).default('customer'),
  auth0Id: z.string().optional(), // Optional because it might be set by Auth0 integration
  passwordHash: z.string().optional(), // For JWT authentication
});

// Validation schema for user update
export const updateUserSchema = createUserSchema
  .partial()
  .omit({ auth0Id: true }) // Don't allow updating Auth0 ID
  .extend({
    resetToken: z.string().nullable().optional(),
    resetTokenExpires: z.date().nullable().optional(),
    notificationPreferences: z.object({
      email: z.boolean().default(true),
      sms: z.boolean().default(false),
      push: z.boolean().default(false),
      pickupLocationId: z.string().nullable().optional(),
      packageUpdates: z.object({
        email: z.boolean().default(true),
        sms: z.boolean().default(false),
        push: z.boolean().default(false),
      }).optional(),
      billingUpdates: z.object({
        email: z.boolean().default(true),
        sms: z.boolean().default(false),
        push: z.boolean().default(false),
      }).optional(),
      marketingUpdates: z.object({
        email: z.boolean().default(false),
        sms: z.boolean().default(false),
        push: z.boolean().default(false),
      }).optional(),
    }).optional(),
  });

export class UsersService {
  private repository: UsersRepository;

  constructor() {
    this.repository = new UsersRepository();
  }

  /**
   * Get all users for a company
   */
  async getAllUsers(companyId: string) {
    return this.repository.findAll(companyId);
  }

  /**
   * Get all users across all companies (for superadmin)
   */
  async getAllUsersAcrossCompanies(filters?: { role?: string; companyId?: string }) {
    // Build the where conditions based on the filters
    let conditions;
    
    if (filters?.role && filters?.companyId) {
      conditions = and(
        eq(users.role, filters.role as any),
        eq(users.companyId, filters.companyId)
      );
    } else if (filters?.role) {
      conditions = eq(users.role, filters.role as any);
    } else if (filters?.companyId) {
      conditions = eq(users.companyId, filters.companyId);
    }
    
    return this.repository.findAllWithCondition(conditions);
  }

  /**
   * Get a user by ID with company isolation
   */
  async getUserById(id: string, companyId: string) {
    const user = await this.repository.findById(id, companyId);
    
    if (!user) {
      throw AppError.notFound('User not found');
    }
    
    return user;
  }

  /**
   * Get a user by ID with password for authentication
   */
  async getUserByIdWithPassword(id: string, companyId: string) {
    const user = await this.repository.findByIdWithPassword(id, companyId);
    
    if (!user) {
      throw AppError.notFound('User not found');
    }
    
    return user;
  }

  /**
   * Get a user by email with company isolation
   */
  async getUserByEmail(email: string, companyId: string) {
    const user = await this.repository.findByEmail(email, companyId);
    
    if (!user) {
      throw AppError.notFound('User not found');
    }
    
    return user;
  }

  /**
   * Get a user by email with password for authentication
   */
  async getUserByEmailWithPassword(email: string) {
    const user = await this.repository.findByEmailWithPassword(email);
    return user; // Can be null if not found, which is handled in the auth controller
  }

  /**
   * Get users by role with company isolation
   */
  async getUsersByRole(role: string, companyId: string) {
    // Validate role
    if (!['customer', 'admin_l1', 'admin_l2', 'super_admin'].includes(role)) {
      throw AppError.badRequest('Invalid role');
    }
    
    return this.repository.findByRole(role as "customer" | "admin_l1" | "admin_l2" | "super_admin", companyId);
  }

  /**
   * Create a new user with company isolation
   */
  async createUser(data: z.infer<typeof createUserSchema>, companyId: string) {
    // Validate data
    const validatedData = createUserSchema.parse(data);
    
    // Check if email is already in use within the company
    const existingUser = await this.repository.findByEmail(validatedData.email, companyId);
    if (existingUser) {
      throw AppError.conflict('Email is already in use');
    }
    
    // For JWT authentication, passwordHash must be provided
    if (!validatedData.auth0Id && !validatedData.passwordHash) {
      throw AppError.badRequest('Either Auth0 ID or password hash must be provided');
    }
    
    return this.repository.create(validatedData, companyId);
  }

  /**
   * Update a user with company isolation
   */
  async updateUser(id: string, data: z.infer<typeof updateUserSchema>, companyId: string) {
    // Validate data
    const validatedData = updateUserSchema.parse(data);
    
    // Check if user exists
    const user = await this.repository.findById(id, companyId);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    
    // Check if email is being changed and is unique within the company
    if (validatedData.email && validatedData.email !== user.email) {
      const existingUser = await this.repository.findByEmail(validatedData.email, companyId);
      if (existingUser) {
        throw AppError.conflict('Email is already in use');
      }
    }
    
    return this.repository.update(id, validatedData, companyId);
  }

  /**
   * Deactivate a user with company isolation (soft delete)
   */
  async deactivateUser(id: string, companyId: string) {
    // Check if user exists
    const user = await this.repository.findById(id, companyId);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    
    // Soft delete by setting isActive to false
    return this.repository.update(id, { isActive: false }, companyId);
  }

  /**
   * Reactivate a user with company isolation
   */
  async reactivateUser(id: string, companyId: string) {
    // Use the findByIdIgnoreStatus method to find a user regardless of active status
    const user = await this.repository.findByIdIgnoreActive(id, companyId);
    
    if (!user) {
      throw AppError.notFound('User not found');
    }
    
    // Reactivate by setting isActive to true
    return this.repository.update(id, { isActive: true }, companyId);
  }

  /**
   * Get system-wide statistics for superadmin dashboard
   */
  async getSystemStatistics() {
    const db = this.repository.getDatabaseInstance();
    
    // Get total user count
    const userCountResult = await db.select({
      count: sql`count(*)`.mapWith(Number)
    }).from(users);
    
    // Get total active user count
    const activeUserCountResult = await db.select({
      count: sql`count(*)`.mapWith(Number)
    }).from(users).where(eq(users.isActive, true));
    
    // Get total users by role
    const usersByRoleResult = await db.select({
      role: users.role,
      count: sql`count(*)`.mapWith(Number)
    }).from(users).groupBy(users.role);
    
    // Get total users by company
    const usersByCompanyResult = await db.select({
      companyId: users.companyId,
      count: sql`count(*)`.mapWith(Number)
    }).from(users).groupBy(users.companyId);
    
    return {
      totalUsers: userCountResult[0].count,
      activeUsers: activeUserCountResult[0].count,
      usersByRole: usersByRoleResult,
      usersByCompany: usersByCompanyResult
    };
  }

  /**
   * Get a user by email for password reset (no company isolation)
   */
  async getUserByEmailForPasswordReset(email: string) {
    return this.repository.findByEmailWithoutCompanyIsolation(email);
  }

  /**
   * Get a user by reset token
   */
  async getUserByResetToken(token: string) {
    return this.repository.findByResetToken(token);
  }
} 