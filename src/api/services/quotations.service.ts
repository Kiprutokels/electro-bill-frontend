import apiClient from "../client/axios";
import { API_ENDPOINTS } from "../client/endpoints";
import { ApiResponse } from "../types/common.types";
import {
  Quotation,
  CreateQuotationRequest,
  UpdateQuotationRequest,
  QuotationFilters,
  QuotationStatus,
  QuotationPaginatedResponse,
  ProductSearchResult,
} from "../types/quotation.types";

export const quotationsService = {
  // Get all quotations with pagination and filters
  getAll: async (
    page = 1,
    limit = 10,
    search?: string,
    filters: QuotationFilters = {}
  ): Promise<QuotationPaginatedResponse> => {
    const params: any = {
      page,
      limit,
    };

    if (search) params.search = search;
    if (filters.customerId) params.customerId = filters.customerId;
    if (filters.status) params.status = filters.status;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;

    const response = await apiClient.get(API_ENDPOINTS.QUOTATIONS.BASE, {
      params,
    });
    return response.data;
  },

  // Get quotation by ID
  getById: async (id: string): Promise<Quotation> => {
    const response = await apiClient.get<Quotation>(
      API_ENDPOINTS.QUOTATIONS.BY_ID(id)
    );
    return response.data;
  },

  // Create new quotation
  create: async (data: CreateQuotationRequest): Promise<Quotation> => {
    const response = await apiClient.post<Quotation>(
      API_ENDPOINTS.QUOTATIONS.BASE,
      data
    );
    return response.data;
  },

  // Update quotation
  update: async (
    id: string,
    data: UpdateQuotationRequest
  ): Promise<Quotation> => {
    const response = await apiClient.patch<Quotation>(
      API_ENDPOINTS.QUOTATIONS.BY_ID(id),
      data
    );
    return response.data;
  },

  // Update quotation status
  updateStatus: async (
    id: string,
    status: QuotationStatus
  ): Promise<Quotation> => {
    const response = await apiClient.patch<Quotation>(
      `${API_ENDPOINTS.QUOTATIONS.BY_ID(id)}/status?status=${status}`
    );
    return response.data;
  },

  // Convert quotation to invoice
  convertToInvoice: async (id: string): Promise<any> => {
    const response = await apiClient.post<any>(
      `${API_ENDPOINTS.QUOTATIONS.BY_ID(id)}/convert-to-invoice`
    );
    return response.data;
  },

  // Delete quotation
  delete: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(
      API_ENDPOINTS.QUOTATIONS.BY_ID(id)
    );
    return response.data;
  },

  // Search products for quotation
  searchProducts: async (search: string): Promise<ProductSearchResult[]> => {
    const response = await apiClient.get<ProductSearchResult[]>(
      `${API_ENDPOINTS.QUOTATIONS.BASE}/search-products`,
      { params: { search } }
    );
    return response.data;
  },
};

// Export types for easier imports
export * from "../types/quotation.types";
