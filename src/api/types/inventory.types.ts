export interface InventoryProduct {
  id: string;
  name: string;
  sku: string;
  sellingPrice: string;
  reorderLevel: number;
  isImeiTracked?: boolean;
  category: {
    id: string;
    name: string;
  };
  brand?: {
    id: string;
    name: string;
  };
}

export interface InventoryBatch {
  id: string;
  batchNumber: string;
  buyingPrice: string;
  expiryDate?: string;
  receivedDate: string;
  supplierBatchRef?: string;
}

export interface InventoryItem {
  id: string;
  productId: string;
  batchId?: string;
  quantityAvailable: number;
  quantityReserved: number;
  location: string;
  lastStockUpdate: string;
  createdAt: string;
  updatedAt: string;
  product: InventoryProduct;
  batch?: InventoryBatch;
}

export interface InventoryFilters {
  productId?: string;
  categoryId?: string;
  location?: string;
  lowStock?: boolean;
  includeZeroStock?: boolean;
}

export interface InventoryPaginatedResponse {
  data: InventoryItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface InventorySummary {
  summary: Array<{
    location: string;
    _sum: {
      quantityAvailable: number;
      quantityReserved: number;
    };
    _count: {
      productId: number;
    };
  }>;
  totalProducts: number;
  productsInStock: number;
  productsOutOfStock: number;
  lowStockCount: number;
  expiredBatchesCount: number;
}

export interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  reorderLevel: number;
  inventory: Array<{
    quantityAvailable: number;
    location: string;
  }>;
  category: {
    name: string;
  };
  brand?: {
    name: string;
  };
}

export interface ExpiredStock {
  id: string;
  productId: string;
  batchId: string;
  quantityAvailable: number;
  location: string;
  product: {
    id: string;
    name: string;
    sku: string;
  };
  batch: {
    id: string;
    batchNumber: string;
    expiryDate: string;
    buyingPrice: string;
  };
}

export interface ProductInventory {
  product: {
    id: string;
    name: string;
    sku: string;
    sellingPrice: string;
    reorderLevel: number;
  };
  totalQuantity: number;
  totalReserved: number;
  totalAvailable: number;
  batches: InventoryItem[];
}

export enum InventoryAdjustmentType {
  INCREASE = 'INCREASE',
  DECREASE = 'DECREASE',
  CORRECTION = 'CORRECTION',
}

export interface ImeiNumberInput {
  imeiNumber: string;
}

export interface ManualInventoryAdjustment {
  productId: string;
  quantity: number;
  type: InventoryAdjustmentType;
  reason: string;
  imeiNumbers?: ImeiNumberInput[];
}

export interface InventoryValuation {
  items: Array<{
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    buyingPrice: number;
    sellingPrice: number;
    costValue: number;
    sellingValue: number;
    potentialProfit: number;
  }>;
  summary: {
    totalCostValue: number;
    totalSellingValue: number;
    totalPotentialProfit: number;
    profitMargin: number;
  };
}