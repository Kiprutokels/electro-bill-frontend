import apiClient from "../client/axios";
import { API_ENDPOINTS } from "../client/endpoints";
import { ApiResponse } from "../types/common.types";
import {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ProductFilters,
} from "../types/product.types";

export interface ProductSearchResult {
  id: string;
  name: string;
  sku: string;
  sellingPrice: string;
  unitOfMeasure: string;
  category?: {
    name: string;
  };
  brand?: {
    name: string;
  };
  inventory?: Array<{
    quantityAvailable: number;
    location: string;
  }>;
  totalAvailable: number;
}

export const productsService = {
  // Get all products
  getAll: async (filters: ProductFilters = {}): Promise<Product[]> => {
    const params: any = {};

    if (filters.includeInactive !== undefined) params.includeInactive = filters.includeInactive;
    if (filters.categoryId) params.categoryId = filters.categoryId;
    if (filters.brandId) params.brandId = filters.brandId;

    const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.BASE, {
      params,
    });
    return response.data;
  },

  // Get product by ID
  getById: async (id: string): Promise<Product> => {
    const response = await apiClient.get<Product>(
      API_ENDPOINTS.PRODUCTS.BY_ID(id)
    );
    return response.data;
  },

  // Create new product
  create: async (data: CreateProductRequest): Promise<Product> => {
    const response = await apiClient.post<Product>(
      API_ENDPOINTS.PRODUCTS.BASE,
      data
    );
    return response.data;
  },

  // Update product
  update: async (id: string, data: UpdateProductRequest): Promise<Product> => {
    const response = await apiClient.patch<Product>(
      API_ENDPOINTS.PRODUCTS.BY_ID(id),
      data
    );
    return response.data;
  },

  // Toggle product status
  toggleStatus: async (id: string): Promise<Product> => {
    const response = await apiClient.patch<Product>(
      API_ENDPOINTS.PRODUCTS.TOGGLE_STATUS(id)
    );
    return response.data;
  },

  // Delete product
  delete: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(
      API_ENDPOINTS.PRODUCTS.BY_ID(id)
    );
    return response.data;
  },

  // Get low stock products
  getLowStock: async (): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>(
      API_ENDPOINTS.PRODUCTS.LOW_STOCK
    );
    return response.data;
  },

  // Search products with stock info
  searchProducts: async (query: string, limit: number = 20): Promise<ProductSearchResult[]> => {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const response = await apiClient.get<ProductSearchResult[]>(
      `${API_ENDPOINTS.PRODUCTS.BASE}/search`,
      {
        params: { q: query, limit }
      }
    );
    return response.data;
  },
};

// Export types for easier imports
export * from "../types/product.types";
