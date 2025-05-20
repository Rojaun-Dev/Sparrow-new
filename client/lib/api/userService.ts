import { ApiClient } from './apiClient';

export interface UserListParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  role?: string;
  companyId?: string;
  isActive?: boolean;
  search?: string;
  createdFrom?: string;
  createdTo?: string;
}

export interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  companyId: string;
  companyName: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export class SuperAdminUserService {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient();
  }

  /**
   * Get all users across all companies with pagination and filtering
   */
  async getAllUsers(params: UserListParams = {}): Promise<PaginatedResponse<UserData>> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.order) queryParams.append('order', params.order);
    if (params.role) queryParams.append('role', params.role);
    if (params.companyId) queryParams.append('companyId', params.companyId);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.createdFrom) queryParams.append('createdFrom', params.createdFrom);
    if (params.createdTo) queryParams.append('createdTo', params.createdTo);
    
    const url = `/superadmin/users?${queryParams.toString()}`;
    return this.apiClient.get<PaginatedResponse<UserData>>(url);
  }

  /**
   * Get a user by ID
   */
  async getUserById(id: string): Promise<UserData> {
    const url = `/superadmin/users/${id}`;
    return this.apiClient.get<UserData>(url);
  }

  /**
   * Create an admin user
   */
  async createAdminUser(data: any): Promise<UserData> {
    const url = '/superadmin/users';
    return this.apiClient.post<UserData>(url, data);
  }

  /**
   * Update a user
   */
  async updateUser(id: string, data: any): Promise<UserData> {
    const url = `/superadmin/users/${id}`;
    return this.apiClient.put<UserData>(url, data);
  }

  /**
   * Deactivate a user
   */
  async deactivateUser(id: string): Promise<void> {
    const url = `/superadmin/users/${id}`;
    return this.apiClient.delete<void>(url);
  }

  /**
   * Reactivate a user
   */
  async reactivateUser(id: string): Promise<void> {
    const url = `/superadmin/users/${id}/reactivate`;
    return this.apiClient.post<void>(url, {});
  }

  /**
   * Get system statistics
   */
  async getSystemStatistics(): Promise<any> {
    const url = '/superadmin/statistics';
    return this.apiClient.get<any>(url);
  }

  /**
   * Get user activity logs
   */
  async getUserActivity(userId: string, params: any = {}): Promise<PaginatedResponse<any>> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.order) queryParams.append('order', params.order);
    if (params.action) queryParams.append('action', params.action);
    if (params.entityType) queryParams.append('entityType', params.entityType);
    if (params.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params.toDate) queryParams.append('toDate', params.toDate);
    
    const url = `/superadmin/users/${userId}/activity?${queryParams.toString()}`;
    return this.apiClient.get<PaginatedResponse<any>>(url);
  }
} 