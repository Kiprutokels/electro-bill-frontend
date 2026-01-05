import apiClient from '../client/axios';

export interface ProcessingFeeTransaction {
  id: string;
  receiptNumber: string;
  customerCode: string;
  businessName: string;
  transactionAmount: number;
  feeAmount: number;
  feePercentage: number;
  transactionDate: string;
  isCleared: boolean;
  clearedAt?: string;
  settlementNumber?: string;
}

export interface ProcessingFeeStats {
  pending: {
    totalFees: number;
    totalTransactions: number;
    count: number;
  };
  cleared: {
    totalFees: number;
    totalTransactions: number;
    count: number;
  };
  thisMonth: {
    totalFees: number;
    count: number;
  };
  recentSettlements: any[];
}

export interface Settlement {
  id: string;
  settlementNumber: string;
  totalFeeAmount: number;
  transactionCount: number;
  periodStart: string;
  periodEnd: string;
  settledAt: string;
  settledByUser: {
    firstName: string;
    lastName: string;
  };
  notes?: string;
}

class ProcessingFeesService {
  async getDashboardStats(): Promise<ProcessingFeeStats> {
    const response = await apiClient.get('/processing-fees/dashboard-stats');
    return response.data;
  }

  async getAllFees(params?: {
    page?: number;
    limit?: number;
    isCleared?: boolean;
    startDate?: string;
    endDate?: string;
    customerId?: string;
  }) {
    const response = await apiClient.get('/processing-fees/transactions', { params });
    return response.data;
  }

  async getPendingSummary() {
    const response = await apiClient.get('/processing-fees/pending-summary');
    return response.data;
  }

  async settleFees(data: {
    periodStart: string;
    periodEnd: string;
    notes?: string;
  }) {
    const response = await apiClient.post('/processing-fees/settle', data);
    return response.data;
  }

  async getAllSettlements(page = 1, limit = 20) {
    const response = await apiClient.get('/processing-fees/settlements', {
      params: { page, limit },
    });
    return response.data;
  }

  async getSettlementById(id: string) {
    const response = await apiClient.get(`/processing-fees/settlements/${id}`);
    return response.data;
  }
}

export const processingFeesService = new ProcessingFeesService();
