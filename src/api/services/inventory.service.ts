import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../client/endpoints';
import { PaginatedResponse } from '../types/common.types';

export interface InventoryItem {
  id: string;
  productId: string;
  quantityAvailable: number;
  quantityReserved: number;
  location: string;
  lastStockUpdate: string;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    sku: string;
    name: string;
    reorderLevel: number;
    category: {
      name: string;
    };
    brand?: {
      name: string;
    };
  };
}

export interface StockAdjustment {
  quantity: number;
  type: 'INCREASE' | 'DECREASE' | 'SET';
  reason: string;
  location?: string;
}

export interface InventorySummary {
  totalProducts: number;
  totalQuantity: number;
  lowStockCount: number;
  outOfStockCount: number;
  locations: number;
}

export const inventoryService = {
  getInventory: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    location?: string;
    lowStock?: boolean;
  } = {}): Promise<PaginatedResponse<InventoryItem>> => {
    const response = await apiClient.get<PaginatedResponse<InventoryItem>>(
      API_ENDPOINTS.INVENTORY.BASE,
      { params }
    );
    return response.data;
  },

  getInventoryById: async (id: string): Promise<InventoryItem> => {
    const response = await apiClient.get<InventoryItem>(
      API_ENDPOINTS.INVENTORY.BY_ID(id)
    );
    return response.data;
  },

  getInventoryByProduct: async (productId: string): Promise<InventoryItem[]> => {
    const response = await apiClient.get<InventoryItem[]>(
      API_ENDPOINTS.INVENTORY.BY_PRODUCT(productId)
    );
    return response.data;
  },

  updateInventory: async (id: string, data: {
    quantityAvailable: number;
    quantityReserved?: number;
    location?: string;
  }): Promise<InventoryItem> => {
    const response = await apiClient.patch<InventoryItem>(
      API_ENDPOINTS.INVENTORY.BY_ID(id),
      data
    );
    return response.data;
  },

  adjustStock: async (id: string, adjustment: StockAdjustment): Promise<InventoryItem> => {
    const response = await apiClient.patch<InventoryItem>(
      API_ENDPOINTS.INVENTORY.ADJUST(id),
      adjustment
    );
    return response.data;
  },

  getInventorySummary: async (): Promise<InventorySummary> => {
    const response = await apiClient.get<InventorySummary>(
      API_ENDPOINTS.INVENTORY.SUMMARY
    );
    return response.data;
  },

  getLocations: async (): Promise<string[]> => {
    const response = await apiClient.get<string[]>(
      API_ENDPOINTS.INVENTORY.LOCATIONS
    );
    return response.data;
  },

  getLowStockProducts: async (threshold?: number): Promise<InventoryItem[]> => {
    const response = await apiClient.get<InventoryItem[]>(
      API_ENDPOINTS.INVENTORY.LOW_STOCK,
      { params: { threshold } }
    );
    return response.data;
  },
};
