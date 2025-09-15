import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  transactionsService, 
  Transaction, 
  TransactionFilters 
} from '@/api/services/transactions.service';

interface UseTransactionsOptions {
  initialPage?: number;
  initialLimit?: number;
  initialSearch?: string;
  initialFilters?: TransactionFilters;
}

export const useTransactions = (options: UseTransactionsOptions = {}) => {
  const {
    initialPage = 1,
    initialLimit = 10,
    initialSearch = '',
    initialFilters = {}
  } = options;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [filters, setFilters] = useState<TransactionFilters>(initialFilters);

  const fetchTransactions = useCallback(async (
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

      const response = await transactionsService.getAll(
        page,
        initialLimit,
        search,
        currentFilters
      );

      setTransactions(response.data || []);
      setTotalPages(response.meta?.totalPages || 1);
      setTotalItems(response.meta?.total || 0);
      setCurrentPage(page);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch transactions';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, searchTerm, filters, initialLimit]);

  const refresh = useCallback(() => {
    fetchTransactions(currentPage, searchTerm, filters, true);
  }, [fetchTransactions, currentPage, searchTerm, filters]);

  const updateSearch = useCallback((search: string) => {
    setSearchTerm(search);
    setCurrentPage(1);
  }, []);

  const updateFilters = useCallback((newFilters: TransactionFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchTransactions(1, searchTerm, filters);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters]);

  return {
    // State
    transactions,
    loading,
    error,
    refreshing,
    currentPage,
    totalPages,
    totalItems,
    searchTerm,
    filters,
    
    // Actions
    fetchTransactions,
    refresh,
    updateSearch,
    updateFilters,
    setCurrentPage,
  };
};
