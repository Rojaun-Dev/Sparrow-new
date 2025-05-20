import { z } from 'zod';
import { UsersRepository } from '../repositories/users-repository';
import { AppError } from '../utils/app-error';
import { and, eq, sql, or, like, asc, desc, gte, lte } from 'drizzle-orm';
import { users } from '../db/schema/users';
import { companies } from '../db/schema/companies';

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

// Define types for query parameters
export interface UserListParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  role?: string;
  companyId?: string;
  isActive?: boolean;
  search?: string;
  createdFrom?: string;
  createdTo?: string;
}

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
   * Get all users across companies with pagination, sorting and filtering
   */
  async getAllUsersAcrossCompanies(params: UserListParams = {}) {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
      role,
      companyId,
      isActive,
      search,
      createdFrom,
      createdTo
    } = params;

    const offset = (page - 1) * limit;
    
    // Build query conditions
    const conditions = [];
    
    if (role) {
      conditions.push(eq(users.role, role as any));
    }
    
    if (companyId) {
      conditions.push(eq(users.companyId, companyId));
    }
    
    if (isActive !== undefined) {
      conditions.push(eq(users.isActive, isActive));
    }
    
    if (search) {
      conditions.push(
        or(
          like(users.email, `%${search}%`),
          like(users.firstName, `%${search}%`),
          like(users.lastName, `%${search}%`)
        )
      );
    }
    
    if (createdFrom) {
      conditions.push(gte(users.createdAt, new Date(createdFrom)));
    }
    
    if (createdTo) {
      conditions.push(lte(users.createdAt, new Date(createdTo)));
    }
    
    // Combine conditions
    const whereCondition = conditions.length > 0 
      ? and(...conditions) 
      : undefined;
    
    // Get total count for pagination
    const totalCountResult = await this.repository.getDatabaseInstance()
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(users)
      .where(whereCondition);
    
    const totalItems = totalCountResult[0].count;
    const totalPages = Math.ceil(totalItems / limit);
    
    // Build order by condition
    let orderBy;
    switch (sort) {
      case 'firstName':
        orderBy = order === 'asc' ? asc(users.firstName) : desc(users.firstName);
        break;
      case 'lastName':
        orderBy = order === 'asc' ? asc(users.lastName) : desc(users.lastName);
        break;
      case 'email':
        orderBy = order === 'asc' ? asc(users.email) : desc(users.email);
        break;
      case 'role':
        orderBy = order === 'asc' ? asc(users.role) : desc(users.role);
        break;
      case 'createdAt':
      default:
        orderBy = order === 'asc' ? asc(users.createdAt) : desc(users.createdAt);
    }
    
    // Get users with companies
    const db = this.repository.getDatabaseInstance();
    const data = await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      address: users.address,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      companyId: users.companyId,
      companyName: companies.name
    })
    .from(users)
    .leftJoin(companies, eq(users.companyId, companies.id))
    .where(whereCondition)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);
    
    return {
      data,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages
      }
    };
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
   * Get comprehensive system-wide statistics for superadmin dashboard
   */
  async getSystemStatistics() {
    const db = this.repository.getDatabaseInstance();
    
    // Get total user counts
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
      companyName: companies.name,
      count: sql`count(*)`.mapWith(Number)
    })
    .from(users)
    .leftJoin(companies, eq(users.companyId, companies.id))
    .groupBy(users.companyId, companies.name);
    
    // Get companies count
    const companiesCountResult = await db.select({
      count: sql`count(*)`.mapWith(Number)
    }).from(companies);
    
    // Get users created in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newUsersResult = await db.select({
      count: sql`count(*)`.mapWith(Number)
    }).from(users).where(gte(users.createdAt, thirtyDaysAgo));
    
    // Get users by creation date (last 12 months)
    const usersByMonth = [];
    const today = new Date();
    
    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
      
      const monthlyUsersResult = await db.select({
        count: sql`count(*)`.mapWith(Number)
      })
      .from(users)
      .where(
        and(
          gte(users.createdAt, monthStart),
          lte(users.createdAt, monthEnd)
        )
      );
      
      const monthName = monthStart.toLocaleString('default', { month: 'short' });
      usersByMonth.push({
        month: monthName,
        year: monthStart.getFullYear(),
        count: monthlyUsersResult[0].count
      });
    }
    
    // Get role distribution percentages
    const totalUsers = userCountResult[0].count;
    const roleDistribution = usersByRoleResult.map(item => ({
      role: item.role,
      count: item.count,
      percentage: Math.round((item.count / totalUsers) * 100)
    }));
    
    return {
      totalUsers: userCountResult[0].count,
      activeUsers: activeUserCountResult[0].count,
      inactiveUsers: userCountResult[0].count - activeUserCountResult[0].count,
      totalCompanies: companiesCountResult[0].count,
      newUsers30Days: newUsersResult[0].count,
      usersByRole: roleDistribution,
      usersByCompany: usersByCompanyResult,
      usersByMonth: usersByMonth,
      activePercentage: Math.round((activeUserCountResult[0].count / userCountResult[0].count) * 100)
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