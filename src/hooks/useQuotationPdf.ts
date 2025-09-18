import { useState } from 'react';
import { toast } from 'sonner';

export const useQuotationPdf = () => {
  const [downloading, setDownloading] = useState(false);

  const downloadPdf = async (quotationId: string, quotationNumber: string) => {
    setDownloading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/quotations/${quotationId}/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quotation-${quotationNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  return { downloadPdf, downloading };
};
