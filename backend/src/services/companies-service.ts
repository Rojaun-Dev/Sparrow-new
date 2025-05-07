import { CompaniesRepository } from '../repositories/companies-repository';
import { z } from 'zod';

// Validation schema for company creation
export const createCompanySchema = z.object({
  name: z.string().min(2).max(100),
  subdomain: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url().optional(),
  locations: z.array(z.string()).optional(),
  bankInfo: z.string().optional(),
});

// Validation schema for company update
export const updateCompanySchema = createCompanySchema.partial();

export class CompaniesService {
  private repository: CompaniesRepository;

  constructor() {
    this.repository = new CompaniesRepository();
  }

  /**
   * Get all companies (super admin only)
   */
  async getAllCompanies() {
    return this.repository.findAll();
  }

  /**
   * Get a company by ID (without company isolation)
   */
  async getCompanyById(id: string) {
    const company = await this.repository.findById(id);
    
    if (!company) {
      throw new Error('Company not found');
    }
    
    return company;
  }

  /**
   * Get a company by subdomain
   */
  async getCompanyBySubdomain(subdomain: string) {
    const company = await this.repository.findBySubdomain(subdomain);
    
    if (!company) {
      throw new Error('Company not found');
    }
    
    return company;
  }

  /**
   * Create a new company (super admin only)
   */
  async createCompany(data: z.infer<typeof createCompanySchema>) {
    // Validate data
    const validatedData = createCompanySchema.parse(data);
    
    // Check if subdomain is already in use
    const existingCompany = await this.repository.findBySubdomain(validatedData.subdomain);
    if (existingCompany) {
      throw new Error('Subdomain is already in use');
    }
    
    return this.repository.create(validatedData);
  }

  /**
   * Update a company by ID (without company isolation)
   */
  async updateCompany(id: string, data: z.infer<typeof updateCompanySchema>) {
    // Validate data
    const validatedData = updateCompanySchema.parse(data);
    
    // Check if company exists
    const company = await this.repository.findById(id);
    if (!company) {
      throw new Error('Company not found');
    }
    
    // Check if subdomain is being changed and is unique
    if (validatedData.subdomain && validatedData.subdomain !== company.subdomain) {
      const existingCompany = await this.repository.findBySubdomain(validatedData.subdomain);
      if (existingCompany) {
        throw new Error('Subdomain is already in use');
      }
    }
    
    return this.repository.update(id, validatedData);
  }

  /**
   * Delete a company
   */
  async deleteCompany(id: string) {
    // Verify company exists
    const company = await this.getCompanyById(id);
    
    if (!company) {
      throw new Error('Company not found');
    }
    
    return this.repository.delete(id);
  }
} 