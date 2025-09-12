import apiClient from "../client/axios";
import { API_ENDPOINTS } from "../client/endpoints";
import { ApiResponse } from "../types/common.types";
import {
  ProductBatch,
  ProductBatchPaginatedResponse,
  CreateProductBatchRequest,
  UpdateProductBatchRequest,
  BatchStockAdjustment,
  ExpiringBatch,
  FIFOAllocation,
} from "../types/productBatch.types";

export const productBatchesService = {
  // Get all product batches with pagination and search
  getAll: async (
    page = 1,
    limit = 10,
    search?: string,
    includeExpired = false,
    productId?: string
  ): Promise<ProductBatchPaginatedResponse> => {
    const params: any = {
      page,
      limit,
    };

    if (search) params.search = search;
    if (includeExpired !== undefined) params.includeExpired = includeExpired;
    if (productId) params.productId = productId;

    const response = await apiClient.get(API_ENDPOINTS.PRODUCT_BATCHES.BASE, {
      params,
    });
    return response.data;
  },

  // Get batches expiring soon
  getExpiring: async (days = 30): Promise<ExpiringBatch[]> => {
    const response = await apiClient.get<ExpiringBatch[]>(
      `${API_ENDPOINTS.PRODUCT_BATCHES.BASE}/expiring`,
      { params: { days } }
    );
    return response.data;
  },

  // Get batches for FIFO allocation
  getFIFO: async (productId: string, quantity: number): Promise<FIFOAllocation[]> => {
    const response = await apiClient.get<FIFOAllocation[]>(
      API_ENDPOINTS.PRODUCT_BATCHES.FIFO(productId, quantity)
    );
    return response.data;
  },

  // Get batch by ID
  getById: async (id: string): Promise<ProductBatch> => {
    const response = await apiClient.get<ProductBatch>(
      API_ENDPOINTS.PRODUCT_BATCHES.BY_ID(id)
    );
    return response.data;
  },

  // Create new batch
  create: async (data: CreateProductBatchRequest): Promise<ProductBatch> => {
    const response = await apiClient.post<ProductBatch>(
      API_ENDPOINTS.PRODUCT_BATCHES.BASE,
      data
    );
    return response.data;
  },

  // Update batch
  update: async (id: string, data: UpdateProductBatchRequest): Promise<ProductBatch> => {
    const response = await apiClient.patch<ProductBatch>(
      API_ENDPOINTS.PRODUCT_BATCHES.BY_ID(id),
      data
    );
    return response.data;
  },

  // Adjust batch stock
  adjustStock: async (id: string, adjustment: BatchStockAdjustment): Promise<ProductBatch> => {
    const response = await apiClient.patch<ProductBatch>(
      API_ENDPOINTS.PRODUCT_BATCHES.ADJUST_STOCK(id),
      adjustment
    );
    return response.data;
  },

  // Delete batch
  delete: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(
      API_ENDPOINTS.PRODUCT_BATCHES.BY_ID(id)
    );
    return response.data;
  },
};

// Export types for easier imports
export * from "../types/productBatch.types";