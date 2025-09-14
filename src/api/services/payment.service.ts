import apiClient from "../client/axios";
import { API_ENDPOINTS } from "../client/endpoints";
import {
  PaymentMethod,
  CreatePaymentDto,
  Receipt,
  ReceiptWithDetails,
  OutstandingInvoice,
  PaymentQueryDto,
  PaymentPaginatedResponse,
  PaymentFilters,
} from '@/api/types/payment.types';

export const paymentService = {
  // Get active payment methods
  async getActivePaymentMethods(): Promise<PaymentMethod[]> {
    const response = await apiClient.get(API_ENDPOINTS.PAYMENTS.PAYMENT_METHODS);
    return response.data;
  },

  // Process payment
  async processPayment(data: CreatePaymentDto): Promise<ReceiptWithDetails> {
    const response = await apiClient.post(API_ENDPOINTS.PAYMENTS.PROCESS, data);
    return response.data;
  },

  // Get all receipts
  async getAllReceipts(params?: PaymentQueryDto): Promise<PaymentPaginatedResponse> {
    const response = await apiClient.get(API_ENDPOINTS.PAYMENTS.RECEIPTS, {
      params,
    });
    return response.data;
  },

  // Get receipt by ID
  async getReceiptById(id: string): Promise<ReceiptWithDetails> {
    const response = await apiClient.get(API_ENDPOINTS.PAYMENTS.RECEIPT_BY_ID(id));
    return response.data;
  },

  // Get customer outstanding invoices
  async getCustomerOutstandingInvoices(customerId: string): Promise<OutstandingInvoice[]> {
    const response = await apiClient.get(
      API_ENDPOINTS.PAYMENTS.CUSTOMER_OUTSTANDING(customerId)
    );
    return response.data;
  },

  // Delete receipt
  async deleteReceipt(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete(API_ENDPOINTS.PAYMENTS.RECEIPT_BY_ID(id));
    return response.data;
  },
};

export type {
  PaymentMethod,
  CreatePaymentDto,
  Receipt,
  ReceiptWithDetails,
  OutstandingInvoice,
  PaymentQueryDto,
  PaymentPaginatedResponse,
  PaymentFilters,
};
