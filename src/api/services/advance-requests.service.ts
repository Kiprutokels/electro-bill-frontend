import apiClient from '../client/axios';
import { PaginatedResponse } from '../types/common.types';

export enum AdvanceRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DISBURSED = 'DISBURSED',
  REJECTED = 'REJECTED',
}

export enum AdvanceRequestType {
  TRANSPORT = 'TRANSPORT',
  TOOLS = 'TOOLS',
  ACCOMMODATION = 'ACCOMMODATION',
  MEALS = 'MEALS',
  OTHER = 'OTHER',
}

export enum DisbursementMethod {
  CASH = 'CASH',
  MPESA = 'MPESA',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export interface AdvanceRequest {
  id: string;
  requestNumber: string;
  jobId: string;
  technicianId: string;
  requestType: AdvanceRequestType;
  amount: number;
  status: AdvanceRequestStatus;
  description: string;
  justification: string | null;
  requestedDate: string;
  approvedDate: string | null;
  approvedBy: string | null;
  disbursedDate: string | null;
  disbursedBy: string | null;
  disbursementMethod: DisbursementMethod | null;
  referenceNumber: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  job: {
    jobNumber: string;
    vehicle?: {
      vehicleReg: string;
    };
    customer: {
      businessName: string | null;
      contactPerson: string | null;
    };
  };
  technician: {
    user: {
      firstName: string;
      lastName: string;
      phone: string | null;
    };
  };
  approver?: {
    firstName: string;
    lastName: string;
  };
  disburser?: {
    firstName: string;
    lastName: string;
  };
}

export interface CreateAdvanceRequestRequest {
  jobId: string;
  requestType: AdvanceRequestType;
  amount: number;
  description: string;
  justification?: string;
}

export interface DisburseAdvanceRequest {
  disbursementMethod: DisbursementMethod;
  referenceNumber?: string;
}

export interface AdvanceRequestStatistics {
  pending: number;
  approved: number;
  disbursed: number;
  rejected: number;
  totalRequested: number;
  totalDisbursed: number;
}

export const advanceRequestsService = {
  getAdvanceRequests: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: AdvanceRequestStatus;
    technicianId?: string;
    jobId?: string;
  } = {}): Promise<PaginatedResponse<AdvanceRequest>> => {
    const response = await apiClient.get<PaginatedResponse<AdvanceRequest>>(
      '/advance-requests',
      { params }
    );
    return response.data;
  },

  getAdvanceRequestById: async (id: string): Promise<AdvanceRequest> => {
    const response = await apiClient.get<AdvanceRequest>(`/advance-requests/${id}`);
    return response.data;
  },

  createAdvanceRequest: async (
    data: CreateAdvanceRequestRequest
  ): Promise<AdvanceRequest> => {
    const response = await apiClient.post<AdvanceRequest>('/advance-requests', data);
    return response.data;
  },

  approveAdvanceRequest: async (id: string): Promise<AdvanceRequest> => {
    const response = await apiClient.patch<AdvanceRequest>(
      `/advance-requests/${id}/approve`
    );
    return response.data;
  },

  rejectAdvanceRequest: async (
    id: string,
    reason: string
  ): Promise<AdvanceRequest> => {
    const response = await apiClient.patch<AdvanceRequest>(
      `/advance-requests/${id}/reject`,
      { reason }
    );
    return response.data;
  },

  disburseAdvanceRequest: async (
    id: string,
    data: DisburseAdvanceRequest
  ): Promise<AdvanceRequest> => {
    const response = await apiClient.patch<AdvanceRequest>(
      `/advance-requests/${id}/disburse`,
      data
    );
    return response.data;
  },

  getStatistics: async (): Promise<AdvanceRequestStatistics> => {
    const response = await apiClient.get<AdvanceRequestStatistics>(
      '/advance-requests/statistics'
    );
    return response.data;
  },
};
