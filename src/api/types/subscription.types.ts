export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRING_SOON = 'EXPIRING_SOON',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  SUSPENDED = 'SUSPENDED',
}

export interface Subscription {
  id: string;
  subscriptionNumber: string;
  customerId: string;
  productId: string;
  invoiceId?: string;
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
  };
  invoice?: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
  };
  notifications?: SubscriptionNotification[];
  cancelledByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
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

export interface CreateSubscriptionRequest {
  customerId: string;
  productId: string;
  invoiceId?: string;
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
}

export interface SubscriptionFilters {
  customerId?: string;
  productId?: string;
  status?: SubscriptionStatus;
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
