import { safeGetEnv } from './env';

// API URL from environment variables
const API_URL = safeGetEnv('NEXT_PUBLIC_API_URL', 'http://localhost:3001/api');

// Helper to get token from localStorage
const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Default headers for all requests
const getHeaders = (contentType = 'application/json'): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': contentType,
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// Fetch wrapper with authentication
async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: getHeaders(),
  };

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  });

  // Parse JSON or throw error with status
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `API error: ${response.status} ${response.statusText}`
    );
  }

  // Some endpoints might not return JSON
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }

  return (await response.text()) as unknown as T;
}

// API methods
const apiClient = {
  // Expose utility functions and constants
  API_URL,
  getToken,
  getHeaders,

  // Auth endpoints
  auth: {
    login: (data: { email: string; password: string }) =>
      fetchWithAuth('/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    signup: (data: any) =>
      fetchWithAuth('/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    getProfile: () => fetchWithAuth('/me'),
    
    updateProfile: (data: any) =>
      fetchWithAuth('/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // Customer data endpoints
  customer: {
    getPackages: (companyId: string) =>
      fetchWithAuth(`/companies/${companyId}/packages`),
    
    getPackage: (companyId: string, packageId: string) =>
      fetchWithAuth(`/companies/${companyId}/packages/${packageId}`),
    
    getPreAlerts: (companyId: string) =>
      fetchWithAuth(`/companies/${companyId}/prealerts`),
    
    createPreAlert: (companyId: string, data: any) =>
      fetchWithAuth(`/companies/${companyId}/prealerts`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    getInvoices: (companyId: string) =>
      fetchWithAuth(`/companies/${companyId}/invoices`),
    
    getPayments: (companyId: string) =>
      fetchWithAuth(`/companies/${companyId}/payments`),
  },
};

export default apiClient; 