import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../client/endpoints';
import { PaginatedResponse } from '../types/common.types';

export interface CreateProductRequest {
  sku: string;
  name: string;
  description?: string;
  categoryId: string;
  brandId?: string;
  unitOfMeasure?: string;
  buyingPrice: number;
  sellingPrice: number;
  wholesalePrice?: number;
  weight?: number;
  dimensions?: string;
  warrantyPeriodMonths?: number;
  reorderLevel?: number;
  isActive?: boolean;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  categoryId: string;
  brandId?: string;
  unitOfMeasure: string;
  buyingPrice: number;
  sellingPrice: number;
  wholesalePrice?: number;
  weight?: number;
  dimensions?: string;
  warrantyPeriodMonths: number;
  reorderLevel: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
  };
  brand?: {
    id: string;
    name: string;
  };
  inventory?: Array<{
    quantityAvailable: number;
    quantityReserved: number;
    location: string;
  }>;
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
  subCategories?: ProductCategory[];
  _count?: {
    products: number;
    subCategories: number;
  };
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}

export const productsService = {
  getProducts: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    brandId?: string;
    includeInactive?: boolean;
  } = {}): Promise<PaginatedResponse<Product>> => {
    const response = await apiClient.get<PaginatedResponse<Product>>(
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

  getProductBySku: async (sku: string): Promise<Product> => {
    const response = await apiClient.get<Product>(
      API_ENDPOINTS.PRODUCTS.BY_SKU(sku)
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

  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.PRODUCTS.BY_ID(id));
  },

  toggleProductStatus: async (id: string): Promise<Product> => {
    const response = await apiClient.patch<Product>(
      API_ENDPOINTS.PRODUCTS.TOGGLE_STATUS(id)
    );
    return response.data;
  },

  getLowStockProducts: async (threshold?: number): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>(
      API_ENDPOINTS.PRODUCTS.LOW_STOCK,
      { params: { threshold } }
    );
    return response.data;
  },

  // Categories
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

  createCategory: async (data: {
    name: string;
    description?: string;
    parentCategoryId?: string;
    isActive?: boolean;
  }): Promise<ProductCategory> => {
    const response = await apiClient.post<ProductCategory>(
      API_ENDPOINTS.CATEGORIES.BASE,
      data
    );
    return response.data;
  },

  updateCategory: async (id: string, data: Partial<{
    name: string;
    description?: string;
    parentCategoryId?: string;
    isActive?: boolean;
  }>): Promise<ProductCategory> => {
    const response = await apiClient.patch<ProductCategory>(
      API_ENDPOINTS.CATEGORIES.BY_ID(id),
      data
    );
    return response.data;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.CATEGORIES.BY_ID(id));
  },

  // Brands
  getBrands: async (includeInactive = false): Promise<Brand[]> => {
    const response = await apiClient.get<Brand[]>(
      API_ENDPOINTS.BRANDS.BASE,
      { params: { includeInactive } }
    );
    return response.data;
  },

  createBrand: async (data: {
    name: string;
    description?: string;
    logoUrl?: string;
    isActive?: boolean;
  }): Promise<Brand> => {
    const response = await apiClient.post<Brand>(
      API_ENDPOINTS.BRANDS.BASE,
      data
    );
    return response.data;
  },

  updateBrand: async (id: string, data: Partial<{
    name: string;
    description?: string;
    logoUrl?: string;
    isActive?: boolean;
  }>): Promise<Brand> => {
    const response = await apiClient.patch<Brand>(
      API_ENDPOINTS.BRANDS.BY_ID(id),
      data
    );
    return response.data;
  },

  deleteBrand: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.BRANDS.BY_ID(id));
  },
};
