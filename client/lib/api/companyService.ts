import { ApiClient } from './apiClient';
import { PaginatedResponse } from './userService';

export interface CompanyListParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  createdFrom?: string;
  createdTo?: string;
}

export interface CompanyData {
  id: string;
  name: string;
  subdomain: string;
  email: string;
  phone?: string;
  address?: string;
  website?: string;
  locations?: string[];
  bankInfo?: string;
  createdAt: string;
  updatedAt: string;
  userCount: number;
  packageCount: number;
}

export interface CompanyStatistics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  totalPackages: number;
  activePackages: number;
  readyForPickup: number;
  pendingPreAlerts: number;
}

export class SuperAdminCompanyService {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient();
  }

  /**
   * Get all companies with pagination and filtering
   */
  async getAllCompanies(params: CompanyListParams = {}): Promise<PaginatedResponse<CompanyData>> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.order) queryParams.append('order', params.order);
    if (params.search) queryParams.append('search', params.search);
    if (params.createdFrom) queryParams.append('createdFrom', params.createdFrom);
    if (params.createdTo) queryParams.append('createdTo', params.createdTo);
    
    const url = `/superadmin/companies?${queryParams.toString()}`;
    return this.apiClient.get<PaginatedResponse<CompanyData>>(url);
  }

  /**
   * Get a company by ID
   */
  async getCompanyById(id: string): Promise<CompanyData> {
    const url = `/superadmin/companies/${id}`;
    return this.apiClient.get<CompanyData>(url);
  }

  /**
   * Create a new company
   */
  async createCompany(data: Partial<CompanyData>): Promise<CompanyData> {
    const url = '/superadmin/companies';
    return this.apiClient.post<CompanyData>(url, data);
  }

  /**
   * Update a company
   */
  async updateCompany(id: string, data: Partial<CompanyData>): Promise<CompanyData> {
    const url = `/superadmin/companies/${id}`;
    return this.apiClient.put<CompanyData>(url, data);
  }

  /**
   * Delete a company
   */
  async deleteCompany(id: string): Promise<void> {
    const url = `/superadmin/companies/${id}`;
    return this.apiClient.delete<void>(url);
  }

  /**
   * Get company statistics
   */
  async getCompanyStatistics(companyId: string): Promise<CompanyStatistics> {
    const url = `/superadmin/companies/${companyId}/statistics`;
    return this.apiClient.get<CompanyStatistics>(url);
  }

  /**
   * Get the current user's company
   */
  async getCurrentCompany(): Promise<CompanyData> {
    const url = '/companies/current';
    return this.apiClient.get<CompanyData>(url);
  }
}

// Create and export a singleton instance
export const companyService = new SuperAdminCompanyService(); 