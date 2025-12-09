import apiClient from "../client/axios";
import { API_ENDPOINTS } from "../client/endpoints";
import { ApiResponse } from "../types/common.types";

export interface ProductBatch {
  id: string;
  batchNumber: string;
  productId: string;
  supplierBatchRef?: string;
  buyingPrice: number;
  quantityReceived: number;
  quantityRemaining: number;
  expiryDate?: string;
  receivedDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    sku: string;
  };
  inventory: Array<{
    id: string;
    quantityAvailable: number;
    quantityReserved: number;
    location: string;
  }>;
}

export interface CreateProductBatchRequest {
  productId: string;
  supplierBatchRef?: string;
  buyingPrice: number;
  quantityReceived: number;
  expiryDate?: string;
  notes?: string;
}

export const productBatchesService = {
  getBatches: async (productId?: string): Promise<ProductBatch[]> => {
    const response = await apiClient.get<ProductBatch[]>(
      API_ENDPOINTS.PRODUCT_BATCHES.BASE,
      { params: { productId } }
    );
    return response.data;
  },

  getAvailableBatches: async (productId: string): Promise<ProductBatch[]> => {
    const response = await apiClient.get<ProductBatch[]>(
      API_ENDPOINTS.PRODUCT_BATCHES.AVAILABLE(productId)
    );
    return response.data;
  },

  getBatchById: async (id: string): Promise<ProductBatch> => {
    const response = await apiClient.get<ProductBatch>(
      API_ENDPOINTS.PRODUCT_BATCHES.BY_ID(id)
    );
    return response.data;
  },

  createBatch: async (
    data: CreateProductBatchRequest
  ): Promise<ProductBatch> => {
    const response = await apiClient.post<ProductBatch>(
      API_ENDPOINTS.PRODUCT_BATCHES.BASE,
      data
    );
    return response.data;
  },

  deleteBatch: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(
      API_ENDPOINTS.PRODUCT_BATCHES.BY_ID(id)
    );
    return response.data;
  },
};
