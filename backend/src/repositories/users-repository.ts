import { SQL, and, eq } from 'drizzle-orm';
import { users, userRoleEnum } from '../db/schema/users';
import { BaseRepository } from './base-repository';

export class UsersRepository extends BaseRepository<typeof users> {
  constructor() {
    super(users);
  }

  /**
   * Find a user by email within a company
   */
  async findByEmail(email: string, companyId: string) {
    const result = await this.db
      .select({
        id: this.table.id,
        email: this.table.email,
        firstName: this.table.firstName,
        lastName: this.table.lastName,
        phone: this.table.phone,
        address: this.table.address,
        role: this.table.role,
        companyId: this.table.companyId,
        isActive: this.table.isActive,
        createdAt: this.table.createdAt,
        updatedAt: this.table.updatedAt,
        auth0Id: this.table.auth0Id
      })
      .from(this.table)
      .where(
        and(
          eq(this.table.email, email),
          eq(this.table.companyId, companyId)
        )
      )
      .limit(1);
    
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Find a user by email with password (for authentication)
   */
  async findByEmailWithPassword(email: string) {
    const result = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.email, email))
      .limit(1);
    
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Find a user by ID with password (for authentication)
   */
  async findByIdWithPassword(id: string, companyId: string) {
    const result = await this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.id, id),
          eq(this.table.companyId, companyId)
        )
      )
      .limit(1);
    
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Find a user by Auth0 ID
   */
  async findByAuth0Id(auth0Id: string) {
    const result = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.auth0Id, auth0Id))
      .limit(1);
    
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Find users by role within a company
   */
  async findByRole(role: typeof userRoleEnum.enumValues[number], companyId: string) {
    return this.db
      .select({
        id: this.table.id,
        email: this.table.email,
        firstName: this.table.firstName,
        lastName: this.table.lastName,
        phone: this.table.phone,
        address: this.table.address,
        role: this.table.role,
        companyId: this.table.companyId,
        isActive: this.table.isActive,
        createdAt: this.table.createdAt,
        updatedAt: this.table.updatedAt,
        auth0Id: this.table.auth0Id
      })
      .from(this.table)
      .where(
        and(
          eq(this.table.role, role),
          eq(this.table.companyId, companyId)
        )
      );
  }

  /**
   * Find all users matching a condition (for superadmin)
   */
  async findAllWithCondition(condition?: SQL<unknown>) {
    if (condition) {
      return this.db
        .select({
          id: this.table.id,
          email: this.table.email,
          firstName: this.table.firstName,
          lastName: this.table.lastName,
          phone: this.table.phone,
          address: this.table.address,
          role: this.table.role,
          companyId: this.table.companyId,
          isActive: this.table.isActive,
          createdAt: this.table.createdAt,
          updatedAt: this.table.updatedAt
        })
        .from(this.table)
        .where(condition);
    }
    
    return this.db
      .select({
        id: this.table.id,
        email: this.table.email,
        firstName: this.table.firstName,
        lastName: this.table.lastName,
        phone: this.table.phone,
        address: this.table.address,
        role: this.table.role,
        companyId: this.table.companyId,
        isActive: this.table.isActive,
        createdAt: this.table.createdAt,
        updatedAt: this.table.updatedAt
      })
      .from(this.table);
  }

  /**
   * Find active users within a company
   */
  async findActive(companyId: string, conditions?: SQL<unknown>) {
    const where = conditions
      ? and(
          eq(this.table.companyId, companyId),
          eq(this.table.isActive, true),
          conditions
        )
      : and(
          eq(this.table.companyId, companyId),
          eq(this.table.isActive, true)
        );
    
    return this.db
      .select({
        id: this.table.id,
        email: this.table.email,
        firstName: this.table.firstName,
        lastName: this.table.lastName,
        phone: this.table.phone,
        address: this.table.address,
        role: this.table.role,
        companyId: this.table.companyId,
        isActive: this.table.isActive,
        createdAt: this.table.createdAt,
        updatedAt: this.table.updatedAt,
        auth0Id: this.table.auth0Id
      })
      .from(this.table)
      .where(where);
  }

  /**
   * Find a user by ID regardless of isActive status
   */
  async findByIdIgnoreActive(id: string, companyId: string) {
    const result = await this.db
      .select({
        id: this.table.id,
        email: this.table.email,
        firstName: this.table.firstName,
        lastName: this.table.lastName,
        phone: this.table.phone,
        address: this.table.address,
        role: this.table.role,
        companyId: this.table.companyId,
        isActive: this.table.isActive,
        createdAt: this.table.createdAt,
        updatedAt: this.table.updatedAt,
        auth0Id: this.table.auth0Id
      })
      .from(this.table)
      .where(
        and(
          eq(this.table.id, id),
          eq(this.table.companyId, companyId)
        )
      )
      .limit(1);
    
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Get the database instance for custom queries
   */
  getDatabaseInstance() {
    return this.db;
  }
} 