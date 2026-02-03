export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  EXPIRING_SOON = "EXPIRING_SOON",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
  SUSPENDED = "SUSPENDED",
}

export interface Subscription {
  id: string;
  subscriptionNumber: string;
  customerId: string;
  productId: string;
  invoiceId?: string;

  deviceImei?: string | null;

  startDate: string;
  expiryDate: string;
  status: SubscriptionStatus;
  autoRenew: boolean;
  renewalPrice?: number;

  notificationSent30Days: boolean;
  notificationSent7Days: boolean;
  notificationSentExpired: boolean;

  notes?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  createdAt: string;
  updatedAt: string;

  customer?: {
    id: string;
    customerCode: string;
    businessName?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
  };

  product?: {
    id: string;
    name: string;
    sku: string;
    sellingPrice: number;
    subscriptionFee?: number;
  };

  invoice?: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    jobId?: string;
  };

  notifications?: SubscriptionNotification[];
  renewals?: SubscriptionRenewal[];

  cancelledByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };

  device?: {
    imeiNumber: string;
    status: string;
    serialNumber?: string | null;
    macAddress?: string | null;
    simCardIccid?: string | null;
    simCardImsi?: string | null;
    activatedDate?: string | null;
    salesDate?: string | null;
    createdAt: string;
    updatedAt: string;
    product?: { id: string; name: string; sku: string } | null;
    batch?: { id: string; batchNumber: string } | null;
  } | null;

  latestInstallation?: {
    id: string;
    installationDate: string;
    status: string;
    gpsCoordinates?: string | null;
    installationLocation?: string | null;
    simCard?: string | null;
    macAddress?: string | null;

    job?: {
      id: string;
      jobNumber: string;
      status: string;
      serviceDescription: string;
    } | null;

    vehicle?: {
      id: string;
      vehicleReg: string;
      make: string;
      model: string;
      color?: string | null;
      chassisNo: string;
    } | null;

    technician?: {
      id: string;
      technicianCode: string;
      user?: {
        id: string;
        firstName: string;
        lastName: string;
        phone?: string | null;
      } | null;
    } | null;
  } | null;

  // ==================== CRM fields ====================
  accountOwnerId?: string | null;
  accountOwner?: { id: string; firstName: string; lastName: string } | null;

  followUpFrequencyMonths?: number | null;
  followUpTimesPerYear?: number | null;

  nextFollowUpDate?: string | null;
  lastContactDate?: string | null;

  crmStatus?: "ACTIVE" | "PAUSED" | "AT_RISK" | "CANCELLED";
  priority?: "NORMAL" | "HIGH_VALUE" | "CRITICAL";

  tags?: string | null;
}

export interface SubscriptionNotification {
  id: string;
  subscriptionId: string;
  notificationType: string;
  sentAt: string;
  emailTo: string;
  success: boolean;
  errorMessage?: string;
  createdAt: string;
}

export interface SubscriptionRenewal {
  id: string;
  subscriptionId: string;
  invoiceId: string;
  startDate: string;
  expiryDate: string;
  amount: number;
  paidAt: string;
  createdBy?: string;
  createdAt: string;
  invoice?: {
    id: string;
    invoiceNumber: string;
    status: string;
    totalAmount: number;
  };
}

export interface CreateSubscriptionRequest {
  customerId: string;
  productId: string;
  invoiceId?: string;
  deviceImei?: string;
  startDate: string;
  expiryDate: string;
  autoRenew?: boolean;
  renewalPrice?: number;
  notes?: string;
}

export interface UpdateSubscriptionRequest {
  startDate?: string;
  expiryDate?: string;
  autoRenew?: boolean;
  renewalPrice?: number;
  notes?: string;
  status?: SubscriptionStatus;
  deviceImei?: string | null;
}

export interface SubscriptionFilters {
  customerId?: string;
  productId?: string;
  status?: SubscriptionStatus;
  deviceImei?: string;
}

export interface SubscriptionPaginatedResponse {
  data: Subscription[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SubscriptionStats {
  total: number;
  active: number;
  expiringSoon: number;
  expired: number;
}
