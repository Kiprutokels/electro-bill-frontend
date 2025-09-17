import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { dashboardService, DashboardOverview, DashboardQueryDto } from '@/api/services/dashboard.service';

interface UseDashboardOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}
// Normalize date range to ensure startDate is at start of day and endDate is at end of day
const normalizeDateRange = (params: DashboardQueryDto): DashboardQueryDto => {
  if (!params.startDate) return params;

  const start = new Date(params.startDate);
  start.setHours(0, 0, 0, 0);

  let end: Date;
  if (params.endDate) {
    end = new Date(params.endDate);
  } else {
    // if no endDate → assume single day
    end = new Date(params.startDate);
  }
  end.setHours(23, 59, 59, 999);

  return {
    ...params,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
};

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

      const normalizedParams = normalizeDateRange(params);
      console.log("📦 Payload sent:", normalizedParams);

      const data = await dashboardService.getDashboardOverview(normalizedParams);
      setDashboardData(data);
      console.log("📊 fetched dashboard data", data);
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

  // Initial + dateRange-triggered fetch
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
