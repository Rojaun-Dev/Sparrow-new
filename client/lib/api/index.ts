// Export all types
export type * from './types';

// Export API client
export { apiClient, ApiError } from './apiClient';

// Export services
export { packageService } from './packageService';
export { preAlertService } from './preAlertService';
export { invoiceService } from './invoiceService';
export { paymentService } from './paymentService';
export { profileService } from './profileService';

// Export a combined API object with all services
export const api = {
  packages: packageService,
  preAlerts: preAlertService,
  invoices: invoiceService,
  payments: paymentService,
  profile: profileService,
}; 