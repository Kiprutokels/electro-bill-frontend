import apiClient from '../client/axios';
import { PaginatedResponse } from '../types/common.types';

export enum RequisitionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PARTIALLY_ISSUED = 'PARTIALLY_ISSUED',
  FULLY_ISSUED = 'FULLY_ISSUED',
  REJECTED = 'REJECTED',
}

export interface RequisitionItem {
  id: string;
  requisitionId: string;
  productId: string;
  quantityRequested: number;
  quantityIssued: number;
  batchId: string | null;
  issuedBy: string | null;
  issuedAt: string | null;
  createdAt: string;
  product: {
    name: string;
    sku: string;
    unitOfMeasure?: string;
  };
  batch?: {
    batchNumber: string;
  };
  issuer?: {
    firstName: string;
    lastName: string;
  };
}

export interface Requisition {
  id: string;
  requisitionNumber: string;
  jobId: string;
  technicianId: string;
  status: RequisitionStatus;
  requestedDate: string;
  approvedDate: string | null;
  approvedBy: string | null;
  notes: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  job: {
    jobNumber: string;
    vehicle?: {
      vehicleReg: string;
    };
  };
  technician: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  items: RequisitionItem[];
  approver?: {
    firstName: string;
    lastName: string;
  };
}

export interface CreateRequisitionItemRequest {
  productId: string;
  quantityRequested: number;
}

export interface CreateRequisitionRequest {
  jobId: string;
  items: CreateRequisitionItemRequest[];
  notes?: string;
}

export interface IssueItemRequest {
  requisitionItemId: string;
  quantityIssued: number;
  batchId: string;
}

export interface RequisitionStatistics {
  pending: number;
  approved: number;
  partiallyIssued: number;
  fullyIssued: number;
  rejected: number;
}

export const requisitionsService = {
  getRequisitions: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: RequisitionStatus;
    technicianId?: string;
    jobId?: string;
  } = {}): Promise<PaginatedResponse<Requisition>> => {
    const response = await apiClient.get<PaginatedResponse<Requisition>>(
      '/requisitions',
      { params }
    );
    return response.data;
  },

  getRequisitionById: async (id: string): Promise<Requisition> => {
    const response = await apiClient.get<Requisition>(`/requisitions/${id}`);
    return response.data;
  },

  createRequisition: async (
    data: CreateRequisitionRequest
  ): Promise<Requisition> => {
    const response = await apiClient.post<Requisition>('/requisitions', data);
    return response.data;
  },

  approveRequisition: async (id: string): Promise<Requisition> => {
    const response = await apiClient.patch<Requisition>(
      `/requisitions/${id}/approve`
    );
    return response.data;
  },

  rejectRequisition: async (
    id: string,
    reason: string
  ): Promise<Requisition> => {
    const response = await apiClient.patch<Requisition>(
      `/requisitions/${id}/reject`,
      { reason }
    );
    return response.data;
  },

  issueItems: async (
    id: string,
    items: IssueItemRequest[]
  ): Promise<Requisition> => {
    const response = await apiClient.patch<Requisition>(
      `/requisitions/${id}/issue`,
      { items }
    );
    return response.data;
  },

  getStatistics: async (): Promise<RequisitionStatistics> => {
    const response = await apiClient.get<RequisitionStatistics>(
      '/requisitions/statistics'
    );
    return response.data;
  },
};