import apiClient from '../client/axios';
import { ApiResponse } from '../types/common.types';

export interface WarehouseLocation {
  id: string;
  code: string;
  name: string;
  description?: string;
  city?: string;
  country?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    inventory: number;
    batches: number;
  };
}

export interface CreateLocationRequest {
  code: string;
  name: string;
  description?: string;
  city?: string;
  country?: string;
  isActive?: boolean;
}

export interface UpdateLocationRequest {
  name?: string;
  description?: string;
  city?: string;
  country?: string;
  isActive?: boolean;
}

export interface TransferInventoryRequest {
  productId: string;
  batchId?: string;
  fromLocation: string;
  toLocation: string;
  quantity: number;
  deviceImeis?: { imeiNumber: string }[];
  reason: string;
}

export interface TransferInventoryResponse {
  success: boolean;
  message: string;
  transfer: {
    productId: string;
    productName: string;
    fromLocation: string;
    toLocation: string;
    quantity: number;
    isImeiTracked: boolean;
    deviceCount: number;
  };
}

export const locationsService = {
  getAll: async (includeInactive = false): Promise<WarehouseLocation[]> => {
    const res = await apiClient.get<WarehouseLocation[]>('/locations', {
      params: { includeInactive },
    });
    return res.data;
  },

  getById: async (id: string): Promise<WarehouseLocation> => {
    const res = await apiClient.get<WarehouseLocation>(`/locations/${id}`);
    return res.data;
  },

  create: async (data: CreateLocationRequest): Promise<WarehouseLocation> => {
    const res = await apiClient.post<WarehouseLocation>('/locations', data);
    return res.data;
  },

  update: async (id: string, data: UpdateLocationRequest): Promise<WarehouseLocation> => {
    const res = await apiClient.patch<WarehouseLocation>(`/locations/${id}`, data);
    return res.data;
  },

  toggleStatus: async (id: string): Promise<WarehouseLocation> => {
    const res = await apiClient.patch<WarehouseLocation>(`/locations/${id}/toggle-status`);
    return res.data;
  },

  transferInventory: async (data: TransferInventoryRequest): Promise<TransferInventoryResponse> => {
    const res = await apiClient.post<TransferInventoryResponse>('/locations/transfer', data);
    return res.data;
  },
};
