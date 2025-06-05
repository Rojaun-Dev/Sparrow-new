import { ApiClient } from './apiClient';

export type CompanyAssetType = 'logo' | 'banner' | 'favicon' | 'small_logo';

export interface CompanyAsset {
  id: string;
  companyId: string;
  type: CompanyAssetType;
  metadata: Record<string, any>;
  imageData?: string;
  createdAt: string;
}

class CompanyAssetService {
  private apiClient = new ApiClient();

  async listAssets(companyId: string): Promise<CompanyAsset[]> {
    return this.apiClient.get(`/companies/${companyId}/assets`).then(r => (r as { data: any }).data);
  }

  async createAsset(companyId: string, data: Partial<CompanyAsset>): Promise<CompanyAsset> {
    return this.apiClient.post(`/companies/${companyId}/assets`, data).then(r => (r as { data: any }).data[0] || (r as { data: any }).data);
  }

  async updateAsset(companyId: string, assetId: string, data: Partial<CompanyAsset>): Promise<CompanyAsset> {
    return this.apiClient.put(`/companies/${companyId}/assets/${assetId}`, data).then(r => (r as { data: any }).data[0] || (r as { data: any }).data);
  }

  async deleteAsset(companyId: string, assetId: string): Promise<void> {
    await this.apiClient.delete(`/companies/${companyId}/assets/${assetId}`);
  }
}

export const companyAssetService = new CompanyAssetService(); 