export enum DeviceStatus {
  AVAILABLE = 'AVAILABLE',
  ISSUED = 'ISSUED',
  ACTIVE = 'ACTIVE',
  DAMAGED = 'DAMAGED',
  RETURNED = 'RETURNED',
  INACTIVE = 'INACTIVE',
}

export interface DeviceProductLite {
  id: string;
  name: string;
  sku: string;
}

export interface DeviceBatchLite {
  id: string;
  batchNumber: string;
}

export interface DeviceIssuerLite {
  id: string;
  firstName: string;
  lastName: string;
}

export interface DeviceJobLite {
  id: string;
  jobNumber: string;
  status: string;
  customer?: {
    businessName?: string | null;
    contactPerson?: string | null;
  } | null;
}

export interface DeviceRequisitionLite {
  requisitionNumber?: string | null;
  job?: DeviceJobLite | null;
}

export interface DeviceRequisitionItemLite {
  id: string;
  requisition?: DeviceRequisitionLite | null;
}

export interface DeviceInstallationLite {
  id: string;
  installationDate: string;
  installationLocation?: string | null;
  job: { jobNumber: string };
  vehicle: { vehicleReg: string; make: string; model: string };
}

/**
 * Device model used across the app.
 * - The list endpoint (/devices) returns a "lite" Device (no relations sometimes).
 * - The detail endpoint (/devices/:imei) returns a "full" Device (with relations).
 * This interface supports BOTH shapes safely.
 */
export interface Device {
  id: string;
  imeiNumber: string;

  productId: string;
  batchId?: string | null;

  serialNumber?: string | null;
  macAddress?: string | null;

  simCardIccid?: string | null;
  simCardImsi?: string | null;

  // Lifecycle & installation fields (exist in Prisma model; often only present in detail endpoint)
  salesDate?: string | null;
  activatedDate?: string | null;
  lastBatteryReplacement?: string | null;

  installationAddress?: string | null;
  installationPerson?: string | null;
  installationCompany?: string | null;
  installationDate?: string | null;

  status: DeviceStatus;

  requisitionItemId?: string | null;
  issuedAt?: string | null;
  issuedBy?: string | null;

  notes?: string | null;
  createdAt: string;
  updatedAt: string;

  // Optional relations (present in detail endpoint; sometimes in list endpoint depending on include)
  product?: DeviceProductLite;
  batch?: DeviceBatchLite;

  requisitionItem?: DeviceRequisitionItemLite | null;
  issuer?: DeviceIssuerLite | null;

  installations?: DeviceInstallationLite[]; // detail endpoint includes this
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

export interface DeviceLifecycleEvent {
  date: string;
  event: string;
  status?: DeviceStatus;
  details?: string;
  jobNumber?: string;
  location?: string;
}

export interface DeviceHistoryResponse {
  device: Device;
  lifecycle: DeviceLifecycleEvent[];
  currentStatus: DeviceStatus;
}