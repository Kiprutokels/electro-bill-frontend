import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { productBatchesService, ProductBatch } from '@/api/services/productBatches.service';

interface UseProductBatchesOptions {
  initialPage?: number;
  initialLimit?: number;
  initialSearch?: string;
  includeExpired?: boolean;
  productId?: string;
}

export const useProductBatches = (options: UseProductBatchesOptions = {}) => {
  const {
    initialPage = 1,
    initialLimit = 10,
    initialSearch = '',
    includeExpired = false,
    productId
  } = options;

  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  const fetchBatches = useCallback(async (
    page = currentPage,
    search = searchTerm,
    showRefreshing = false
  ) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await productBatchesService.getAll(
        page,
        initialLimit,
        search,
        includeExpired,
        productId
      );

      setBatches(response.data || []);
      setTotalPages(response.meta?.totalPages || 1);
      setTotalItems(response.meta?.total || 0);
      setCurrentPage(page);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch batches';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, searchTerm, initialLimit, includeExpired, productId]);

  const refresh = useCallback(() => {
    fetchBatches(currentPage, searchTerm, true);
  }, [fetchBatches, currentPage, searchTerm]);

  const updateSearch = useCallback((search: string) => {
    setSearchTerm(search);
    setCurrentPage(1);
  }, []);

  const addBatchToList = useCallback((newBatch: ProductBatch) => {
    setBatches(prev => [newBatch, ...prev]);
    setTotalItems(prev => prev + 1);
  }, []);

  const updateBatchInList = useCallback((updatedBatch: ProductBatch) => {
    setBatches(prev =>
      prev.map(batch => batch.id === updatedBatch.id ? updatedBatch : batch)
    );
  }, []);

  const removeBatchFromList = useCallback((batchId: string) => {
    setBatches(prev => prev.filter(batch => batch.id !== batchId));
    setTotalItems(prev => prev - 1);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchBatches(1, searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  return {
    // State
    batches,
    loading,
    error,
    refreshing,
    currentPage,
    totalPages,
    totalItems,
    searchTerm,
    
    // Actions
    fetchBatches,
    refresh,
    updateSearch,
    addBatchToList,
    updateBatchInList,
    removeBatchFromList,
    setCurrentPage,
  };
};