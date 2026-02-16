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

export type SendInvoiceRequest = {
  sendToEmail?: string;
  message?: string;
};

export const invoicesService = {
  // Get all invoices with pagination and filters
  getAll: async (
    page = 1,
    limit = 10,
    search?: string,
    filters: InvoiceFilters = {},
  ): Promise<InvoicePaginatedResponse> => {
    const params: any = { page, limit };

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
      API_ENDPOINTS.INVOICES.BY_ID(id),
    );
    return response.data;
  },

  // Get invoice by job ID (check if job already has invoice)
  getByJobId: async (jobId: string): Promise<Invoice | null> => {
    try {
      const response = await apiClient.get<Invoice>(
        `${API_ENDPOINTS.INVOICES.BASE}/job/${jobId}`,
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  },

  // Check if job already has an invoice
  hasInvoiceForJob: async (jobId: string): Promise<boolean> => {
    try {
      const response = await apiClient.get<{ hasInvoice: boolean }>(
        `${API_ENDPOINTS.INVOICES.BASE}/job/${jobId}/exists`,
      );
      return response.data.hasInvoice;
    } catch {
      return false;
    }
  },

  // Create new invoice
  create: async (data: CreateInvoiceRequest): Promise<Invoice> => {
    const response = await apiClient.post<Invoice>(
      API_ENDPOINTS.INVOICES.BASE,
      data,
    );
    return response.data;
  },

  // Create invoice from job
  createFromJob: async (jobId: string): Promise<Invoice> => {
    const response = await apiClient.post<Invoice>(
      API_ENDPOINTS.INVOICES.CREATE_FROM_JOB(jobId),
    );
    return response.data;
  },

  // Update invoice
  update: async (id: string, data: UpdateInvoiceRequest): Promise<Invoice> => {
    const response = await apiClient.patch<Invoice>(
      API_ENDPOINTS.INVOICES.BY_ID(id),
      data,
    );
    return response.data;
  },

  // Update invoice status
  updateStatus: async (id: string, status: InvoiceStatus): Promise<Invoice> => {
    const response = await apiClient.patch<Invoice>(
      `${API_ENDPOINTS.INVOICES.BY_ID(id)}/status?status=${status}`,
    );
    return response.data;
  },

  convertProformaToStandard: async (id: string): Promise<Invoice> => {
    const response = await apiClient.post<Invoice>(
      API_ENDPOINTS.INVOICES.CONVERT_TO_STANDARD(id),
    );
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(
      API_ENDPOINTS.INVOICES.BY_ID(id),
    );
    return response.data;
  },

  // Search products for invoice
  searchProducts: async (search: string): Promise<ProductSearchResult[]> => {
    const response = await apiClient.get<ProductSearchResult[]>(
      API_ENDPOINTS.INVOICES.SEARCH_PRODUCTS,
      { params: { search } },
    );
    return response.data;
  },

  // Send invoice email with PDF attachment
  sendInvoice: async (id: string, payload: SendInvoiceRequest) => {
    const response = await apiClient.post(
      API_ENDPOINTS.INVOICES.SEND(id),
      payload,
    );
    return response.data;
  },

  // Download PDF (Blob)
  downloadPdf: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(API_ENDPOINTS.INVOICES.PDF(id), {
      responseType: "blob",
    });
    return response.data;
  },
};

export * from "../types/invoice.types";
