import { CompaniesRepository } from '../repositories/companies-repository';
import { z } from 'zod';
import { companies } from '../db/schema/companies';
import { users } from '../db/schema/users';
import { packages } from '../db/schema/packages';
import { preAlerts } from '../db/schema/pre-alerts';
import { and, or, like, asc, desc, gte, lte, eq, sql } from 'drizzle-orm';

// Validation schema for company creation
export const createCompanySchema = z.object({
  name: z.string().min(2).max(100),
  subdomain: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  shipping_info: z.object({
    address_line1: z.string().optional(),
    address_line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  website: z.string().url().optional(),
  locations: z.array(z.string()).optional(),
  bankInfo: z.string().optional(),
});

// Validation schema for company update
export const updateCompanySchema = createCompanySchema.partial();

// Define types for company listing parameters
export interface CompanyListParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  createdFrom?: string;
  createdTo?: string;
}

export class CompaniesService {
  private repository: CompaniesRepository;

  constructor() {
    this.repository = new CompaniesRepository();
  }

  /**
   * Get all companies with pagination, sorting and filtering (super admin only)
   */
  async getAllCompanies(params: CompanyListParams = {}) {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
      search,
      createdFrom,
      createdTo
    } = params;

    const offset = (page - 1) * limit;
    
    // Build query conditions
    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          like(companies.name, `%${search}%`),
          like(companies.email, `%${search}%`),
          like(companies.subdomain, `%${search}%`)
        )
      );
    }
    
    if (createdFrom) {
      conditions.push(gte(companies.createdAt, new Date(createdFrom)));
    }
    
    if (createdTo) {
      conditions.push(lte(companies.createdAt, new Date(createdTo)));
    }
    
    // Combine conditions
    const whereCondition = conditions.length > 0 
      ? and(...conditions) 
      : undefined;
    
    // Get total count for pagination
    const db = this.repository.getDatabaseInstance();
    const totalCountResult = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(companies)
      .where(whereCondition);
    
    const totalItems = totalCountResult[0].count;
    const totalPages = Math.ceil(totalItems / limit);
    
    // Build order by condition
    let orderBy;
    switch (sort) {
      case 'name':
        orderBy = order === 'asc' ? asc(companies.name) : desc(companies.name);
        break;
      case 'email':
        orderBy = order === 'asc' ? asc(companies.email) : desc(companies.email);
        break;
      case 'subdomain':
        orderBy = order === 'asc' ? asc(companies.subdomain) : desc(companies.subdomain);
        break;
      case 'createdAt':
      default:
        orderBy = order === 'asc' ? asc(companies.createdAt) : desc(companies.createdAt);
    }
    
    // Get companies with user and package counts
    const data = await db
      .select({
        id: companies.id,
        name: companies.name,
        subdomain: companies.subdomain,
        email: companies.email,
        phone: companies.phone,
        address: companies.address,
        shipping_info: companies.shipping_info,
        website: companies.website,
        locations: companies.locations,
        bankInfo: companies.bankInfo,
        createdAt: companies.createdAt,
        updatedAt: companies.updatedAt,
        userCount: sql<number>`COUNT(DISTINCT ${users.id})`,
        packageCount: sql<number>`COUNT(DISTINCT ${packages.id})`
      })
      .from(companies)
      .leftJoin(users, eq(users.companyId, companies.id))
      .leftJoin(packages, eq(packages.companyId, companies.id))
      .where(whereCondition)
      .groupBy(
        companies.id,
        companies.name,
        companies.subdomain,
        companies.email,
        companies.phone,
        companies.address,
        companies.shipping_info,
        companies.website,
        companies.locations,
        companies.bankInfo,
        companies.createdAt,
        companies.updatedAt
      )
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

  /**
   * Get company statistics
   */
  async getCompanyStatistics(companyId: string) {
    const db = this.repository.getDatabaseInstance();
    
    // Get current date range for 30-day stats
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Get total users
    const [totalUsersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.companyId, companyId));
    
    // Get active users
    const [activeUsersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(
        and(
          eq(users.companyId, companyId),
          eq(users.isActive, true)
        )
      );
    
    // Get new users in last 30 days
    const [newUsersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(
        and(
          eq(users.companyId, companyId),
          gte(users.createdAt, thirtyDaysAgo)
        )
      );
    
    // Get total packages
    const [totalPackagesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(packages)
      .where(eq(packages.companyId, companyId));
    
    // Get active packages (in processing)
    const [activePackagesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(packages)
      .where(
        and(
          eq(packages.companyId, companyId),
          eq(packages.status, 'processed')
        )
      );
    
    // Get packages ready for pickup
    const [readyForPickupResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(packages)
      .where(
        and(
          eq(packages.companyId, companyId),
          eq(packages.status, 'ready_for_pickup')
        )
      );
    
    // Get pending pre-alerts
    const [pendingPreAlertsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(preAlerts)
      .where(
        and(
          eq(preAlerts.companyId, companyId),
          eq(preAlerts.status, 'pending')
        )
      );
    
    return {
      totalUsers: totalUsersResult.count || 0,
      activeUsers: activeUsersResult.count || 0,
      newUsers: newUsersResult.count || 0,
      totalPackages: totalPackagesResult.count || 0,
      activePackages: activePackagesResult.count || 0,
      readyForPickup: readyForPickupResult.count || 0,
      pendingPreAlerts: pendingPreAlertsResult.count || 0
    };
  }
} 