import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../client/endpoints';

export enum InventoryAdjustmentType {
  INCREASE = 'increase',
  DECREASE = 'decrease',
  SET = 'set',
}

export interface InventoryItem {
  id: string;
  productId: string;
  batchId?: string;
  quantity: number;
  quantityAvailable: number;
  quantityReserved: number;
  minStock: number;
  maxStock?: number;
  reorderPoint?: number;
  location?: string;
  bin?: string;
  unitCost: number; // This will be calculated from batch data
  lastUpdated: string;
  lastStockUpdate: string;
  lastCounted?: string;
  updatedBy?: string;
  supplier?: string;
  notes?: string;
  product: {
    id: string;
    name: string;
    sku: string;
    sellingPrice: number;
    reorderLevel: number;
    description?: string;
    category?: {
      id: string;
      name: string;
    };
    brand?: {
      id: string;
      name: string;
    };
  };
  batch?: {
    id: string;
    batchNumber: string;
    buyingPrice: number;
    expiryDate?: string;
    receivedDate: string;
  };
}

export interface InventoryAdjustmentRequest {
  newQuantity: number;
  adjustmentType: InventoryAdjustmentType;
  adjustmentQuantity: number;
  reason: string;
  notes?: string;
  unitCost?: number;
}

export interface InventoryFilters {
  productId?: string;
  categoryId?: string;
  location?: string;
  lowStock?: boolean;
  includeZeroStock?: boolean;
}

export interface InventorySummary {
  totalProducts: number;
  productsInStock: number;
  productsOutOfStock: number;
  lowStockCount: number;
  totalValue: number;
  avgStockLevel: number;
}

// Transform API response to add calculated unitCost
const transformInventoryItem = (item: any): InventoryItem => {
  // Use buyingPrice from batch as unitCost, fallback to sellingPrice
  const unitCost = item.batch?.buyingPrice ? Number(item.batch.buyingPrice) : 
                   (item.product?.sellingPrice ? Number(item.product.sellingPrice) : 0);

  return {
    ...item,
    unitCost,
    quantity: item.quantityAvailable || item.quantity || 0,
    quantityAvailable: item.quantityAvailable || 0,
    quantityReserved: item.quantityReserved || 0,
    minStock: item.product?.reorderLevel || item.minStock || 0,
    lastStockUpdate: item.lastStockUpdate || item.updatedAt,
    product: {
      ...item.product,
      sellingPrice: Number(item.product?.sellingPrice) || 0,
      reorderLevel: item.product?.reorderLevel || 0,
    },
    batch: item.batch ? {
      ...item.batch,
      buyingPrice: Number(item.batch.buyingPrice) || 0,
    } : undefined,
  };
};

export const inventoryService = {
  // Get all inventory items with pagination and filters
  getAll: async (
    page = 1,
    limit = 10,
    search?: string,
    filters: InventoryFilters = {}
  ): Promise<{
    data: InventoryItem[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> => {
    const params = {
      page,
      limit,
      search,
      ...filters,
    };
    
    const response = await apiClient.get(API_ENDPOINTS.INVENTORY.BASE, { params });
    
    // Transform the response data
    const transformedData = response.data.data?.map(transformInventoryItem) || [];
    
    return {
      data: transformedData,
      meta: response.data.meta || {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
    };
  },

  // Backward compatibility method
  getInventory: async (
    page = 1,
    limit = 10,
    search?: string,
    filters: InventoryFilters = {}
  ) => {
    return inventoryService.getAll(page, limit, search, filters);
  },

  // Get single inventory item by ID
  getById: async (id: string): Promise<InventoryItem> => {
    const response = await apiClient.get(API_ENDPOINTS.INVENTORY.BY_ID(id));
    return transformInventoryItem(response.data);
  },

  // Get inventory by product ID
  getByProduct: async (productId: string): Promise<{
    product: {
      id: string;
      name: string;
      sku: string;
      sellingPrice: number;
      reorderLevel: number;
    };
    totalQuantity: number;
    totalReserved: number;
    totalAvailable: number;
    batches: InventoryItem[];
  }> => {
    const response = await apiClient.get(
      API_ENDPOINTS.INVENTORY.BY_PRODUCT(productId)
    );
    
    const data = response.data;
    return {
      ...data,
      batches: data.batches?.map(transformInventoryItem) || [],
    };
  },

  // Get inventory summary/statistics
  getSummary: async (): Promise<InventorySummary> => {
    const response = await apiClient.get(API_ENDPOINTS.INVENTORY.SUMMARY);
    return response.data;
  },

  // Backward compatibility method
  getInventorySummary: async (): Promise<InventorySummary> => {
    return inventoryService.getSummary();
  },

  // Get low stock products
  getLowStock: async (): Promise<InventoryItem[]> => {
    const response = await apiClient.get(API_ENDPOINTS.INVENTORY.LOW_STOCK);
    return response.data?.map(transformInventoryItem) || [];
  },

  // Adjust stock for specific inventory item
  adjustStock: async (id: string, data: InventoryAdjustmentRequest): Promise<InventoryItem> => {
    const response = await apiClient.patch(
      API_ENDPOINTS.INVENTORY.ADJUST_STOCK(id),
      data
    );
    return transformInventoryItem(response.data);
  },

  // Create new inventory item
  create: async (data: Partial<InventoryItem>): Promise<InventoryItem> => {
    const response = await apiClient.post(API_ENDPOINTS.INVENTORY.BASE, data);
    return transformInventoryItem(response.data);
  },

  // Update inventory item
  update: async (id: string, data: Partial<InventoryItem>): Promise<InventoryItem> => {
    const response = await apiClient.patch(API_ENDPOINTS.INVENTORY.BY_ID(id), data);
    return transformInventoryItem(response.data);
  },

  // Delete inventory item
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.INVENTORY.BY_ID(id));
  },

  // Search products for inventory management
  searchProducts: async (search: string): Promise<any[]> => {
    const response = await apiClient.get(`${API_ENDPOINTS.PRODUCTS.BASE}/search`, {
      params: { search, limit: 10 }
    });
    return response.data || [];
  },
};
