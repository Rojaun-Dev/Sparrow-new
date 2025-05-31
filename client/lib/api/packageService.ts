import { apiClient } from './apiClient';
import { authService } from './authService';
import { Package, PackageFilterParams, PaginatedResponse } from './types';

class PackageService {
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
   * Get all packages with optional filters
   */
  async getPackages(filters: PackageFilterParams = {}): Promise<any> {
    const companyId = filters.companyId || await this.getCompanyId();
    return apiClient.get<any>(`${this.baseUrl}/${companyId}/packages`, {
      params: {
        status: filters.status,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        page: filters.page,
        limit: filters.limit,
      }
    });
  }
  
  /**
   * Get packages for the current user
   */
  async getUserPackages(filters: PackageFilterParams = {}): Promise<Package[]> {
    const companyId = await this.getCompanyId();
    
    const userProfile = await authService.getProfile();
    
    if (!userProfile || !userProfile.id) {
      throw new Error('Unable to fetch user information');
    }
    
    try {
      const response = await apiClient.get<any>(`${this.baseUrl}/${companyId}/packages/user/${userProfile.id}`, {
        params: {
          status: filters.status,
          search: filters.search,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
          limit: filters.limit,
          offset: filters.offset
        }
      });
      
      // Handle both paginated response and direct array response
      if (response && response.data && Array.isArray(response.data)) {
        // If it's a paginated response, return just the data array to maintain compatibility
        return response.data;
      } else if (Array.isArray(response)) {
        // If it's a direct array, return it as is
        return response;
      }
      
      // Default to empty array
      return [];
    } catch (error) {
      console.error('Error fetching user packages:', error);
      // Return empty array instead of throwing to prevent query errors
      return [];
    }
  }
  
  /**
   * Get packages for the current user with pagination info
   * This is a new method that returns the full paginated response
   */
  async getUserPackagesWithPagination(filters: PackageFilterParams = {}): Promise<PaginatedResponse<Package>> {
    const companyId = await this.getCompanyId();
    
    const userProfile = await authService.getProfile();
    
    if (!userProfile || !userProfile.id) {
      throw new Error('Unable to fetch user information');
    }
    
    try {
      const response = await apiClient.get<any>(`${this.baseUrl}/${companyId}/packages/user/${userProfile.id}`, {
        params: {
          status: filters.status,
          search: filters.search,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
          limit: filters.limit,
          offset: filters.offset
        }
      });
      
      // If the response is a paginated response
      if (response && response.data && Array.isArray(response.data)) {
        return response;
      }
      
      // If the response is an array, wrap it in a PaginatedResponse structure
      if (Array.isArray(response)) {
        return {
          data: response,
          pagination: {
            total: response.length,
            page: filters.page || 1,
            limit: filters.limit || response.length,
            totalPages: 1
          }
        };
      }
      
      // Default empty response
      return {
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: filters.limit || 10,
          totalPages: 0
        }
      };
    } catch (error) {
      console.error('Error fetching user packages with pagination:', error);
      // Return empty paginated response instead of throwing to prevent query errors
      return {
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: filters.limit || 10,
          totalPages: 0
        }
      };
    }
  }
  
  /**
   * Get a single package by ID
   */
  async getPackage(id: string, companyId?: string): Promise<Package> {
    const cId = companyId || await this.getCompanyId();
    return apiClient.get<Package>(`${this.baseUrl}/${cId}/packages/${id}`);
  }
  
  /**
   * Get package timeline events
   */
  async getPackageTimeline(id: string, companyId?: string): Promise<any[]> {
    const cId = companyId || await this.getCompanyId();
    return apiClient.get<any[]>(`${this.baseUrl}/${cId}/packages/${id}/timeline`);
  }
  
  /**
   * Update package status
   */
  async updatePackageStatus(id: string, status: string, companyId?: string, sendNotification?: boolean): Promise<Package> {
    const cId = companyId || await this.getCompanyId();
    return apiClient.put<Package>(`${this.baseUrl}/${cId}/packages/${id}/status`, { status, sendNotification });
  }
  
  /**
   * Upload package photos
   */
  async uploadPackagePhotos(id: string, files: File[], companyId?: string): Promise<Package> {
    const cId = companyId || await this.getCompanyId();
    
    const formData = new FormData();
    files.forEach(file => {
      formData.append('photos', file);
    });
    
    return apiClient.post<Package>(
      `${this.baseUrl}/${cId}/packages/${id}/photos`, 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
  }
  
  /**
   * Create a package
   */
  async createPackage(data: Partial<Package>, companyId?: string): Promise<Package> {
    const cId = companyId || await this.getCompanyId();
    return apiClient.post<Package>(`${this.baseUrl}/${cId}/packages`, data);
  }
  
  /**
   * Update a package
   */
  async updatePackage(id: string, data: Partial<Package>, companyId?: string): Promise<Package> {
    const cId = companyId || await this.getCompanyId();
    return apiClient.put<Package>(`${this.baseUrl}/${cId}/packages/${id}`, data);
  }
  
  /**
   * Delete a package
   */
  async deletePackage(id: string, companyId?: string, sendNotification?: boolean): Promise<void> {
    const cId = companyId || await this.getCompanyId();
    // Send as query param for delete
    const url = sendNotification !== undefined
      ? `${this.baseUrl}/${cId}/packages/${id}?sendNotification=${sendNotification}`
      : `${this.baseUrl}/${cId}/packages/${id}`;
    return apiClient.delete<void>(url);
  }

  /**
   * Get packages by invoice ID
   */
  async getPackagesByInvoiceId(invoiceId: string, companyId?: string): Promise<Package[]> {
    const cId = companyId || await this.getCompanyId();
    return apiClient.get<Package[]>(`${this.baseUrl}/${cId}/packages/by-invoice/${invoiceId}`);
  }

  /**
   * Export packages as CSV for the current company
   */
  async exportPackagesCsv(params?: any, companyId?: string): Promise<Blob> {
    const id = companyId || await this.getCompanyId();
    return apiClient.downloadFile(`${this.baseUrl}/${id}/packages/export-csv`, params);
  }
}

// Create and export a single instance of the service
export const packageService = new PackageService(); 