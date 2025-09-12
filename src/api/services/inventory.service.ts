import apiClient from "../client/axios";
import { API_ENDPOINTS } from "../client/endpoints";
import {
  InventoryItem,
  InventoryFilters,
  InventoryPaginatedResponse,
  InventorySummary,
  LowStockProduct,
  ExpiredStock,
  ProductInventory,
  ManualInventoryAdjustment,
  InventoryValuation,
} from "../types/inventory.types";

export const inventoryService = {
  // Get all inventory with pagination and filters
  getAll: async (
    page = 1,
    limit = 10,
    search?: string,
    filters: InventoryFilters = {}
  ): Promise<InventoryPaginatedResponse> => {
    const params: any = {
      page,
      limit,
    };

    if (search) params.search = search;
    if (filters.productId) params.productId = filters.productId;
    if (filters.categoryId) params.categoryId = filters.categoryId;
    if (filters.location) params.location = filters.location;
    if (filters.lowStock !== undefined) params.lowStock = filters.lowStock;
    if (filters.includeZeroStock !== undefined) params.includeZeroStock = filters.includeZeroStock;

    const response = await apiClient.get(API_ENDPOINTS.INVENTORY.BASE, {
      params,
    });
    return response.data;
  },

  // Get inventory summary statistics
  getSummary: async (): Promise<InventorySummary> => {
    const response = await apiClient.get<InventorySummary>(
      API_ENDPOINTS.INVENTORY.SUMMARY
    );
    return response.data;
  },

  // Get low stock products
  getLowStock: async (): Promise<LowStockProduct[]> => {
    const response = await apiClient.get<LowStockProduct[]>(
      API_ENDPOINTS.INVENTORY.LOW_STOCK
    );
    return response.data;
  },

  // Get expired stock
  getExpired: async (): Promise<ExpiredStock[]> => {
    const response = await apiClient.get<ExpiredStock[]>(
      `${API_ENDPOINTS.INVENTORY.BASE}/expired`
    );
    return response.data;
  },

  // Get inventory valuation report
  getValuation: async (): Promise<InventoryValuation> => {
    const response = await apiClient.get<InventoryValuation>(
      `${API_ENDPOINTS.INVENTORY.BASE}/valuation`
    );
    return response.data;
  },

  // Get inventory for specific product
  getByProduct: async (productId: string): Promise<ProductInventory> => {
    const response = await apiClient.get<ProductInventory>(
      API_ENDPOINTS.INVENTORY.BY_PRODUCT(productId)
    );
    return response.data;
  },

  // Manual inventory adjustment
  adjustInventory: async (adjustment: ManualInventoryAdjustment): Promise<ProductInventory> => {
    const response = await apiClient.post<ProductInventory>(
      `${API_ENDPOINTS.INVENTORY.BASE}/adjust`,
      adjustment
    );
    return response.data;
  },
};

// Export types for easier imports
export * from "../types/inventory.types";