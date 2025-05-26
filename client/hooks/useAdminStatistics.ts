import { useState, useCallback } from 'react';
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
}

export function useAdminStatistics() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<AdminStatistics | null>(null);

  const parseNumericValue = (value: string | number | null): number => {
    if (value === null || value === undefined) return 0;
    return typeof value === 'string' ? parseFloat(value) : value;
  };

  const parseStatistics = (data: any): AdminStatistics => {
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
      }))
    };
    console.log('Parsed statistics:', parsed);
    return parsed;
  };

  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await profileService.getUserStatistics();
      console.log('API Response:', response);
      
      if (response) {
        const parsedStats = parseStatistics(response);
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
  }, []);

  return {
    statistics,
    loading,
    error,
    fetchStatistics
  };
} 