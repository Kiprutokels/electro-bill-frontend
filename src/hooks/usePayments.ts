import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { paymentService, Receipt, PaymentFilters } from '@/api/services/payment.service';

interface UsePaymentsOptions {
  initialPage?: number;
  initialLimit?: number;
  initialSearch?: string;
  initialFilters?: PaymentFilters;
}

export const usePayments = (options: UsePaymentsOptions = {}) => {
  const {
    initialPage = 1,
    initialLimit = 10,
    initialSearch = '',
    initialFilters = {}
  } = options;

  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [filters, setFilters] = useState<PaymentFilters>(initialFilters);

  const fetchReceipts = useCallback(async (
    page = currentPage,
    search = searchTerm,
    currentFilters = filters,
    showRefreshing = false
  ) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const params = {
        page,
        limit: initialLimit,
        search: search || undefined,
        ...currentFilters,
      };

      const data = await paymentService.getAllReceipts(params);

      setReceipts(data.data || []);
      setTotalPages(data.meta?.totalPages || 1);
      setTotalItems(data.meta?.total || 0);
      setCurrentPage(page);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch receipts';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, searchTerm, filters, initialLimit]);

  const refresh = useCallback(() => {
    fetchReceipts(currentPage, searchTerm, filters, true);
  }, [fetchReceipts, currentPage, searchTerm, filters]);

  const updateSearch = useCallback((search: string) => {
    setSearchTerm(search);
    setCurrentPage(1);
  }, []);

  const updateFilters = useCallback((newFilters: PaymentFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const updateReceiptInList = useCallback((updatedReceipt: Receipt) => {
    setReceipts(prev => prev.map(receipt => 
      receipt.id === updatedReceipt.id ? updatedReceipt : receipt
    ));
  }, []);

  const removeReceiptFromList = useCallback((receiptId: string) => {
    setReceipts(prev => prev.filter(receipt => receipt.id !== receiptId));
    setTotalItems(prev => Math.max(0, prev - 1));
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchReceipts(1, searchTerm, filters);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters]);

  return {
    // State
    receipts,
    loading,
    error,
    refreshing,
    currentPage,
    totalPages,
    totalItems,
    searchTerm,
    filters,
    
    // Actions
    fetchReceipts,
    refresh,
    updateSearch,
    updateFilters,
    updateReceiptInList,
    removeReceiptFromList,
    setCurrentPage,
  };
};
