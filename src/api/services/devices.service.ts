import apiClient from '../client/axios';
import {
  BulkCreateDevicesForBatchRequest,
  BulkCreateDevicesForBatchResponse,
  Device,
  DeviceHistoryResponse,
  DeviceStatus,
} from '../types/device.types';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UpdateDeviceRequest {
  serialNumber?: string;
  macAddress?: string;
  simCardIccid?: string;
  simCardImsi?: string;
  installationAddress?: string;
  installationPerson?: string;
  installationCompany?: string;
  notes?: string;
}

export interface IssueDeviceRequest {
  requisitionItemId: string;
  issuedBy: string; // user uuid
}

export interface ActivateDeviceRequest {
  simCardIccid?: string;
  simCardImsi?: string;
  macAddress?: string;
  installationAddress?: string;
  installationPerson?: string;
  installationCompany?: string;
}

export const devicesService = {
  bulkCreateForBatch: async (
    batchId: string,
    payload: BulkCreateDevicesForBatchRequest,
  ): Promise<BulkCreateDevicesForBatchResponse> => {
    console.log('[devicesService] bulkCreateForBatch:', { batchId, count: payload.devices?.length });
    const res = await apiClient.post<BulkCreateDevicesForBatchResponse>(
      `/devices/batch/${batchId}/bulk`,
      payload,
    );
    return res.data;
  },

  list: async (params: {
    page: number;
    limit: number; // max 100 in UI
    search?: string;
    status?: DeviceStatus;
    productId?: string;
    batchId?: string;
  }): Promise<PaginatedResponse<Device>> => {
    console.log('[devicesService] list:', params);
    const res = await apiClient.get<PaginatedResponse<Device>>(`/devices`, { params });
    return res.data;
  },

  getAvailableDevices: async (params: {
    productId: string;
    batchId?: string;
  }): Promise<Device[]> => {
    console.log('[devicesService] getAvailableDevices:', params);

    // For now: take 100 and let user filter; in practice most batches are manageable.
    const res = await apiClient.get<PaginatedResponse<Device>>(`/devices`, {
      params: {
        page: 1,
        limit: 100,
        status: 'AVAILABLE',
        productId: params.productId,
        ...(params.batchId ? { batchId: params.batchId } : {}),
      },
    });

    return res.data?.data ?? [];
  },

  getByImei: async (imeiNumber: string): Promise<Device> => {
    console.log('[devicesService] getByImei:', imeiNumber);
    const res = await apiClient.get<Device>(`/devices/${encodeURIComponent(imeiNumber)}`);
    return res.data;
  },

  history: async (imeiNumber: string): Promise<DeviceHistoryResponse> => {
    console.log('[devicesService] history:', imeiNumber);
    const res = await apiClient.get<DeviceHistoryResponse>(
      `/devices/${encodeURIComponent(imeiNumber)}/history`,
    );
    return res.data;
  },

  update: async (imeiNumber: string, payload: UpdateDeviceRequest): Promise<Device> => {
    console.log('[devicesService] update:', { imeiNumber, payload });
    const res = await apiClient.patch<Device>(
      `/devices/${encodeURIComponent(imeiNumber)}`,
      payload,
    );
    return res.data;
  },

  issue: async (imeiNumber: string, payload: IssueDeviceRequest): Promise<Device> => {
    console.log('[devicesService] issue:', { imeiNumber, payload });
    const res = await apiClient.post<Device>(
      `/devices/${encodeURIComponent(imeiNumber)}/issue`,
      payload,
    );
    return res.data;
  },

  activate: async (imeiNumber: string, payload: ActivateDeviceRequest): Promise<Device> => {
    console.log('[devicesService] activate:', { imeiNumber, payload });
    const res = await apiClient.post<Device>(
      `/devices/${encodeURIComponent(imeiNumber)}/activate`,
      payload,
    );
    return res.data;
  },

  damaged: async (imeiNumber: string, notes?: string): Promise<Device> => {
    console.log('[devicesService] damaged:', { imeiNumber, notes });
    const res = await apiClient.post<Device>(
      `/devices/${encodeURIComponent(imeiNumber)}/damaged`,
      null,
      { params: { notes } },
    );
    return res.data;
  },

  returned: async (imeiNumber: string, notes?: string): Promise<Device> => {
    console.log('[devicesService] returned:', { imeiNumber, notes });
    const res = await apiClient.post<Device>(
      `/devices/${encodeURIComponent(imeiNumber)}/returned`,
      null,
      { params: { notes } },
    );
    return res.data;
  },

  deactivate: async (imeiNumber: string, notes?: string): Promise<Device> => {
    console.log('[devicesService] deactivate:', { imeiNumber, notes });
    const res = await apiClient.post<Device>(
      `/devices/${encodeURIComponent(imeiNumber)}/deactivate`,
      null,
      { params: { notes } },
    );
    return res.data;
  },
};