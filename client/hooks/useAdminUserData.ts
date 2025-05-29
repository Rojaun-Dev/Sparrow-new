import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/apiClient';

export function useAdminUserPackages(companyId: string, userId: string, options = {}) {
  return useQuery({
    queryKey: ['admin-user-packages', companyId, userId],
    queryFn: async () => {
      const url = `/companies/${companyId}/packages/user/${userId}`;
      return apiClient.get(url);
    },
    enabled: !!companyId && !!userId,
    ...options,
  });
}

export function useAdminUserPreAlerts(companyId: string, userId: string, options = {}) {
  return useQuery({
    queryKey: ['admin-user-prealerts', companyId, userId],
    queryFn: async () => {
      const url = `/companies/${companyId}/prealerts/user/${userId}`;
      return apiClient.get(url);
    },
    enabled: !!companyId && !!userId,
    ...options,
  });
}

export function useAdminUserPayments(companyId: string, userId: string, options = {}) {
  return useQuery({
    queryKey: ['admin-user-payments', companyId, userId],
    queryFn: async () => {
      const url = `/companies/${companyId}/payments/user/${userId}`;
      return apiClient.get(url);
    },
    enabled: !!companyId && !!userId,
    ...options,
  });
}

export function useAdminUserInvoices(companyId: string, userId: string, options = {}) {
  return useQuery({
    queryKey: ['admin-user-invoices', companyId, userId],
    queryFn: async () => {
      const url = `/companies/${companyId}/invoices/user/${userId}`;
      return apiClient.get(url);
    },
    enabled: !!companyId && !!userId,
    ...options,
  });
} 