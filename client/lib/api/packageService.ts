import { apiClient } from './apiClient';
import { authService } from './authService';
import { Package, PackageFilterParams } from './types';

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
  async getPackages(filters: PackageFilterParams = {}): Promise<Package[]> {
    const companyId = filters.companyId || await this.getCompanyId();
    
    return apiClient.get<Package[]>(`${this.baseUrl}/${companyId}/packages`, {
      params: {
        status: filters.status,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        limit: filters.limit,
        offset: filters.offset
      }
    });
  }
  
  /**
   * Get packages for the current user
   */
  async getUserPackages(filters: PackageFilterParams = {}): Promise<Package[]> {
    const companyId = await this.getCompanyId();
    
    return apiClient.get<Package[]>(`${this.baseUrl}/${companyId}/packages/user`, {
      params: {
        status: filters.status,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        limit: filters.limit,
        offset: filters.offset
      }
    });
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
  async updatePackageStatus(id: string, status: string, companyId?: string): Promise<Package> {
    const cId = companyId || await this.getCompanyId();
    return apiClient.put<Package>(`${this.baseUrl}/${cId}/packages/${id}/status`, { status });
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
  async deletePackage(id: string, companyId?: string): Promise<void> {
    const cId = companyId || await this.getCompanyId();
    return apiClient.delete<void>(`${this.baseUrl}/${cId}/packages/${id}`);
  }
}

export const packageService = new PackageService(); 