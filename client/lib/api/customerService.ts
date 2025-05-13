import { apiClient } from './apiClient';
import { authService } from './authService';

/**
 * Service for handling user-related operations
 */
class UsersService {
  private baseUrl = '/companies';

  /**
   * Helper to get the current company ID
   */
  private async getCompanyId(): Promise<string> {
    const userProfile = await authService.getProfile();
    
    if (!userProfile || !userProfile.companyId) {
      throw new Error('Unable to fetch user company information');
    }
    
    return userProfile.companyId;
  }

  /**
   * Get all users for the current company
   */
  async getUsers(companyId?: string, params?: any): Promise<any[]> {
    const id = companyId || await this.getCompanyId();
    return apiClient.get<any[]>(`${this.baseUrl}/${id}/users`, { params });
  }
  
  /**
   * Get a specific user
   */
  async getUser(userId: string, companyId?: string): Promise<any> {
    const id = companyId || await this.getCompanyId();
    return apiClient.get<any>(`${this.baseUrl}/${id}/users/${userId}`);
  }
  
  /**
   * Create a new user
   */
  async createUser(userData: any, companyId?: string): Promise<any> {
    const id = companyId || await this.getCompanyId();
    return apiClient.post<any>(`${this.baseUrl}/${id}/users`, userData);
  }
  
  /**
   * Update a user
   */
  async updateUser(userId: string, userData: any, companyId?: string): Promise<any> {
    const id = companyId || await this.getCompanyId();
    return apiClient.put<any>(`${this.baseUrl}/${id}/users/${userId}`, userData);
  }
  
  /**
   * Delete a user
   */
  async deleteUser(userId: string, companyId?: string): Promise<void> {
    const id = companyId || await this.getCompanyId();
    return apiClient.delete<void>(`${this.baseUrl}/${id}/users/${userId}`);
  }

  /**
   * Get company details
   */
  async getCompanyDetails(companyId?: string): Promise<any> {
    const id = companyId || await this.getCompanyId();
    return apiClient.get<any>(`${this.baseUrl}/${id}`);
  }
  
  /**
   * Update company details
   */
  async updateCompanyDetails(data: any, companyId?: string): Promise<any> {
    const id = companyId || await this.getCompanyId();
    return apiClient.put<any>(`${this.baseUrl}/${id}`, data);
  }
}

// Export as singleton
export const usersService = new UsersService(); 