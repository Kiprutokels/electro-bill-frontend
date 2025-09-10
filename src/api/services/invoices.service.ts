import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../client/endpoints';
import { PaginatedResponse } from '../types/common.types';

export interface CreateInvoiceItemRequest {
  productId: string;
  description?: string;
  quantity: number;
  unitPrice?: number;
  discountPercentage?: number;
}

export interface CreateInvoiceRequest {
  invoiceNumber?: string;
  customerId: string;
  invoiceDate?: string;
  dueDate: string;
  paymentTerms?: string;
  notes?: string;
  discountPercentage?: number;
  items: CreateInvoiceItemRequest[];
}

export interface UpdateInvoiceRequest {
  invoiceNumber?: string;
  customerId?: string;
  invoiceDate?: string;
  dueDate?: string;
  paymentTerms?: string;
  notes?: string;
  discountPercentage?: number;
  status?: 'DRAFT' | 'SENT' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED';
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercentage: number;
  lineTotal: number;
  createdAt: string;
  product: {
    name: string;
    sku: string;
    category?: {
      name: string;
    };
    brand?: {
      name: string;
    };
  };
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED';
  paymentTerms?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    customerCode: string;
    businessName?: string;
    contactPerson?: string;
    phone: string;
    email?: string;
  };
  items: InvoiceItem[];
  receipts?: Array<{
    id: string;
    receiptNumber: string;
    amount: number;
    paymentDate: string;
    paymentMethod: {
      name: string;
      type: string;
    };
  }>;
  createdByUser: {
    firstName: string;
    lastName: string;
    username: string;
  };
  _count?: {
    receipts: number;
  };
}

export interface InvoiceSummary {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  statusSummary: Array<{
    status: string;
    count: number;
    amount: number;
  }>;
}

export const invoicesService = {
  getInvoices: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<PaginatedResponse<Invoice>> => {
    const response = await apiClient.get<PaginatedResponse<Invoice>>(
      API_ENDPOINTS.INVOICES.BASE,
      { params }
    );
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

  updateInvoiceStatus: async (id: string, status: string): Promise<Invoice> => {
    const response = await apiClient.patch<Invoice>(
      API_ENDPOINTS.INVOICES.STATUS(id),
      { status }
    );
    return response.data;
  },

  cancelInvoice: async (id: string): Promise<Invoice> => {
    const response = await apiClient.delete<Invoice>(
      API_ENDPOINTS.INVOICES.CANCEL(id)
    );
    return response.data;
  },

  getInvoiceSummary: async (params: {
    startDate?: string;
    endDate?: string;
  } = {}): Promise<InvoiceSummary> => {
    const response = await apiClient.get<InvoiceSummary>(
      API_ENDPOINTS.INVOICES.SUMMARY,
      { params }
    );
    return response.data;
  },
};
