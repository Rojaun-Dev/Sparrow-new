import { apiClient } from './apiClient';
import { Package, PackageFilterParams, PaginatedResponse } from './types';

class PackageService {
  private baseUrl = '/packages';

  /**
   * Get all packages with pagination and filtering
   */
  async getPackages(params?: PackageFilterParams): Promise<PaginatedResponse<Package>> {
    return apiClient.get<PaginatedResponse<Package>>(this.baseUrl, { params });
  }

  /**
   * Get a single package by ID
   */
  async getPackage(id: string): Promise<Package> {
    return apiClient.get<Package>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get packages belonging to the current user
   */
  async getUserPackages(params?: PackageFilterParams): Promise<PaginatedResponse<Package>> {
    return apiClient.get<PaginatedResponse<Package>>(`${this.baseUrl}/user`, { params });
  }

  /**
   * Get package history/timeline
   */
  async getPackageTimeline(id: string): Promise<any[]> {
    return apiClient.get<any[]>(`${this.baseUrl}/${id}/timeline`);
  }

  /**
   * Update package status
   */
  async updatePackageStatus(id: string, status: string): Promise<Package> {
    return apiClient.patch<Package>(`${this.baseUrl}/${id}/status`, { status });
  }

  /**
   * Upload package photos
   */
  async uploadPackagePhotos(id: string, files: File[]): Promise<Package> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`photos[${index}]`, file);
    });

    return apiClient.post<Package>(`${this.baseUrl}/${id}/photos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
}

// Export as singleton
export const packageService = new PackageService(); 