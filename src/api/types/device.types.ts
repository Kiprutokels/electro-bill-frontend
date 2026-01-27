export enum DeviceStatus {
  AVAILABLE = 'AVAILABLE',
  ISSUED = 'ISSUED',
  ACTIVE = 'ACTIVE',
  DAMAGED = 'DAMAGED',
  RETURNED = 'RETURNED',
  INACTIVE = 'INACTIVE',
}

export interface Device {
  id: string;
  imeiNumber: string;
  productId: string;
  batchId?: string | null;

  serialNumber?: string | null;
  macAddress?: string | null;

  simCardIccid?: string | null;
  simCardImsi?: string | null;

  status: DeviceStatus;

  requisitionItemId?: string | null;
  issuedAt?: string | null;
  issuedBy?: string | null;

  notes?: string | null;
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
}

export interface DeviceImeiInput {
  imeiNumber: string;
  notes?: string;
}

export interface BulkCreateDevicesForBatchRequest {
  productId: string;
  devices: DeviceImeiInput[];
}

export interface BulkCreateDevicesForBatchResponse {
  batch: { id: string; batchNumber: string };
  createdCount: number;
  devices: Device[];
}