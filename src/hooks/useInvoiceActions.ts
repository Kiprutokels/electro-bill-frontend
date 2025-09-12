import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { invoicesService, Invoice, InvoiceStatus } from '@/api/services/invoices.service';

export const useInvoiceActions = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const updateStatus = async (invoice: Invoice, status: InvoiceStatus) => {
    setLoading(true);
    try {
      const updatedInvoice = await invoicesService.updateStatus(invoice.id, status);
      toast.success(`Invoice ${status.toLowerCase()} successfully`);
      return updatedInvoice;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update invoice status';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteInvoice = async (invoiceId: string) => {
    setLoading(true);
    try {
      await invoicesService.delete(invoiceId);
      toast.success('Invoice deleted successfully');
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete invoice';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const recordPayment = async (invoice: Invoice) => {
    // Navigate to payment page with invoice context
    navigate(`/payments/new?invoiceId=${invoice.id}&amount=${invoice.totalAmount}`);
  };

  return {
    loading,
    updateStatus,
    deleteInvoice,
    recordPayment,
  };
};
