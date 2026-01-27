import apiClient from '../client/axios';
import {
  BulkCreateDevicesForBatchRequest,
  BulkCreateDevicesForBatchResponse,
  Device,
} from '../types/device.types';

export const devicesService = {
  bulkCreateForBatch: async (
    batchId: string,
    payload: BulkCreateDevicesForBatchRequest,
  ): Promise<BulkCreateDevicesForBatchResponse> => {
    const res = await apiClient.post<BulkCreateDevicesForBatchResponse>(
      `/devices/batch/${batchId}/bulk`,
      payload,
    );
    return res.data;
  },

  getAvailableDevices: async (params: {
    productId: string;
    batchId?: string;
  }): Promise<Device[]> => {
    const res = await apiClient.get<{ data: Device[] } | Device[]>(
      `/devices`,
      {
        params: {
          page: 1,
          limit: -1,
          status: 'AVAILABLE',
          productId: params.productId,
          ...(params.batchId ? { batchId: params.batchId } : {}),
        },
      },
    );

    // support either raw array or paginated shape
    const data: any = res.data as any;
    if (Array.isArray(data)) return data;
    return data.data ?? [];
  },
};