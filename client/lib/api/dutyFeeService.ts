import { apiClient } from './apiClient';
import { authService } from './authService';

export interface DutyFee {
  id: string;
  companyId: string;
  packageId: string;
  feeType: string;
  customFeeType?: string;
  amount: number;
  currency: 'USD' | 'JMD';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDutyFeeRequest {
  packageId: string;
  feeType: string;
  customFeeType?: string;
  amount: number;
  currency: 'USD' | 'JMD';
  description?: string;
}

export interface UpdateDutyFeeRequest {
  feeType?: string;
  customFeeType?: string;
  amount?: number;
  currency?: 'USD' | 'JMD';
  description?: string;
}

export const DUTY_FEE_TYPES = [
  'Electronics',
  'Clothing & Footwear', 
  'Food & Grocery',
  'Household Appliances',
  'Furniture',
  'Construction Materials',
  'Tools & Machinery',
  'Cosmetics & Personal',
  'Medical Equipment',
  'Agricultural Products',
  'Pet Supplies',
  'Books & Education',
  'Mobile Accessories',
  'ANIMALS',
  'SOLAR EQUIPMENT',
  'WRIST WATCHES',
  'Other'
] as const;

export type DutyFeeType = typeof DUTY_FEE_TYPES[number];

class DutyFeeService {
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
   * Get all duty fees for the company
   */
  async getAllDutyFees(): Promise<DutyFee[]> {
    const companyId = await this.getCompanyId();
    return apiClient.get<DutyFee[]>(`${this.baseUrl}/${companyId}/duty-fees`);
  }

  /**
   * Get duty fees for a specific package
   */
  async getDutyFeesByPackageId(packageId: string): Promise<DutyFee[]> {
    const companyId = await this.getCompanyId();
    return apiClient.get<DutyFee[]>(`${this.baseUrl}/${companyId}/duty-fees/package/${packageId}`);
  }

  /**
   * Get duty fees grouped by currency for a package
   */
  async getPackageFeesGroupedByCurrency(packageId: string): Promise<any> {
    const companyId = await this.getCompanyId();
    return apiClient.get(`${this.baseUrl}/${companyId}/duty-fees/package/${packageId}/grouped`);
  }

  /**
   * Get total duty fees for a package in a specific currency
   */
  async getPackageFeeTotal(packageId: string, currency: 'USD' | 'JMD'): Promise<{ total: number; currency: string }> {
    const companyId = await this.getCompanyId();
    return apiClient.get(`${this.baseUrl}/${companyId}/duty-fees/package/${packageId}/total`, {
      params: { currency }
    });
  }

  /**
   * Get a specific duty fee by ID
   */
  async getDutyFeeById(id: string): Promise<DutyFee> {
    const companyId = await this.getCompanyId();
    return apiClient.get<DutyFee>(`${this.baseUrl}/${companyId}/duty-fees/${id}`);
  }

  /**
   * Create a new duty fee
   */
  async createDutyFee(data: CreateDutyFeeRequest): Promise<DutyFee> {
    const companyId = await this.getCompanyId();
    return apiClient.post<DutyFee>(`${this.baseUrl}/${companyId}/duty-fees`, data);
  }

  /**
   * Update a duty fee
   */
  async updateDutyFee(id: string, data: UpdateDutyFeeRequest): Promise<DutyFee> {
    const companyId = await this.getCompanyId();
    return apiClient.put<DutyFee>(`${this.baseUrl}/${companyId}/duty-fees/${id}`, data);
  }

  /**
   * Delete a duty fee
   */
  async deleteDutyFee(id: string): Promise<void> {
    const companyId = await this.getCompanyId();
    return apiClient.delete(`${this.baseUrl}/${companyId}/duty-fees/${id}`);
  }
}

export const dutyFeeService = new DutyFeeService();