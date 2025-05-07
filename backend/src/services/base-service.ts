import { BaseRepository } from '../repositories/base-repository';

export class BaseService<T> {
  protected repository: BaseRepository<T>;

  constructor(repository: BaseRepository<T>) {
    this.repository = repository;
  }

  /**
   * Get all records with company isolation
   */
  async getAll(companyId: string) {
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