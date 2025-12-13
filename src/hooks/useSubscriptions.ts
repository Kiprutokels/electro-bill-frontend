import { useState, useEffect, useCallback } from 'react';
import { subscriptionsService, Subscription, SubscriptionStatus, SubscriptionFilters, SubscriptionStats } from '@/api/services/subscriptions.service';
import { toast } from 'sonner';

export const useSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SubscriptionFilters>({});

  const fetchSubscriptions = useCallback(async (page = 1) => {
    const isRefresh = page === currentPage;
    
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    setError(null);

    try {
      const response = await subscriptionsService.getAll(
        page,
        10,
        searchTerm,
        filters
      );

      setSubscriptions(response.data);
      setCurrentPage(response.meta.page);
      setTotalPages(response.meta.totalPages);
      setTotalItems(response.meta.total);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch subscriptions';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, searchTerm, filters]);

  const fetchStats = useCallback(async () => {
    try {
      const statsData = await subscriptionsService.getDashboardStats();
      setStats(statsData);
    } catch (err: any) {
      console.error('Failed to fetch subscription stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions(1);
    fetchStats();
  }, [searchTerm, filters]);

  const refresh = () => {
    fetchSubscriptions(currentPage);
    fetchStats();
  };

  const updateSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const updateFilters = (newFilters: SubscriptionFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const updateSubscriptionInList = (updatedSubscription: Subscription) => {
    setSubscriptions(prev =>
      prev.map(sub => sub.id === updatedSubscription.id ? updatedSubscription : sub)
    );
  };

  const removeSubscriptionFromList = (id: string) => {
    setSubscriptions(prev => prev.filter(sub => sub.id !== id));
    setTotalItems(prev => prev - 1);
  };

  return {
    subscriptions,
    stats,
    loading,
    error,
    refreshing,
    currentPage,
    totalPages,
    totalItems,
    searchTerm,
    filters,
    fetchSubscriptions,
    refresh,
    updateSearch,
    updateFilters,
    updateSubscriptionInList,
    removeSubscriptionFromList,
    setCurrentPage,
  };
};
