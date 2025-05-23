// Export all types
export type { User, Package, PreAlert, Invoice, Payment } from './types';

// Export API client
export { apiClient, type ApiError } from './apiClient';

// Export services
export { packageService } from './packageService';
export { preAlertService } from './preAlertService';
export { invoiceService } from './invoiceService';
export { paymentService } from './paymentService';
export { profileService } from './profileService';
export { authService } from './authService';
export { usersService } from './customerService';
export { companyService } from './companyService';

// Export a combined API object with all services
export const api = {
  packages: packageService,
  preAlerts: preAlertService,
  invoices: invoiceService,
  payments: paymentService,
  profile: profileService,
  auth: authService,
  users: usersService,
  company: companyService
}; 