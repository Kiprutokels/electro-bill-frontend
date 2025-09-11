import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../client/endpoints';
import { ApiResponse } from '../types/common.types';

// api/services/brands.service.ts
export interface Brand {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  isActive: boolean;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  _count: {
    products: number;
  };
}

export interface CreateBrandRequest {
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  isActive: boolean;
}

export interface UpdateBrandData {
  name?: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  isActive?: boolean;
  status?: 'active' | 'inactive';
}
export interface UpdateBrandRequest extends Partial<CreateBrandRequest> {}

export const brandsService = {
  getBrands: async (includeInactive = false): Promise<Brand[]> => {
    const response = await apiClient.get<Brand[]>(
      API_ENDPOINTS.BRANDS.BASE,
      { params: { includeInactive } }
    );
    return response.data;
  },

  getBrandById: async (id: string): Promise<Brand> => {
    const response = await apiClient.get<Brand>(
      API_ENDPOINTS.BRANDS.BY_ID(id)
    );
    return response.data;
  },

  createBrand: async (data: CreateBrandRequest): Promise<Brand> => {
    const response = await apiClient.post<Brand>(
      API_ENDPOINTS.BRANDS.BASE,
      data
    );
    return response.data;
  },

  updateBrand: async (id: string, data: UpdateBrandRequest): Promise<Brand> => {
    const response = await apiClient.patch<Brand>(
      API_ENDPOINTS.BRANDS.BY_ID(id),
      data
    );
    return response.data;
  },

  deleteBrand: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(
      API_ENDPOINTS.BRANDS.BY_ID(id)
    );
    return response.data;
  },

  toggleBrandStatus: async (id: string): Promise<Brand> => {
    const response = await apiClient.patch<Brand>(
      API_ENDPOINTS.BRANDS.TOGGLE_STATUS(id)
    );
    return response.data;
  },
};