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

  /**
   * Find a user by email without company isolation (for password reset)
   */
  async findByEmailWithoutCompanyIsolation(email: string) {
    const result = await this.db.select({
      id: users.id,
      companyId: users.companyId,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      resetToken: users.resetToken,
      resetTokenExpires: users.resetTokenExpires,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
    
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Find a user by reset token
   */
  async findByResetToken(token: string) {
    const result = await this.db.select({
      id: users.id,
      companyId: users.companyId,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      resetToken: users.resetToken,
      resetTokenExpires: users.resetTokenExpires
    })
    .from(users)
    .where(eq(users.resetToken, token))
    .limit(1);
    
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Find a user by verification token
   */
  async findByVerificationToken(token: string) {
    const result = await this.db.select()
      .from(this.table)
      .where(eq(this.table.verificationToken, token))
      .limit(1);
    
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Find a user by ID without company isolation (for superadmin)
   */
  async findByIdIgnoreCompany(id: string) {
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
      .where(eq(this.table.id, id))
      .limit(1);
    
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Update a user without company isolation (for superadmin)
   */
  async updateIgnoreCompany(id: string, data: Partial<{
    email: string;
    firstName: string | SQL<unknown>;
    lastName: string | SQL<unknown>;
    phone: string | SQL<unknown>;
    address: string | SQL<unknown>;
    role: typeof userRoleEnum.enumValues[number] | SQL<unknown>;
    companyId: string;
    isActive: boolean;
    passwordHash?: string;
    auth0Id?: string | SQL<unknown>;
  }>) {
    const result = await this.db
      .update(this.table)
      .set({
        ...data,
        role: data.role as typeof userRoleEnum.enumValues[number] | SQL<unknown>,
        updatedAt: new Date()
      })
      .where(eq(this.table.id, id))
      .returning();
    
    return result[0];
  }

  /**
   * Find a user by internal ID
   */
  async findByInternalId(internalId: string, companyId: string) {
    const results = await this.db
      .select()
      .from(users)
      .where(
        and(
          eq(users.companyId, companyId),
          eq(users.internalId, internalId)
        )
      );
    
    return results.length > 0 ? results[0] : null;
  }
} 