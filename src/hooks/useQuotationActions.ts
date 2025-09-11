import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { quotationsService, Quotation, QuotationStatus } from '@/api/services/quotations.service';

export const useQuotationActions = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const updateStatus = async (quotation: Quotation, status: QuotationStatus) => {
    setLoading(true);
    try {
      const updatedQuotation = await quotationsService.updateStatus(quotation.id, status);
      toast.success(`Quotation ${status.toLowerCase()} successfully`);
      return updatedQuotation;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update quotation status';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const convertToInvoice = async (quotation: Quotation) => {
    setLoading(true);
    try {
      const invoice = await quotationsService.convertToInvoice(quotation.id);
      toast.success('Quotation converted to invoice successfully');
      navigate('/invoices');
      return invoice;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to convert quotation';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteQuotation = async (quotationId: string) => {
    setLoading(true);
    try {
      await quotationsService.delete(quotationId);
      toast.success('Quotation deleted successfully');
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete quotation';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    updateStatus,
    convertToInvoice,
    deleteQuotation,
  };
};
