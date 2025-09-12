import apiClient from "../client/axios";
import { API_ENDPOINTS } from "../client/endpoints";
import { ApiResponse } from "../types/common.types";
import {
  Invoice,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  InvoiceFilters,
  InvoiceStatus,
  InvoicePaginatedResponse,
  ProductSearchResult,
} from "../types/invoice.types";

export const invoicesService = {
  // Get all invoices with pagination and filters
  getAll: async (
    page = 1,
    limit = 10,
    search?: string,
    filters: InvoiceFilters = {}
  ): Promise<InvoicePaginatedResponse> => {
    const params: any = {
      page,
      limit,
    };

    if (search) params.search = search;
    if (filters.customerId) params.customerId = filters.customerId;
    if (filters.status) params.status = filters.status;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;

    const response = await apiClient.get(API_ENDPOINTS.INVOICES.BASE, {
      params,
    });
    return response.data;
  },

  // Get invoice by ID
  getById: async (id: string): Promise<Invoice> => {
    const response = await apiClient.get<Invoice>(
      API_ENDPOINTS.INVOICES.BY_ID(id)
    );
    return response.data;
  },

  // Create new invoice
  create: async (data: CreateInvoiceRequest): Promise<Invoice> => {
    const response = await apiClient.post<Invoice>(
      API_ENDPOINTS.INVOICES.BASE,
      data
    );
    return response.data;
  },

  // Update invoice
  update: async (
    id: string,
    data: UpdateInvoiceRequest
  ): Promise<Invoice> => {
    const response = await apiClient.patch<Invoice>(
      API_ENDPOINTS.INVOICES.BY_ID(id),
      data
    );
    return response.data;
  },

  // Update invoice status
  updateStatus: async (
    id: string,
    status: InvoiceStatus
  ): Promise<Invoice> => {
    const response = await apiClient.patch<Invoice>(
      `${API_ENDPOINTS.INVOICES.BY_ID(id)}/status?status=${status}`
    );
    return response.data;
  },

  // Delete invoice
  delete: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(
      API_ENDPOINTS.INVOICES.BY_ID(id)
    );
    return response.data;
  },

  // Search products for invoice
  searchProducts: async (search: string): Promise<ProductSearchResult[]> => {
    const response = await apiClient.get<ProductSearchResult[]>(
      API_ENDPOINTS.INVOICES.SEARCH_PRODUCTS,
      { params: { search } }
    );
    return response.data;
  },
};

// Export types for easier imports
export * from "../types/invoice.types";
