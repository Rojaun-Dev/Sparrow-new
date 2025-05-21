export interface CompanyInvitation {
  id: number;
  email: string;
  token: string;
  companyId?: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CreateCompanyInvitation {
  email: string;
  token: string;
  companyId?: string;
  expiresAt: Date;
  createdBy: string;
}

export interface SendInvitationRequest {
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
    subdomain: string;
    email: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
    website?: string;
    locations?: string[];
    bankInfo?: string;
  };
} 