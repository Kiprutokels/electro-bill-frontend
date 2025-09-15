import apiClient from "../client/axios";
import { API_ENDPOINTS } from "../client/endpoints";
import {
  Transaction,
  TransactionFilters,
  TransactionPaginatedResponse,
  TransactionSummary,
  CustomerStatement,
  TransactionType,
} from "../types/transaction.types";

export const transactionsService = {
  // Get all transactions with pagination and filters
  getAll: async (
    page = 1,
    limit = 10,
    search?: string,
    filters: TransactionFilters = {}
  ): Promise<TransactionPaginatedResponse> => {
    const params: any = {
      page,
      limit,
    };

    if (search) params.search = search;
    if (filters.customerId) params.customerId = filters.customerId;
    if (filters.supplierId) params.supplierId = filters.supplierId;
    if (filters.transactionType) params.transactionType = filters.transactionType;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;

    const response = await apiClient.get(API_ENDPOINTS.TRANSACTIONS.BASE, {
      params,
    });
    return response.data;
  },

  // Get transaction by ID
  getById: async (id: string): Promise<Transaction> => {
    const response = await apiClient.get<Transaction>(
      API_ENDPOINTS.TRANSACTIONS.BY_ID(id)
    );
    return response.data;
  },

  // Get transaction summary
  getSummary: async (
    startDate?: string,
    endDate?: string
  ): Promise<TransactionSummary> => {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await apiClient.get<TransactionSummary>(
      API_ENDPOINTS.TRANSACTIONS.SUMMARY,
      { params }
    );
    return response.data;
  },

  // Get customer statement
  getCustomerStatement: async (
    customerId: string,
    startDate?: string,
    endDate?: string
  ): Promise<CustomerStatement> => {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await apiClient.get<CustomerStatement>(
      API_ENDPOINTS.TRANSACTIONS.CUSTOMER_STATEMENT(customerId),
      { params }
    );
    return response.data;
  },
};

export * from "../types/transaction.types";
