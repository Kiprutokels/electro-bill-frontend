export interface ProductCategory {
  id: string;
  name: string;
}

export interface ProductBrand {
  id: string;
  name: string;
}

export interface ProductInventory {
  quantityAvailable: number;
  quantityReserved: number;
  location: string;
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
  category: ProductCategory;
  brand?: ProductBrand;
  inventory: ProductInventory[];
  totalQuantity: number;
  totalReserved: number;
  totalInStock: number;
  _count: {
    batches: number;
    inventory: number;
    invoiceItems?: number;
    quotationItems?: number;
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

export interface UpdateProductRequest {
  sku?: string;
  name?: string;
  description?: string;
  categoryId?: string;
  brandId?: string;
  unitOfMeasure?: string;
  sellingPrice?: number;
  wholesalePrice?: number;
  weight?: number;
  dimensions?: string;
  warrantyPeriodMonths?: number;
  reorderLevel?: number;
  isActive?: boolean;
}

export interface ProductFilters {
  includeInactive?: boolean;
  categoryId?: string;
  brandId?: string;
}
