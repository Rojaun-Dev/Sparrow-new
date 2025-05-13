import { apiClient } from './apiClient';
import { authService } from './authService';
import { customerService } from './customerService';
import { Package, PackageFilterParams } from './types';

class PackageService {
  private baseUrl = '/packages';

  /**
   * Get all packages with optional filters
   */
  async getPackages(filters: PackageFilterParams = {}): Promise<Package[]> {
    // For multi-tenant isolation, use the customerService which handles company context
    return customerService.getPackages(filters.companyId, {
      status: filters.status,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      limit: filters.limit,
      offset: filters.offset
    });
  }
  
  /**
   * Get packages for the current user
   */
  async getUserPackages(filters: PackageFilterParams = {}): Promise<Package[]> {
    // Just use customerService directly as it handles getting the current company ID
    return customerService.getPackages(undefined, {
      status: filters.status,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      limit: filters.limit,
      offset: filters.offset
    });
  }
  
  /**
   * Get a single package by ID
   */
  async getPackage(id: string): Promise<Package> {
    return customerService.getPackage(id);
  }
  
  /**
   * Get package timeline events
   */
  async getPackageTimeline(id: string): Promise<any[]> {
    return customerService.getPackageTimeline(id);
  }
  
  /**
   * Update package status
   */
  async updatePackageStatus(id: string, status: string): Promise<Package> {
    return customerService.updatePackageStatus(id, status);
  }
  
  /**
   * Upload package photos
   */
  async uploadPackagePhotos(id: string, files: File[]): Promise<Package> {
    return customerService.uploadPackagePhotos(id, files);
  }
  
  /**
   * Get all packages (admin only)
   */
  async getAllPackages(params?: any): Promise<Package[]> {
    return apiClient.get<Package[]>(this.baseUrl, { params });
  }
  
  /**
   * Create a package (admin only)
   */
  async createPackage(data: Partial<Package>): Promise<Package> {
    return apiClient.post<Package>(this.baseUrl, data);
  }
  
  /**
   * Update a package (admin only)
   */
  async updatePackage(id: string, data: Partial<Package>): Promise<Package> {
    return apiClient.put<Package>(`${this.baseUrl}/${id}`, data);
  }
  
  /**
   * Delete a package (admin only)
   */
  async deletePackage(id: string): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/${id}`);
  }
}

export const packageService = new PackageService(); 