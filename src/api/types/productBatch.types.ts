export interface ProductBatchProduct {
  id: string;
  name: string;
  sku: string;
  sellingPrice?: string;
}

export interface ProductBatchUser {
  id: string;
  firstName: string;
  lastName: string;
}

export interface ProductBatchInventory {
  quantityAvailable: number;
  quantityReserved: number;
  location: string;
}

export interface ProductBatch {
  id: string;
  batchNumber: string;
  productId: string;
  supplierBatchRef?: string;
  buyingPrice: string;
  quantityReceived: number;
  expiryDate?: string;
  receivedDate: string;
  location: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  product: ProductBatchProduct;
  createdByUser: ProductBatchUser;
  inventory: ProductBatchInventory[];
}

export interface ProductBatchPaginatedResponse {
  data: ProductBatch[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateProductBatchRequest {
  productId: string;
  supplierBatchRef?: string;
  buyingPrice: number;
  quantityReceived: number;
  expiryDate?: string;
  notes?: string;
}

export interface UpdateProductBatchRequest {
  supplierBatchRef?: string;
  buyingPrice?: number;
  expiryDate?: string;
  notes?: string;
}

export enum BatchAdjustmentType {
  INCREASE = 'INCREASE',
  DECREASE = 'DECREASE',
  SOLD = 'SOLD',
  DAMAGED = 'DAMAGED',
  EXPIRED = 'EXPIRED',
}

export interface BatchStockAdjustment {
  quantity: number;
  type: BatchAdjustmentType;
  reason: string;
}

export interface ExpiringBatch {
  id: string;
  batchNumber: string;
  productId: string;
  expiryDate: string;
  product: ProductBatchProduct;
  inventory: ProductBatchInventory[];
}

export interface FIFOAllocation {
  batchId: string;
  batchNumber: string;
  inventoryId: string;
  quantityToUse: number;
  buyingPrice: number;
  location: string;
}