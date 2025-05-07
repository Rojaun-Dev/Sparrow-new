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
      .select()
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
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.role, role),
          eq(this.table.companyId, companyId)
        )
      );
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
    
    return this.db.select().from(this.table).where(where);
  }

  /**
   * Find a user by ID regardless of isActive status
   */
  async findByIdIgnoreActive(id: string, companyId: string) {
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
} 