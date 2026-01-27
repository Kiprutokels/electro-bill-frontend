import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  inventoryService,
  InventoryItem,
  InventoryFilters,
  InventorySummary,
} from '@/api/services/inventory.service';

interface UseInventoryOptions {
  initialPage?: number;
  initialLimit?: number; // page size
  initialSearch?: string;
  initialFilters?: InventoryFilters;
}

export const useInventory = (options: UseInventoryOptions = {}) => {
  const {
    initialPage = 1,
    initialLimit = 10,
    initialSearch = '',
    initialFilters = {},
  } = options;

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState<number>(initialLimit);

  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [filters, setFilters] = useState<InventoryFilters>(initialFilters);

  const fetchInventory = useCallback(
    async (
      page = currentPage,
      limit = pageSize,
      search = searchTerm,
      currentFilters = filters,
      showRefreshing = false,
    ) => {
      try {
        if (showRefreshing) setRefreshing(true);
        else setLoading(true);

        setError(null);

        const effectiveLimit = limit;
        const effectivePage = effectiveLimit < 0 ? 1 : page;

        const [inventoryData, summaryData] = await Promise.all([
          inventoryService.getAll(effectivePage, effectiveLimit, search, currentFilters),
          inventoryService.getSummary(),
        ]);

        setInventory(inventoryData.data || []);
        setTotalPages(inventoryData.meta?.totalPages || 1);
        setTotalItems(inventoryData.meta?.total || 0);
        setCurrentPage(effectivePage);
        setSummary(summaryData);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to fetch inventory';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentPage, pageSize, searchTerm, filters],
  );

  const refresh = useCallback(() => {
    fetchInventory(currentPage, pageSize, searchTerm, filters, true);
  }, [fetchInventory, currentPage, pageSize, searchTerm, filters]);

  const updateSearch = useCallback((search: string) => {
    setSearchTerm(search);
    setCurrentPage(1);
  }, []);

  const updateFilters = useCallback((newFilters: InventoryFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const updatePageSize = useCallback((newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchInventory(1, pageSize, searchTerm, filters);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters, pageSize, fetchInventory]);

  return {
    inventory,
    summary,
    loading,
    error,
    refreshing,
    currentPage,
    totalPages,
    totalItems,
    searchTerm,
    filters,
    pageSize,

    fetchInventory,
    refresh,
    updateSearch,
    updateFilters,
    updatePageSize,
    setCurrentPage,
  };
};