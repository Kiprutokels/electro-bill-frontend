export enum ImeiStatus {
  AVAILABLE = 'AVAILABLE',
  ISSUED = 'ISSUED',
  DAMAGED = 'DAMAGED',
  RETURNED = 'RETURNED',
}

export interface ProductImei {
  id: string;
  imeiNumber: string;
  productId: string;
  batchId?: string;
  status: ImeiStatus;
  requisitionItemId?: string;
  issuedAt?: string;
  issuedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
  batch?: {
    id: string;
    batchNumber: string;
  };
  issuer?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface ImeiNumberInput {
  imeiNumber: string;
  notes?: string;
}