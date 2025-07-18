// Common types for API responses
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// API response wrapper type
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Auth related types
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  companyId?: string;
  agreeToTerms: boolean;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Base entity types with common fields
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// User related types
export interface User extends BaseEntity {
  companyId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  trn?: string; // Tax Registration Number
  prefId?: string; // Company prefix combined with internal ID
  role: 'customer' | 'admin_l1' | 'admin_l2' | 'super_admin';
  isActive: boolean;
  notificationPreferences?: NotificationPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  pickupLocationId?: string | null;
  packageUpdates?: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  billingUpdates?: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  marketingUpdates?: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

// Package related types
export type PackageStatus = 'pre_alert' | 'received' | 'processed' | 'ready_for_pickup' | 'delivered' | 'returned';

export interface Package extends BaseEntity {
  companyId: string;
  userId: string;
  preAlertId?: string;
  trackingNumber: string;
  internalTrackingId: string;
  status: PackageStatus;
  description: string;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  declaredValue?: number;
  senderInfo?: {
    name?: string;
    address?: string;
    phone?: string;
  };
  receivedDate?: string;
  processingDate?: string;
  photos?: string[];
  tags?: string[];
  notes?: string;
}

// Pre-alert related types
export type PreAlertStatus = 'pending' | 'matched' | 'cancelled';

export interface PreAlert extends BaseEntity {
  companyId: string;
  userId: string;
  trackingNumber: string;
  courier: string;
  description: string;
  weight?: number;
  estimatedArrival?: string;
  packageId?: string;
  status: PreAlertStatus;
  documents?: string[];
}

// Invoice related types
export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'cancelled' | 'overdue';

export interface Invoice extends BaseEntity {
  companyId: string;
  userId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  items?: InvoiceItem[];
  feeBreakdown?: Record<string, number>;
}

export type InvoiceItemType = 'shipping' | 'handling' | 'customs' | 'tax' | 'other';

export interface InvoiceItem extends BaseEntity {
  companyId: string;
  invoiceId: string;
  packageId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  type: InvoiceItemType;
}

// Payment related types
export type PaymentMethod = 'credit_card' | 'bank_transfer' | 'cash' | 'check' | 'online';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Payment extends BaseEntity {
  companyId: string;
  invoiceId: string;
  userId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  paymentDate: string;
  notes?: string;
  invoiceNumber?: string; // Added from backend search results
  meta?: {
    currency?: SupportedCurrency;
    exchangeRate?: number;
    wiPayRequestPayload?: any;
    wiPayCallback?: any;
    transactionTimestamp?: string;
    [key: string]: any;
  };
}

// Fee related types
export type FeeType = 'tax' | 'service' | 'shipping' | 'handling' | 'customs' | 'other' | 'threshold';
export type CalculationMethod = 'fixed' | 'percentage' | 'per_weight' | 'per_item' | 'dimensional' | 'tiered' | 'threshold' | 'timed';

export interface Fee extends BaseEntity {
  companyId: string;
  name: string;
  code: string;
  feeType: FeeType;
  calculationMethod: CalculationMethod;
  amount: number;
  currency: string;
  appliesTo: string[];
  /**
   * For percentage fees, metadata.baseAttribute (string) determines what the percentage is of (e.g., 'subtotal').
   * For tiered fees, metadata.tiers (array) and metadata.tierAttribute (string) define the tiers.
   * For threshold fees, metadata should include:
   *   - attribute: 'weight' | 'declaredValue' | FeeType
   *   - min: number (inclusive)
   *   - max: number (inclusive or null for no upper bound)
   *   - application: 'before' | 'during' | 'after' (when the fee applies relative to the threshold)
   * For timed fees, metadata should include:
   *   - days: number (number of days)
   *   - application: 'before' | 'after' (when the fee applies relative to the days)
   */
  metadata?: any;
  description?: string;
  isActive: boolean;
}

// Company setting types
export type SupportedCurrency = 'USD' | 'JMD';

export interface ExchangeRateSettings {
  baseCurrency: SupportedCurrency;
  targetCurrency: SupportedCurrency;
  exchangeRate: number;
  lastUpdated: string | null;
  autoUpdate: boolean;
}

export interface CompanySettings extends BaseEntity {
  companyId: string;
  shippingRates?: any;
  handlingFees?: any;
  customsFees?: any;
  taxRates?: any;
  shippingAddress?: any;
  notificationSettings?: any;
  exchangeRateSettings?: ExchangeRateSettings;
  themeSettings?: any;
  integrationSettings?: {
    magayaIntegration?: {
      enabled: boolean;
      username?: string;
      password?: string;
      networkId?: string;
      dateRangePreference?: 'today' | 'this_week' | 'this_month';
      autoImportEnabled?: boolean;
      lastImportDate?: string;
      cronEnabled?: boolean; // Whether scheduled auto import is enabled
      cronInterval?: number; // Number of hours between imports (8, 12, 24, 48, 72)
    };
    [key: string]: any;
  };
}

// Request parameters types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  offset?: number;
}

export interface PackageFilterParams extends PaginationParams {
  companyId?: string;
  status?: PackageStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
}

export interface PreAlertFilterParams extends PaginationParams {
  companyId?: string;
  status?: PreAlertStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface InvoiceFilterParams extends PaginationParams {
  companyId?: string;
  status?: InvoiceStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  isPaid?: boolean;
}

export interface PaymentFilterParams extends PaginationParams {
  companyId?: string;
  status?: PaymentStatus;
  method?: PaymentMethod;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Add User and Company types if they don't exist
export interface Company extends BaseEntity {
  name: string;
  address?: string;
  shipping_info?: {
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  phone?: string;
  email?: string;
  website?: string;
  subdomain?: string;
  locations?: string[];
  bankInfo?: string;
  paymentSettings?: any;
  images?: {
    logo?: string;
    favicon?: string;
    banner?: string;
  };
}

// Company Invitation Types
export interface CompanyInvitationRequest {
  email: string;
}

export interface VerifyInvitationResponse {
  isValid: boolean;
  email?: string;
}

export interface RegisterFromInvitationRequest {
  token: string;
  user: {
    firstName: string;
    lastName: string;
    password: string;
  };
  company: {
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
}

export interface CompanyInvitation {
  id: number;
  email: string;
  token?: string;
  companyId?: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
} 