import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { transactionsService, TransactionSummary } from '@/api/services/transactions.service';

export const useTransactionSummary = (startDate?: string, endDate?: string) => {
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await transactionsService.getSummary(startDate, endDate);
      setSummary(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch transaction summary';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [startDate, endDate]);

  return {
    summary,
    loading,
    error,
    refresh: fetchSummary,
  };
};
