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
