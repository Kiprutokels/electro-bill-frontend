import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { quotationsService, Quotation, QuotationFilters, QuotationStatus } from '@/api/services/quotations.service';

interface UseQuotationsOptions {
  initialPage?: number;
  initialLimit?: number;
  initialSearch?: string;
  initialFilters?: QuotationFilters;
}

export const useQuotations = (options: UseQuotationsOptions = {}) => {
  const {
    initialPage = 1,
    initialLimit = 10,
    initialSearch = '',
    initialFilters = {}
  } = options;

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [filters, setFilters] = useState<QuotationFilters>(initialFilters);

  const fetchQuotations = useCallback(async (
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

      const response = await quotationsService.getAll(
        page,
        initialLimit,
        search,
        currentFilters
      );

      setQuotations(response.data || []);
      setTotalPages(response.meta?.totalPages || 1);
      setTotalItems(response.meta?.total || 0);
      setCurrentPage(page);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch quotations';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, searchTerm, filters, initialLimit]);

  const refresh = useCallback(() => {
    fetchQuotations(currentPage, searchTerm, filters, true);
  }, [fetchQuotations, currentPage, searchTerm, filters]);

  const updateSearch = useCallback((search: string) => {
    setSearchTerm(search);
    setCurrentPage(1);
  }, []);

  const updateFilters = useCallback((newFilters: QuotationFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const updateQuotationInList = useCallback((updatedQuotation: Quotation) => {
    setQuotations(prev =>
      prev.map(q => q.id === updatedQuotation.id ? updatedQuotation : q)
    );
  }, []);

  const removeQuotationFromList = useCallback((quotationId: string) => {
    setQuotations(prev => prev.filter(q => q.id !== quotationId));
    setTotalItems(prev => prev - 1);
  }, []);

  const addQuotationToList = useCallback((newQuotation: Quotation) => {
    setQuotations(prev => [newQuotation, ...prev]);
    setTotalItems(prev => prev + 1);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchQuotations(1, searchTerm, filters);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters]);

  return {
    // State
    quotations,
    loading,
    error,
    refreshing,
    currentPage,
    totalPages,
    totalItems,
    searchTerm,
    filters,
    
    // Actions
    fetchQuotations,
    refresh,
    updateSearch,
    updateFilters,
    updateQuotationInList,
    removeQuotationFromList,
    addQuotationToList,
    setCurrentPage,
  };
};
