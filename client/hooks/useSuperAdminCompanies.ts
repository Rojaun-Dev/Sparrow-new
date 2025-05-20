import { useState, useCallback } from 'react';
import { 
  SuperAdminCompanyService, 
  CompanyListParams, 
  CompanyData 
} from '@/lib/api/companyService';
import { PaginatedResponse } from '@/lib/api/userService';

export function useSuperAdminCompanies() {
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<CompanyData>['pagination']>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentCompany, setCurrentCompany] = useState<CompanyData | null>(null);

  const companyService = new SuperAdminCompanyService();

  const fetchCompanies = useCallback(async (params?: CompanyListParams) => {
    try {
      setLoading(true);
      setError(null);
      const response = await companyService.getAllCompanies(params);
      setCompanies(response.data);
      setPagination(response.pagination);
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch companies');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCompanyById = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const company = await companyService.getCompanyById(id);
      setCurrentCompany(company);
      return company;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch company');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createCompany = useCallback(async (data: Partial<CompanyData>) => {
    try {
      setLoading(true);
      setError(null);
      const newCompany = await companyService.createCompany(data);
      setCompanies(prev => [...prev, newCompany]);
      return newCompany;
    } catch (err: any) {
      setError(err.message || 'Failed to create company');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCompany = useCallback(async (id: string, data: Partial<CompanyData>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedCompany = await companyService.updateCompany(id, data);
      setCompanies(prev => prev.map(company => company.id === id ? updatedCompany : company));
      if (currentCompany?.id === id) {
        setCurrentCompany(updatedCompany);
      }
      return updatedCompany;
    } catch (err: any) {
      setError(err.message || 'Failed to update company');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentCompany]);

  const deleteCompany = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await companyService.deleteCompany(id);
      setCompanies(prev => prev.filter(company => company.id !== id));
      if (currentCompany?.id === id) {
        setCurrentCompany(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete company');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentCompany]);

  return {
    companies,
    pagination,
    loading,
    error,
    currentCompany,
    fetchCompanies,
    fetchCompanyById,
    createCompany,
    updateCompany,
    deleteCompany
  };
} 