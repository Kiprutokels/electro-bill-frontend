import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { invoicesService, Invoice, InvoiceFilters, InvoiceStatus } from '@/api/services/invoices.service';

interface UseInvoicesOptions {
  initialPage?: number;
  initialLimit?: number;
  initialSearch?: string;
  initialFilters?: InvoiceFilters;
}

export const useInvoices = (options: UseInvoicesOptions = {}) => {
  const {
    initialPage = 1,
    initialLimit = 10,
    initialSearch = '',
    initialFilters = {}
  } = options;

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [filters, setFilters] = useState<InvoiceFilters>(initialFilters);

  const fetchInvoices = useCallback(async (
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

      const response = await invoicesService.getAll(
        page,
        initialLimit,
        search,
        currentFilters
      );

      setInvoices(response.data || []);
      setTotalPages(response.meta?.totalPages || 1);
      setTotalItems(response.meta?.total || 0);
      setCurrentPage(page);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch invoices';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, searchTerm, filters, initialLimit]);

  const refresh = useCallback(() => {
    fetchInvoices(currentPage, searchTerm, filters, true);
  }, [fetchInvoices, currentPage, searchTerm, filters]);

  const updateSearch = useCallback((search: string) => {
    setSearchTerm(search);
    setCurrentPage(1);
  }, []);

  const updateFilters = useCallback((newFilters: InvoiceFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const updateInvoiceInList = useCallback((updatedInvoice: Invoice) => {
    setInvoices(prev =>
      prev.map(i => i.id === updatedInvoice.id ? updatedInvoice : i)
    );
  }, []);

  const removeInvoiceFromList = useCallback((invoiceId: string) => {
    setInvoices(prev => prev.filter(i => i.id !== invoiceId));
    setTotalItems(prev => prev - 1);
  }, []);

  const addInvoiceToList = useCallback((newInvoice: Invoice) => {
    setInvoices(prev => [newInvoice, ...prev]);
    setTotalItems(prev => prev + 1);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchInvoices(1, searchTerm, filters);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters]);

  return {
    // State
    invoices,
    loading,
    error,
    refreshing,
    currentPage,
    totalPages,
    totalItems,
    searchTerm,
    filters,
    
    // Actions
    fetchInvoices,
    refresh,
    updateSearch,
    updateFilters,
    updateInvoiceInList,
    removeInvoiceFromList,
    addInvoiceToList,
    setCurrentPage,
  };
};
