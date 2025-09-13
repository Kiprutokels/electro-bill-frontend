import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { dashboardService, DashboardOverview, DashboardQueryDto } from '@/api/services/dashboard.service';

interface UseDashboardOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useDashboard = (options: UseDashboardOptions = {}) => {
  const { autoRefresh = false, refreshInterval = 60000 } = options;

  const [dashboardData, setDashboardData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<DashboardQueryDto>({});

  const fetchDashboard = useCallback(async (
    params = dateRange,
    showRefreshing = false
  ) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = await dashboardService.getDashboardOverview(params);
      setDashboardData(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch dashboard data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange]);

  const refresh = useCallback(() => {
    fetchDashboard(dateRange, true);
  }, [fetchDashboard, dateRange]);

  const updateDateRange = useCallback((newDateRange: DashboardQueryDto) => {
    setDateRange(newDateRange);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchDashboard();
  }, [dateRange]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchDashboard(dateRange, true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchDashboard, dateRange]);

  return {
    // State
    dashboardData,
    loading,
    error,
    refreshing,
    dateRange,
    
    // Actions
    fetchDashboard,
    refresh,
    updateDateRange,
  };
};
