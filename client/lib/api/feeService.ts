import { apiClient } from './apiClient';
import { authService } from './authService';
import { Fee } from './types';

class FeeService {
  private baseUrl = '/companies';

  private async getCompanyId(): Promise<string> {
    const userProfile = await authService.getProfile();
    if (!userProfile || !userProfile.companyId) {
      throw new Error('Unable to fetch user company information');
    }
    return userProfile.companyId;
  }

  async getFees(companyId?: string): Promise<Fee[]> {
    const id = companyId || await this.getCompanyId();
    return apiClient.get<Fee[]>(`${this.baseUrl}/${id}/fees`);
  }

  async getFee(id: string, companyId?: string): Promise<Fee> {
    const cId = companyId || await this.getCompanyId();
    return apiClient.get<Fee>(`${this.baseUrl}/${cId}/fees/${id}`);
  }

  async createFee(data: Partial<Fee>, companyId?: string): Promise<Fee> {
    const cId = companyId || await this.getCompanyId();
    // Build metadata for percentage, tiered, and threshold fees
    let metadata = data.metadata || {};
    if (data.calculationMethod === 'percentage') {
      metadata = { ...metadata, baseAttribute: metadata.baseAttribute };
    }
    if (data.calculationMethod === 'tiered') {
      metadata = { ...metadata, tiers: metadata.tiers, tierAttribute: metadata.tierAttribute };
    }
    if (data.calculationMethod === 'threshold') {
      metadata = {
        ...metadata,
        attribute: metadata.attribute,
        min: metadata.min,
        max: metadata.max,
        application: metadata.application,
      };
    }
    if (data.calculationMethod === 'timed') {
      metadata = {
        ...metadata,
        days: metadata.days,
        application: metadata.application,
      };
    }
    const payload = { ...data, amount: data.amount !== undefined ? Number(data.amount) : undefined, metadata };
    return apiClient.post<Fee>(`${this.baseUrl}/${cId}/fees`, payload);
  }

  async updateFee(id: string, data: Partial<Fee>, companyId?: string): Promise<Fee> {
    const cId = companyId || await this.getCompanyId();
    // Build metadata for percentage, tiered, and threshold fees
    let metadata = data.metadata || {};
    if (data.calculationMethod === 'percentage') {
      metadata = { ...metadata, baseAttribute: metadata.baseAttribute };
    }
    if (data.calculationMethod === 'tiered') {
      metadata = { ...metadata, tiers: metadata.tiers, tierAttribute: metadata.tierAttribute };
    }
    if (data.calculationMethod === 'threshold') {
      metadata = {
        ...metadata,
        attribute: metadata.attribute,
        min: metadata.min,
        max: metadata.max,
        application: metadata.application,
      };
    }
    if (data.calculationMethod === 'timed') {
      metadata = {
        ...metadata,
        days: metadata.days,
        application: metadata.application,
      };
    }
    const payload = { ...data, amount: data.amount !== undefined ? Number(data.amount) : undefined, metadata };
    return apiClient.put<Fee>(`${this.baseUrl}/${cId}/fees/${id}`, payload);
  }

  async deleteFee(id: string, companyId?: string): Promise<void> {
    const cId = companyId || await this.getCompanyId();
    return apiClient.delete<void>(`${this.baseUrl}/${cId}/fees/${id}`);
  }
}

export const feeService = new FeeService(); 