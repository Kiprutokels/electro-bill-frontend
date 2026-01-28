
export enum NotificationMethod {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  BOTH = 'BOTH',
}

export interface SystemSettings {
  id: string;
  businessName: string;
  businessType?: string;
  taxNumber?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  country: string;
  defaultCurrency: string;
  taxRate: number;
  quotationPrefix: string;
  invoicePrefix: string;
  receiptPrefix: string;
  logoUrl?: string;
  
  // Fee Settings
  processingFeeEnabled: boolean;
  processingFeeAmount: number;
  serviceFeeEnabled: boolean;
  serviceFeePercentage: number;
  
  // SMS Settings
  smsEnabled: boolean;
  smsApiKey?: string;
  smsPartnerId?: string;
  smsShortcode?: string;
  notificationMethod: NotificationMethod;
  
  createdAt: string;
  updatedAt: string;
}

export interface CreateSettingsRequest {
  businessName: string;
  businessType?: string;
  taxNumber?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  country?: string;
  defaultCurrency?: string;
  taxRate?: number;
  quotationPrefix?: string;
  invoicePrefix?: string;
  receiptPrefix?: string;
  logoUrl?: string;
  
  // Fee Settings
  processingFeeEnabled?: boolean;
  processingFeeAmount?: number;
  serviceFeeEnabled?: boolean;
  serviceFeePercentage?: number;
  
  // SMS Settings
  smsEnabled?: boolean;
  smsApiKey?: string;
  smsPartnerId?: string;
  smsShortcode?: string;
  notificationMethod?: NotificationMethod;
}

export interface UpdateSettingsRequest extends Partial<CreateSettingsRequest> {}

export interface SettingsResponse {
  data: SystemSettings;
  message?: string;
}

export interface SettingsListResponse {
  data: SystemSettings[];
  message?: string;
}