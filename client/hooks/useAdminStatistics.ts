import { useState, useCallback, useEffect } from 'react';
import { profileService } from '@/lib/api/profileService';

interface AdminStatistics {
  totalPackages: number;
  packagesThisMonth: number;
  packagesLastMonth: number;
  packageGrowth: number;
  packagesByStatus: Record<string, number>;
  pendingPreAlerts: number;
  revenue: {
    current: number;
    previous: number;
    growth: number;
  };
  customerCount: number;
  monthlyRevenueTrend: Array<{
    month: string;
    revenue: number;
  }>;
  currency: 'USD' | 'JMD';
  exchangeRate?: number;
}

// Raw statistics data from the API
interface RawStatisticsData {
  totalPackages?: string | number;
  packagesThisMonth?: string | number;
  packagesLastMonth?: string | number;
  packageGrowth?: number;
  packagesByStatus?: Record<string, string | number>;
  pendingPreAlerts?: string | number;
  revenue?: {
    current?: string | number;
    previous?: string | number;
    growth?: number;
  };
  customerCount?: string | number;
  monthlyRevenueTrend?: Array<{
    month: string;
    revenue: string | number;
  }>;
  currency?: 'USD' | 'JMD';
  exchangeRate?: number;
  [key: string]: any; // Allow for additional properties
}

export function useAdminStatistics() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<AdminStatistics | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'JMD'>(() => {
    // Try to get the currency preference from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedCurrency');
      if (saved === 'USD' || saved === 'JMD') {
        return saved;
      }
    }
    return 'USD'; // Default currency
  });

  useEffect(() => {
    // Save currency preference to localStorage when it changes
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedCurrency', selectedCurrency);
    }
  }, [selectedCurrency]);

  const parseNumericValue = (value: string | number | null | undefined): number => {
    if (value === null || value === undefined) return 0;
    return typeof value === 'string' ? parseFloat(value) : value;
  };

  const parseStatistics = (data: RawStatisticsData): AdminStatistics => {
    console.log('Raw data received:', data);
    const parsed = {
      totalPackages: parseNumericValue(data.totalPackages),
      packagesThisMonth: parseNumericValue(data.packagesThisMonth),
      packagesLastMonth: parseNumericValue(data.packagesLastMonth),
      packageGrowth: parseNumericValue(data.packageGrowth),
      packagesByStatus: Object.entries(data.packagesByStatus || {}).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: parseNumericValue(value as string)
      }), {} as Record<string, number>),
      pendingPreAlerts: parseNumericValue(data.pendingPreAlerts),
      revenue: {
        current: parseNumericValue(data.revenue?.current),
        previous: parseNumericValue(data.revenue?.previous),
        growth: parseNumericValue(data.revenue?.growth)
      },
      customerCount: parseNumericValue(data.customerCount),
      monthlyRevenueTrend: (data.monthlyRevenueTrend || []).map((item: any) => ({
        month: item.month,
        revenue: parseNumericValue(item.revenue)
      })),
      currency: data.currency || 'USD',
      exchangeRate: data.exchangeRate || undefined
    };
    console.log('Parsed statistics:', parsed);
    return parsed;
  };

  const fetchStatistics = useCallback(async (currency?: 'USD' | 'JMD') => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the provided currency or fallback to the selected one
      const currencyToUse = currency || selectedCurrency;
      
      const response = await profileService.getUserStatistics(currencyToUse);
      console.log('API Response:', response);
      
      if (response && typeof response === 'object' && ('totalPackages' in response || 'packageGrowth' in response)) {
        const parsedStats = parseStatistics(response as RawStatisticsData);
        console.log('Setting statistics:', parsedStats);
        setStatistics(parsedStats);
        return parsedStats;
      } else {
        console.error('Invalid response format:', response);
        setError('Invalid response format from server');
      }
    } catch (err: any) {
      console.error('Error fetching statistics:', err);
      setError(err.message || 'Failed to fetch admin statistics');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedCurrency]);

  // Refresh statistics when currency changes
  useEffect(() => {
    fetchStatistics(selectedCurrency);
  }, [selectedCurrency, fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    fetchStatistics,
    selectedCurrency,
    setSelectedCurrency
  };
} 