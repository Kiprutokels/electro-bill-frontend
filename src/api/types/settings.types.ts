export enum NotificationMethod {
  EMAIL = "EMAIL",
  SMS = "SMS",
  BOTH = "BOTH",
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

  accountsEmail?: string;
  accountsPhone?: string;

  bankName?: string;
  bankBranch?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankSwiftCode?: string;
  bankBranchCode?: string;

  mpesaPaybillNumber?: string;
  mpesaAccountNumber?: string;

  adminInvoiceEmail1?: string;
  adminInvoiceEmail2?: string;

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

  accountsEmail?: string;
  accountsPhone?: string;

  bankName?: string;
  bankBranch?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankSwiftCode?: string;
  bankBranchCode?: string;

  mpesaPaybillNumber?: string;
  mpesaAccountNumber?: string;

  adminInvoiceEmail1?: string;
  adminInvoiceEmail2?: string;
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
