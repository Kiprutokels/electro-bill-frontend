import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../client/endpoints';
import { ApiResponse } from '../types/common.types';

export interface Category {
  id: string;
  name: string;
}

export interface Brand {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  categoryId: string;
  brandId?: string;
  unitOfMeasure: string;
  sellingPrice: number;
  wholesalePrice?: number;
  weight?: number;
  dimensions?: string;
  warrantyPeriodMonths: number;
  reorderLevel: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category: Category;
  brand?: Brand;
  totalQuantity?: number;
  _count?: {
    batches: number;
    inventory: number;
  };
}

export interface CreateProductRequest {
  sku: string;
  name: string;
  description?: string;
  categoryId: string;
  brandId?: string;
  unitOfMeasure?: string;
  sellingPrice: number;
  wholesalePrice?: number;
  weight?: number;
  dimensions?: string;
  warrantyPeriodMonths?: number;
  reorderLevel?: number;
  isActive?: boolean;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  sku?: string;
  categoryId?: string;
  brandId?: string;
  sellingPrice?: number;
  wholesalePrice?: number;
  reorderLevel?: number;
  isActive?: boolean;
}
export interface UpdateProductRequest extends Partial<CreateProductRequest> {}

export const productsService = {
  getProducts: async (params: {
    includeInactive?: boolean;
    categoryId?: string;
    brandId?: string;
  } = {}): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>(
      API_ENDPOINTS.PRODUCTS.BASE,
      { params }
    );
    return response.data;
  },

  getProductById: async (id: string): Promise<Product> => {
    const response = await apiClient.get<Product>(
      API_ENDPOINTS.PRODUCTS.BY_ID(id)
    );
    return response.data;
  },

  createProduct: async (data: CreateProductRequest): Promise<Product> => {
    const response = await apiClient.post<Product>(
      API_ENDPOINTS.PRODUCTS.BASE,
      data
    );
    return response.data;
  },

  updateProduct: async (id: string, data: UpdateProductRequest): Promise<Product> => {
    const response = await apiClient.patch<Product>(
      API_ENDPOINTS.PRODUCTS.BY_ID(id),
      data
    );
    return response.data;
  },

  deleteProduct: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(
      API_ENDPOINTS.PRODUCTS.BY_ID(id)
    );
    return response.data;
  },

  toggleProductStatus: async (id: string): Promise<Product> => {
    const response = await apiClient.patch<Product>(
      API_ENDPOINTS.PRODUCTS.TOGGLE_STATUS(id)
    );
    return response.data;
  },

  getLowStockProducts: async (): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>(
      API_ENDPOINTS.PRODUCTS.LOW_STOCK
    );
    return response.data;
  },
};