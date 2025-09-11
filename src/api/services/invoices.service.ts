import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../client/endpoints';
import { ApiResponse } from '../types/common.types';

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId: string;
  batchId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercentage: number;
  product: {
    id: string;
    name: string;
    sku: string;
    sellingPrice: number;
    unitOfMeasure: string;
    category: {
      name: string;
    };
    brand?: {
      name: string;
    };
  };
  batch?: {
    id: string;
    batchNumber: string;
    buyingPrice: number;
  };
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  quotationId?: string;
  customerId: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  paymentTerms?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    customerCode: string;
    businessName: string;
    contactPerson: string;
    phone: string;
    email: string;
  };
  quotation?: {
    id: string;
    quotationNumber: string;
    quotationDate: string;
  };
  createdByUser: {
    id: string;
    firstName: string;
    lastName: string;
  };
  items: InvoiceItem[];
  receiptItems?: Array<{
    receipt: {
      id: string;
      receiptNumber: string;
      paymentDate: string;
      totalAmount: number;
    };
  }>;
}

export interface CreateInvoiceRequest {
  quotationId?: string;
  customerId: string;
  dueDate?: string;
  paymentTerms?: string;
  notes?: string;
  discountAmount?: number;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

export interface UpdateInvoiceRequest {
  dueDate?: string;
  paymentTerms?: string;
  notes?: string;
  discountAmount?: number;
  items?: Array<{
    productId: string;
    quantity: number;
  }>;
}

export interface InvoiceFilters {
  customerId?: string;
  status?: InvoiceStatus;
  startDate?: string;
  endDate?: string;
}

export const invoicesService = {
  getInvoices: async (
    page = 1,
    limit = 10,
    search?: string,
    filters: InvoiceFilters = {}
  ): Promise<{
    data: Invoice[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> => {
    const params = {
      page,
      limit,
      search,
      ...filters,
    };
    
    const response = await apiClient.get(API_ENDPOINTS.INVOICES.BASE, { params });
    return response.data;
  },

  getInvoiceById: async (id: string): Promise<Invoice> => {
    const response = await apiClient.get<Invoice>(
      API_ENDPOINTS.INVOICES.BY_ID(id)
    );
    return response.data;
  },

  createInvoice: async (data: CreateInvoiceRequest): Promise<Invoice> => {
    const response = await apiClient.post<Invoice>(
      API_ENDPOINTS.INVOICES.BASE,
      data
    );
    return response.data;
  },

  updateInvoice: async (id: string, data: UpdateInvoiceRequest): Promise<Invoice> => {
    const response = await apiClient.patch<Invoice>(
      API_ENDPOINTS.INVOICES.BY_ID(id),
      data
    );
    return response.data;
  },

  updateInvoiceStatus: async (id: string, status: InvoiceStatus): Promise<Invoice> => {
    const response = await apiClient.patch<Invoice>(
      API_ENDPOINTS.INVOICES.STATUS(id),
      null,
      { params: { status } }
    );
    return response.data;
  },

  deleteInvoice: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(
      API_ENDPOINTS.INVOICES.BY_ID(id)
    );
    return response.data;
  },

  searchProducts: async (search: string): Promise<any[]> => {
    const response = await apiClient.get<any[]>(
      API_ENDPOINTS.INVOICES.SEARCH_PRODUCTS,
      { params: { search } }
    );
    return response.data;
  },
};
