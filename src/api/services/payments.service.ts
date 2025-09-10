import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../client/endpoints';
import { PaginatedResponse } from '../types/common.types';

export interface InvoicePayment {
  invoiceId: string;
  amount: number;
}

export interface CreatePaymentRequest {
  customerId: string;
  paymentMethodId: string;
  totalAmount: number;
  referenceNumber?: string;
  notes?: string;
  invoiceAllocations?: InvoicePayment[];
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  customerId?: string;
  supplierId?: string;
  invoiceId?: string;
  paymentMethodId: string;
  amount: number;
  paymentDate: string;
  referenceNumber?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  customer?: {
    id: string;
    customerCode: string;
    businessName?: string;
    contactPerson?: string;
    phone: string;
    email?: string;
  };
  supplier?: {
    id: string;
    supplierCode: string;
    companyName: string;
    contactPerson?: string;
    phone: string;
    email?: string;
  };
  invoice?: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    amountPaid: number;
    status: string;
    items?: Array<{
      product: {
        name: string;
        sku: string;
      };
    }>;
  };
  paymentMethod: {
    id: string;
    name: string;
    type: string;
  };
  createdByUser: {
    firstName: string;
    lastName: string;
    username: string;
  };
}

export interface OutstandingInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  amountPaid: number;
  status: string;
  outstandingBalance: number;
}

export interface CustomerOutstanding {
  customer: {
    id: string;
    customerCode: string;
    businessName?: string;
    contactPerson?: string;
  };
  totalOutstanding: number;
  outstandingInvoices: OutstandingInvoice[];
}

export interface PaymentSummary {
  totalReceipts: number;
  totalAmount: number;
  paymentMethodSummary: Array<{
    paymentMethod: string;
    type: string;
    count: number;
    amount: number;
  }>;
  dailySummary: Array<{
    date: string;
    count: number;
    amount: number;
  }>;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'CASH' | 'MPESA' | 'BANK_TRANSFER' | 'CARD' | 'CHECK';
  isActive: boolean;
  createdAt: string;
  _count?: {
    receipts: number;
  };
}

export const paymentsService = {
  processPayment: async (data: CreatePaymentRequest): Promise<{
    message: string;
    receipts: Receipt[];
    totalAmount: number;
  }> => {
    const response = await apiClient.post(
      API_ENDPOINTS.PAYMENTS.BASE,
      data
    );
    return response.data;
  },

  getCustomerOutstandingInvoices: async (customerId: string): Promise<CustomerOutstanding> => {
    const response = await apiClient.get<CustomerOutstanding>(
      API_ENDPOINTS.PAYMENTS.CUSTOMER_OUTSTANDING(customerId)
    );
    return response.data;
  },

  getReceipts: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    customerId?: string;
    paymentMethodId?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<PaginatedResponse<Receipt>> => {
    const response = await apiClient.get<PaginatedResponse<Receipt>>(
      API_ENDPOINTS.PAYMENTS.RECEIPTS,
      { params }
    );
    return response.data;
  },

  getReceiptById: async (id: string): Promise<Receipt> => {
    const response = await apiClient.get<Receipt>(
      API_ENDPOINTS.PAYMENTS.RECEIPT_BY_ID(id)
    );
    return response.data;
  },

  getReceiptsByNumber: async (receiptNumber: string): Promise<{
    message: string;
    receipts: Receipt[];
    totalAmount: number;
  }> => {
    const response = await apiClient.get(
      API_ENDPOINTS.PAYMENTS.RECEIPT_BY_NUMBER(receiptNumber)
    );
    return response.data;
  },

  getPaymentSummary: async (params: {
    startDate?: string;
    endDate?: string;
  } = {}): Promise<PaymentSummary> => {
    const response = await apiClient.get<PaymentSummary>(
      API_ENDPOINTS.PAYMENTS.SUMMARY,
      { params }
    );
    return response.data;
  },

  // Payment Methods
  getPaymentMethods: async (includeInactive = false): Promise<PaymentMethod[]> => {
    const response = await apiClient.get<PaymentMethod[]>(
      API_ENDPOINTS.PAYMENT_METHODS.BASE,
      { params: { includeInactive } }
    );
    return response.data;
  },

  createPaymentMethod: async (data: {
    name: string;
    type: 'CASH' | 'MPESA' | 'BANK_TRANSFER' | 'CARD' | 'CHECK';
    isActive?: boolean;
  }): Promise<PaymentMethod> => {
    const response = await apiClient.post<PaymentMethod>(
      API_ENDPOINTS.PAYMENT_METHODS.BASE,
      data
    );
    return response.data;
  },

  updatePaymentMethod: async (id: string, data: Partial<{
    name: string;
    type: 'CASH' | 'MPESA' | 'BANK_TRANSFER' | 'CARD' | 'CHECK';
    isActive: boolean;
  }>): Promise<PaymentMethod> => {
    const response = await apiClient.patch<PaymentMethod>(
      API_ENDPOINTS.PAYMENT_METHODS.BY_ID(id),
      data
    );
    return response.data;
  },

  deletePaymentMethod: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.PAYMENT_METHODS.BY_ID(id));
  },

  togglePaymentMethodStatus: async (id: string): Promise<PaymentMethod> => {
    const response = await apiClient.patch<PaymentMethod>(
      API_ENDPOINTS.PAYMENT_METHODS.TOGGLE_STATUS(id)
    );
    return response.data;
  },
};
