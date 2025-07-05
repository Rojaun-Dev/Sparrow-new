import { apiClient } from './apiClient';
import { CompanySettings, ExchangeRateSettings } from './types';

class CompanySettingsService {
  /**
   * Get company settings
   */
  async getCompanySettings(): Promise<CompanySettings> {
    return apiClient.get('/company-settings');
  }

  /**
   * Update company information
   */
  async updateCompany(data: any) {
    return apiClient.put(`/companies/${data.id}`, data);
  }

  /**
   * Update company locations
   */
  async updateLocations(locations: string[]) {
    return apiClient.put(`/companies/current`, { locations });
  }

  /**
   * Update integration settings
   */
  async updateIntegrationSettings(data: any) {
    return apiClient.put('/company-settings/integration', data);
  }

  /**
   * Update internal prefix
   */
  async updateInternalPrefix(internalPrefix: string) {
    return apiClient.put('/company-settings/internal-prefix', { internalPrefix });
  }

  /**
   * Update exchange rate settings
   */
  async updateExchangeRateSettings(data: ExchangeRateSettings) {
    return apiClient.put('/company-settings/exchange-rate', data);
  }
}

export const companySettingsService = new CompanySettingsService(); 