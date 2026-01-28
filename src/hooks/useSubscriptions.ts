import { useState, useEffect, useCallback } from "react";
import {
  subscriptionsService,
  Subscription,
  SubscriptionFilters,
  SubscriptionStats,
} from "@/api/services/subscriptions.service";
import { toast } from "sonner";

const DEFAULT_PAGE_SIZE = 25;
const ALLOWED_PAGE_SIZES = new Set([10, 25, 50, 100]);

export const useSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<SubscriptionFilters>({});

  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  const fetchSubscriptions = useCallback(
    async (page = 1) => {
      const safePage = !page || page < 1 ? 1 : page;

      const isRefresh = safePage === currentPage;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError(null);

      try {
        const response = await subscriptionsService.getAll(
          safePage,
          pageSize,
          searchTerm,
          filters,
        );

        setSubscriptions(response.data);
        setCurrentPage(response.meta.page);
        setTotalPages(response.meta.totalPages);
        setTotalItems(response.meta.total);
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || "Failed to fetch subscriptions";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentPage, searchTerm, filters, pageSize],
  );

  const fetchStats = useCallback(async () => {
    try {
      const statsData = await subscriptionsService.getDashboardStats();
      setStats(statsData);
    } catch (err) {
      console.error("Failed to fetch subscription stats:", err);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions(1);
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filters, pageSize]);

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

  const updatePageSize = (newSize: number) => {
    if (!ALLOWED_PAGE_SIZES.has(newSize)) return;
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const updateSubscriptionInList = (updated: Subscription) => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s)),
    );
  };

  const removeSubscriptionFromList = (id: string) => {
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
    setTotalItems((prev) => Math.max(0, prev - 1));
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
    pageSize,

    fetchSubscriptions,
    refresh,
    updateSearch,
    updateFilters,
    updatePageSize,

    updateSubscriptionInList,
    removeSubscriptionFromList,
    setCurrentPage,
  };
};
