import apiClient from "../client/axios";
import { ProductImei } from "../types/imei.types";
import { ImeiNumberInput } from "../types/imei.types";

export const imeiService = {
  getAvailableImeis: async (
    productId: string,
    batchId?: string
  ): Promise<ProductImei[]> => {
    const response = await apiClient.get<ProductImei[]>(
      `/imei/product/${productId}/available`,
      { params: batchId ? { batchId } : {} }
    );
    return response.data;
  },

  getImeiDetails: async (imeiNumber: string): Promise<ProductImei> => {
    const response = await apiClient.get<ProductImei>(
      `/imei/details/${imeiNumber}`
    );
    return response.data;
  },

  getImeisByRequisitionItem: async (
    requisitionItemId: string
  ): Promise<ProductImei[]> => {
    const response = await apiClient.get<ProductImei[]>(
      `/imei/requisition-item/${requisitionItemId}`
    );
    return response.data;
  },

  addImeisToBatch: async (
    productId: string,
    batchId: string,
    imeiNumbers: ImeiNumberInput[]
  ) => {
    const response = await apiClient.post(
      `/imei/product/${productId}/batch/${batchId}`,
      { imeiNumbers }
    );
    return response.data;
  },
};