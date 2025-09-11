import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../client/endpoints';
import { ApiResponse } from '../types/common.types';


export interface Category {
  id: string;
  name: string;
  description?: string;
  parentCategoryId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parentCategory?: Category;
  subCategories: Category[];
  _count: {
    products: number;
    subCategories: number;
  };
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  parentCategoryId?: string;
  isActive?: boolean;
}
export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  parentCategoryId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parentCategory?: ProductCategory;
  subCategories: ProductCategory[];
  _count: {
    products: number;
    subCategories: number;
  };
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  parentCategoryId?: string;
  isActive?: boolean;
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {}

export const categoriesService = {
  getCategories: async (includeInactive = false): Promise<ProductCategory[]> => {
    const response = await apiClient.get<ProductCategory[]>(
      API_ENDPOINTS.CATEGORIES.BASE,
      { params: { includeInactive } }
    );
    return response.data;
  },

  getCategoryHierarchy: async (): Promise<ProductCategory[]> => {
    const response = await apiClient.get<ProductCategory[]>(
      API_ENDPOINTS.CATEGORIES.HIERARCHY
    );
    return response.data;
  },

  getCategoryById: async (id: string): Promise<ProductCategory> => {
    const response = await apiClient.get<ProductCategory>(
      API_ENDPOINTS.CATEGORIES.BY_ID(id)
    );
    return response.data;
  },

  createCategory: async (data: CreateCategoryRequest): Promise<ProductCategory> => {
    const response = await apiClient.post<ProductCategory>(
      API_ENDPOINTS.CATEGORIES.BASE,
      data
    );
    return response.data;
  },

  updateCategory: async (id: string, data: UpdateCategoryRequest): Promise<ProductCategory> => {
    const response = await apiClient.patch<ProductCategory>(
      API_ENDPOINTS.CATEGORIES.BY_ID(id),
      data
    );
    return response.data;
  },

  deleteCategory: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(
      API_ENDPOINTS.CATEGORIES.BY_ID(id)
    );
    return response.data;
  },

  toggleCategoryStatus: async (id: string): Promise<ProductCategory> => {
    const response = await apiClient.patch<ProductCategory>(
      API_ENDPOINTS.CATEGORIES.TOGGLE_STATUS(id)
    );
    return response.data;
  },
};