import { ApiClient } from './apiClient';
import { apiClient } from './apiClient';
import { 
  Company, 
  CompanyInvitationRequest,
  VerifyInvitationResponse,
  RegisterFromInvitationRequest,
  CompanyInvitation,
  PaginatedResponse
} from './types';

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

// Company Invitation Methods
/**
 * Send an invitation to register a new company
 */
export const sendCompanyInvitation = async (data: CompanyInvitationRequest): Promise<void> => {
  await apiClient.post('/companies/invite', data);
};

/**
 * Verify an invitation token
 */
export const verifyCompanyInvitation = async (token: string): Promise<VerifyInvitationResponse> => {
  const response = await apiClient.get<VerifyInvitationResponse>(`/companies/verify-invitation/${token}`);
  return response;
};

/**
 * Register a company from an invitation
 */
export const registerCompanyFromInvitation = async (
  token: string, 
  data: Omit<RegisterFromInvitationRequest, 'token'>
): Promise<void> => {
  await apiClient.post(`/companies/register/${token}`, data);
};

// Company Invitation Methods for SuperAdmin
/**
 * List all invitations with pagination
 */
export const listCompanyInvitations = async (
  page: number = 1, 
  limit: number = 10,
  status?: string,
  search?: string
): Promise<PaginatedResponse<CompanyInvitation>> => {
  const queryParams = new URLSearchParams();
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());
  if (status) queryParams.append('status', status);
  if (search) queryParams.append('search', search);
  
  return apiClient.get<PaginatedResponse<CompanyInvitation>>(`/superadmin/invitations?${queryParams.toString()}`);
};

/**
 * Send a new company invitation
 */
export const sendSuperAdminCompanyInvitation = async (email: string): Promise<void> => {
  await apiClient.post('/superadmin/invitations', { email });
};

/**
 * Resend an invitation
 */
export const resendCompanyInvitation = async (id: number): Promise<void> => {
  await apiClient.post(`/superadmin/invitations/${id}/resend`);
};

/**
 * Revoke an invitation
 */
export const revokeCompanyInvitation = async (id: number): Promise<void> => {
  await apiClient.post(`/superadmin/invitations/${id}/revoke`);
}; 