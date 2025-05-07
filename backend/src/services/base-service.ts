import { BaseRepository } from '../repositories/base-repository';
import { PgTable } from 'drizzle-orm/pg-core';

// Import the TableWithCompanyId interface from the repository
import type { TableWithCompanyId } from '../repositories/base-repository';

/**
 * Base service class that handles common operations with company isolation
 */
export class BaseService<T extends PgTable<any> & TableWithCompanyId> {
  protected repository: BaseRepository<T>;

  constructor(repository: BaseRepository<T>) {
    this.repository = repository;
  }

  /**
   * Get all records with company isolation
   */
  async getAll(companyId: string): Promise<any[]> {
    return this.repository.findAll(companyId);
  }

  /**
   * Get a record by ID with company isolation
   */
  async getById(id: string, companyId: string) {
    const entity = await this.repository.findById(id, companyId);
    
    if (!entity) {
      throw new Error('Entity not found');
    }
    
    return entity;
  }

  /**
   * Create a new record with company ID
   */
  async create(data: any, companyId: string) {
    return this.repository.create(data, companyId);
  }

  /**
   * Update a record by ID with company isolation
   */
  async update(id: string, data: any, companyId: string) {
    const entity = await this.repository.findById(id, companyId);
    
    if (!entity) {
      throw new Error('Entity not found');
    }
    
    return this.repository.update(id, data, companyId);
  }

  /**
   * Delete a record by ID with company isolation
   */
  async delete(id: string, companyId: string) {
    const entity = await this.repository.findById(id, companyId);
    
    if (!entity) {
      throw new Error('Entity not found');
    }
    
    return this.repository.delete(id, companyId);
  }
} 