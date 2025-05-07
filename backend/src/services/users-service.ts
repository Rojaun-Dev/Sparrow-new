import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { UsersRepository } from '../repositories/users-repository';
import { AppError } from '../utils/app-error';
import { auth0 } from '../config';
import { userRoleEnum } from '../db/schema/users';
import { db } from '../db';

// Validation schema for user creation
export const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  phone: z.string().optional(),
  address: z.string().optional(),
  role: z.enum(['customer', 'admin_l1', 'admin_l2']).default('customer'),
  auth0Id: z.string().optional(), // Optional because it might be set by Auth0 integration
});

// Validation schema for user update
export const updateUserSchema = createUserSchema
  .partial()
  .omit({ auth0Id: true }); // Don't allow updating Auth0 ID

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
   * Get users by role with company isolation
   */
  async getUsersByRole(role: string, companyId: string) {
    // Validate role
    if (!['customer', 'admin_l1', 'admin_l2'].includes(role)) {
      throw AppError.badRequest('Invalid role');
    }
    
    return this.repository.findByRole(role as "customer" | "admin_l1" | "admin_l2", companyId);
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
    
    // TODO: Integrate with Auth0 to create user if auth0Id is not provided
    // This would be implemented based on the Auth0 Management API
    if (!validatedData.auth0Id) {
      // Example stub for Auth0 integration
      // const auth0User = await createAuth0User(validatedData, companyId);
      // validatedData.auth0Id = auth0User.user_id;
      
      // For now, throw error if auth0Id is not provided
      throw AppError.badRequest('Auth0 ID is required');
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
    
    // TODO: Integrate with Auth0 to update user if needed
    // This would be implemented based on the Auth0 Management API
    
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
} 