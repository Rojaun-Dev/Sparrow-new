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
  role: 'customer' | 'admin_l1' | 'admin_l2' | 'super_admin';
  isActive: boolean;
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
export type PaymentMethod = 'credit_card' | 'bank_transfer' | 'cash' | 'check';
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
}

// Fee related types
export type FeeType = 'tax' | 'service' | 'shipping' | 'handling' | 'customs' | 'other';
export type CalculationMethod = 'fixed' | 'percentage' | 'per_weight' | 'per_item' | 'dimensional' | 'tiered';

export interface Fee extends BaseEntity {
  companyId: string;
  name: string;
  code: string;
  feeType: FeeType;
  calculationMethod: CalculationMethod;
  amount: number;
  currency: string;
  appliesTo: string[];
  metadata?: any;
  description?: string;
  isActive: boolean;
}

// Company setting types
export interface CompanySettings extends BaseEntity {
  companyId: string;
  shippingRates?: any;
  handlingFees?: any;
  customsFees?: any;
  taxRates?: any;
  shippingAddress?: any;
  notificationSettings?: any;
  exchangeRateSettings?: any;
  themeSettings?: any;
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