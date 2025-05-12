import apiClient from '@/lib/api-client';
import { Package, PackageFilterParams } from './types';

class PackageService {
  // Get all packages with optional filters
  async getPackages(filters: PackageFilterParams = {}): Promise<Package[]> {
    const { companyId } = filters;
    
    if (!companyId) {
      throw new Error('Company ID is required to fetch packages');
    }
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
    if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
    if (filters.limit) queryParams.append('limit', filters.limit.toString());
    if (filters.offset) queryParams.append('offset', filters.offset.toString());
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    
    const response = await apiClient.customer.getPackages(companyId);
    return response as Package[];
  }
  
  // Get packages for the current user
  async getUserPackages(filters: PackageFilterParams = {}): Promise<Package[]> {
    // First get user profile to get companyId
    const userProfile = await apiClient.auth.getProfile();
    
    if (!userProfile || !userProfile.companyId) {
      throw new Error('Unable to fetch user company information');
    }
    
    // Now call getPackages with the companyId
    return this.getPackages({
      ...filters,
      companyId: userProfile.companyId
    });
  }
  
  // Get a single package by ID
  async getPackage(id: string): Promise<Package> {
    // First get user profile to get companyId
    const userProfile = await apiClient.auth.getProfile();
    
    if (!userProfile || !userProfile.companyId) {
      throw new Error('Unable to fetch user company information');
    }
    
    const response = await fetch(`${apiClient.API_URL}/companies/${userProfile.companyId}/packages/${id}`, {
      headers: apiClient.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch package: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  // Get package timeline events
  async getPackageTimeline(id: string): Promise<any[]> {
    // First get user profile to get companyId
    const userProfile = await apiClient.auth.getProfile();
    
    if (!userProfile || !userProfile.companyId) {
      throw new Error('Unable to fetch user company information');
    }
    
    const response = await fetch(`${apiClient.API_URL}/companies/${userProfile.companyId}/packages/${id}/timeline`, {
      headers: apiClient.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch package timeline: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  // Update package status
  async updatePackageStatus(id: string, status: string): Promise<Package> {
    // First get user profile to get companyId
    const userProfile = await apiClient.auth.getProfile();
    
    if (!userProfile || !userProfile.companyId) {
      throw new Error('Unable to fetch user company information');
    }
    
    const response = await fetch(`${apiClient.API_URL}/companies/${userProfile.companyId}/packages/${id}/status`, {
      method: 'PUT',
      headers: apiClient.getHeaders(),
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update package status: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  // Upload package photos
  async uploadPackagePhotos(id: string, files: File[]): Promise<Package> {
    // First get user profile to get companyId
    const userProfile = await apiClient.auth.getProfile();
    
    if (!userProfile || !userProfile.companyId) {
      throw new Error('Unable to fetch user company information');
    }
    
    const formData = new FormData();
    files.forEach(file => {
      formData.append('photos', file);
    });
    
    const response = await fetch(`${apiClient.API_URL}/companies/${userProfile.companyId}/packages/${id}/photos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiClient.getToken()}`,
        // Don't set Content-Type here, it will be set automatically with the correct boundary
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to upload package photos: ${response.statusText}`);
    }
    
    return await response.json();
  }
}

export const packageService = new PackageService(); 