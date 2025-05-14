import { apiClient } from './apiClient';
import { authService } from './authService';
import { User } from './types';

class UserService {
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
   * Get a user by ID
   */
  async getUser(id: string, companyId?: string): Promise<User> {
    const cId = companyId || await this.getCompanyId();
    return apiClient.get<User>(`${this.baseUrl}/${cId}/users/${id}`);
  }
}

// Export as singleton
export const userService = new UserService(); 