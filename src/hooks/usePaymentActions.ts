import { useState } from 'react';
import { toast } from 'sonner';
import { paymentService } from '@/api/services/payment.service';

export const usePaymentActions = () => {
  const [loading, setLoading] = useState(false);

  const deleteReceipt = async (receiptId: string) => {
    setLoading(true);
    try {
      await paymentService.deleteReceipt(receiptId);
      toast.success('Receipt deleted successfully');
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete receipt';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    deleteReceipt,
  };
};
