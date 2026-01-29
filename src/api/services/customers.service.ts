import apiClient from "../client/axios";
import { API_ENDPOINTS } from "../client/endpoints";
import { PaginatedResponse, ApiResponse } from "../types/common.types";

export interface CreateCustomerRequest {
  customerCode?: string;
  businessName?: string;
  contactPerson?: string;
  email?: string;
  phone: string;
  alternatePhone?: string;
  taxNumber?: string;
  creditLimit?: number;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  country?: string;
  isActive?: boolean;
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {}

export interface Customer {
  id: string;
  customerCode: string;
  businessName?: string;
  contactPerson?: string;
  email?: string;
  phone: string;
  alternatePhone?: string;
  taxNumber?: string;
  creditLimit: number;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  country: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  currentBalance?: number;
  totalPurchases?: number;
  _count?: {
    invoices: number;
    receipts: number;
    transactions: number;
  };
  invoices?: Array<{
    id: string;
    invoiceNumber: string;
    invoiceDate: string;
    totalAmount: number;
    amountPaid: number;
    status: string;
  }>;
  receipts?: Array<{
    id: string;
    receiptNumber: string;
    paymentDate: string;
    totalAmount: number;
    paymentMethod: {
      name: string;
      type: string;
    };
  }>;
}

export interface CustomerSearchResult {
  id: string;
  customerCode: string;
  businessName?: string;
  contactPerson?: string;
  phone: string;
  email?: string;
}

export const customersService = {
  getCustomers: async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      includeInactive?: boolean;
    } = {},
  ): Promise<PaginatedResponse<Customer>> => {
    const response = await apiClient.get<PaginatedResponse<Customer>>(
      API_ENDPOINTS.CUSTOMERS.BASE,
      { params },
    );
    return response.data;
  },

  searchCustomers: async (
    query: string,
    limit = 20,
  ): Promise<CustomerSearchResult[]> => {
    const response = await apiClient.get<CustomerSearchResult[]>(
      API_ENDPOINTS.CUSTOMERS.SEARCH,
      { params: { q: query, limit } },
    );
    return response.data;
  },

  getCustomerById: async (id: string): Promise<Customer> => {
    const response = await apiClient.get<Customer>(
      API_ENDPOINTS.CUSTOMERS.BY_ID(id),
    );
    return response.data;
  },

  createCustomer: async (data: CreateCustomerRequest): Promise<Customer> => {
    const response = await apiClient.post<Customer>(
      API_ENDPOINTS.CUSTOMERS.BASE,
      data,
    );
    return response.data;
  },

  updateCustomer: async (
    id: string,
    data: UpdateCustomerRequest,
  ): Promise<Customer> => {
    const response = await apiClient.patch<Customer>(
      API_ENDPOINTS.CUSTOMERS.BY_ID(id),
      data,
    );
    return response.data;
  },

  deleteCustomer: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(
      API_ENDPOINTS.CUSTOMERS.BY_ID(id),
    );
    return response.data;
  },

  toggleCustomerStatus: async (id: string): Promise<Customer> => {
    const response = await apiClient.patch<Customer>(
      API_ENDPOINTS.CUSTOMERS.TOGGLE_STATUS(id),
    );
    return response.data;
  },

  getCustomerStatement: async (
    id: string,
    params: {
      startDate?: string;
      endDate?: string;
    } = {},
  ): Promise<any> => {
    const response = await apiClient.get(
      API_ENDPOINTS.CUSTOMERS.STATEMENT(id),
      { params },
    );
    return response.data;
  },

  getCustomersWithOutstandingBalance: async (): Promise<Customer[]> => {
    const response = await apiClient.get<Customer[]>(
      API_ENDPOINTS.CUSTOMERS.OUTSTANDING_BALANCE,
    );
    return response.data;
  },

  getTopCustomers: async (limit = 10): Promise<Customer[]> => {
    const response = await apiClient.get<Customer[]>(
      API_ENDPOINTS.CUSTOMERS.TOP_CUSTOMERS,
      { params: { limit } },
    );
    return response.data;
  },
};
