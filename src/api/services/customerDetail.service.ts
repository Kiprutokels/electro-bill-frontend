import apiClient from "../client/axios";
import { API_ENDPOINTS } from "../client/endpoints";
import { CustomerDetailResponse } from "../types/customerDetail.types";

export const customerDetailService = {
  getByCustomerId: async (
    customerId: string,
    params?: {
      invoicesLimit?: number;
      receiptsLimit?: number;
      transactionsLimit?: number;
      subscriptionsLimit?: number;
      jobsLimit?: number;
      includeInvoiceItems?: boolean;
    }
  ): Promise<CustomerDetailResponse> => {
    const response = await apiClient.get<CustomerDetailResponse>(
      API_ENDPOINTS.CUSTOMERS.CUSTOMER_DETAIL(customerId),
      { params }
    );
    return response.data;
  },
};
