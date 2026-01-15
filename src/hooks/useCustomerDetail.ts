import { useCallback, useEffect, useState } from "react";
import { customerDetailService } from "@/api/services/customerDetail.service";
import { CustomerDetailResponse } from "@/api/types/customerDetail.types";
import { toast } from "sonner";

export const useCustomerDetail = (customerId: string) => {
  const [data, setData] = useState<CustomerDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!customerId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await customerDetailService.getByCustomerId(customerId, {
        invoicesLimit: 50,
        receiptsLimit: 50,
        transactionsLimit: 200,
        subscriptionsLimit: 200,
        includeInvoiceItems: true,
      });
      setData(res);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to load customer detail";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return {
    data,
    loading,
    error,
    refresh: fetchDetail,
  };
};