import apiClient from '../client/axios';
import { PaginatedResponse } from '../types/common.types';

export interface Transaction {
  id: string;
  transactionNumber: string;
  transactionType: 'INVOICE' | 'RECEIPT' | 'PURCHASE' | 'PAYMENT' | 'ADJUSTMENT';
  referenceId?: string;
  customerId?: string;
  supplierId?: string;
  debit: number;
  credit: number;
  balanceBf: number; // Balance Brought Forward
  balanceCf: number; // Balance Carry Forward
  transactionDate: string;
  description?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  customer?: {
    id: string;
    customerCode: string;
    businessName?: string;
    contactPerson?: string;
  };
  supplier?: {
    id: string;
    supplierCode: string;
    companyName: string;
    contactPerson?: string;
  };
  createdByUser: {
    firstName: string;
    lastName: string;
    username: string;
  };
}

export interface TransactionSummary {
  totalTransactions: number;
  totalDebits: number;
  totalCredits: number;
  netAmount: number;
  typeBreakdown: Array<{
    type: string;
    count: number;
    debitAmount: number;
    creditAmount: number;
  }>;
}

export const transactionsService = {
  getTransactions: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    transactionType?: string;
    customerId?: string;
    supplierId?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<PaginatedResponse<Transaction>> => {
    const response = await apiClient.get<PaginatedResponse<Transaction>>(
      '/transactions',
      { params }
    );
    return response.data;
  },

  getTransactionById: async (id: string): Promise<Transaction> => {
    const response = await apiClient.get<Transaction>(`/transactions/${id}`);
    return response.data;
  },

  getCustomerTransactions: async (customerId: string, params: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<PaginatedResponse<Transaction>> => {
    const response = await apiClient.get<PaginatedResponse<Transaction>>(
      `/transactions/customer/${customerId}`,
      { params }
    );
    return response.data;
  },

  getSupplierTransactions: async (supplierId: string, params: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<PaginatedResponse<Transaction>> => {
    const response = await apiClient.get<PaginatedResponse<Transaction>>(
      `/transactions/supplier/${supplierId}`,
      { params }
    );
    return response.data;
  },

  getTransactionSummary: async (params: {
    startDate?: string;
    endDate?: string;
    customerId?: string;
    supplierId?: string;
  } = {}): Promise<TransactionSummary> => {
    const response = await apiClient.get<TransactionSummary>(
      '/transactions/summary',
      { params }
    );
    return response.data;
  },

  createManualTransaction: async (data: {
    transactionType: 'ADJUSTMENT' | 'PAYMENT';
    customerId?: string;
    supplierId?: string;
    debit: number;
    credit: number;
    transactionDate: string;
    description: string;
    notes?: string;
  }): Promise<Transaction> => {
    const response = await apiClient.post<Transaction>('/transactions', data);
    return response.data;
  },
};
