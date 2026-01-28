import apiClient from "../client/axios";
import { API_ENDPOINTS } from "../client/endpoints";

export interface SendSmsRequest {
  mobile: string;
  message: string;
  messageType?: string;
  jobId?: string;
  customerId?: string;
}

export interface SendSmsResponse {
  success: boolean;
  messageId?: string;
  networkId?: string;
  statusCode: number;
  statusMessage: string;
  recipient: string;
}

export interface SmsLog {
  id: string;
  recipient: string;
  message: string;
  messageType: string;
  messageId?: string;
  networkId?: string;
  status: string;
  statusCode?: number;
  errorMessage?: string;
  jobId?: string;
  customerId?: string;
  sentAt?: string;
  createdAt: string;
  job?: {
    id: string;
    jobNumber: string;
  };
  customer?: {
    id: string;
    businessName?: string;
    contactPerson?: string;
  };
}

export interface SmsLogResponse {
  data: SmsLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SmsBalance {
  balance: number;
  currency: string;
}

export interface SmsStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
}

export const smsService = {
  send: async (data: SendSmsRequest): Promise<SendSmsResponse> => {
    const response = await apiClient.post<SendSmsResponse>(
      API_ENDPOINTS.SMS.SEND,
      data
    );
    return response.data;
  },

  checkBalance: async (): Promise<SmsBalance> => {
    const response = await apiClient.get<SmsBalance>(
      API_ENDPOINTS.SMS.BALANCE
    );
    return response.data;
  },

  getLogs: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    jobId?: string;
    customerId?: string;
  }): Promise<SmsLogResponse> => {
    const response = await apiClient.get<SmsLogResponse>(
      API_ENDPOINTS.SMS.LOGS,
      { params }
    );
    return response.data;
  },

  getStats: async (): Promise<SmsStats> => {
    const response = await apiClient.get<SmsStats>(API_ENDPOINTS.SMS.STATS);
    return response.data;
  },

  test: async (mobile: string): Promise<SendSmsResponse> => {
    const response = await apiClient.post<SendSmsResponse>(
      API_ENDPOINTS.SMS.TEST,
      { mobile }
    );
    return response.data;
  },
};
