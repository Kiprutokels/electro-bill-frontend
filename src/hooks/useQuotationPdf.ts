import { useState } from 'react';
import { toast } from 'sonner';
import { quotationsService } from  '@/api/services/quotations.service';

export const useQuotationPdf = () => {
  const [downloading, setDownloading] = useState(false);

  const downloadPdf = async (quotationId: string, quotationNumber: string) => {
    setDownloading(true);
    try {
      // Use the service method (Axios with responseType: 'blob')
      const blob = await quotationsService.downloadPdf(quotationId);

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quotation-${quotationNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('PDF downloaded successfully');
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error(error.message || 'Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  return { downloadPdf, downloading };
};
