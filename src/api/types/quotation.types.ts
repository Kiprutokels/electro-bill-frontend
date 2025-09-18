export enum QuotationStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  INVOICED = 'INVOICED',
}

export interface QuotationCustomer {
  id: string;
  customerCode: string;
  businessName?: string;
  contactPerson: string;
  phone: string;
  email: string;
  alternatePhone?: string;
  taxNumber?: string;
  creditLimit: string;
  currentBalance: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  country: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationUser {
  id: string;
  firstName: string;
  lastName: string;
}

export interface QuotationProduct {
  id: string;
  name: string;
  sku: string;
  sellingPrice: string;
  unitOfMeasure: string;
  category?: {
    name: string;
  };
  brand?: {
    name: string;
  };
}

export interface QuotationItem {
  id: string;
  quotationId: string;
  productId: string;
  description: string;
  quantity: string;
  unitPrice: string;
  discountPercentage: string;
  createdAt: string;
  product?: QuotationProduct;
}

export interface QuotationInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  status: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  quotationDate: string;
  validUntil: string;
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  totalAmount: string;
  status: QuotationStatus;
  notes?: string;
  createdBy: string;
  approvedDate?: string;
  createdAt: string;
  updatedAt: string;
  customer?: QuotationCustomer;
  createdByUser?: QuotationUser;
  items?: QuotationItem[];
  invoices?: QuotationInvoice[];
  _count?: {
    items: number;
  };
}

export interface CreateQuotationRequest {
  customerId: string;
  validUntil?: string;
  notes?: string;
  discountAmount?: number;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

export interface UpdateQuotationRequest {
  validUntil?: string;
  notes?: string;
  discountAmount?: number;
  items?: Array<{
    productId: string;
    quantity: number;
  }>;
}

export interface QuotationFilters {
  customerId?: string;
  status?: QuotationStatus;
  startDate?: string;
  endDate?: string;
}

export interface QuotationPaginatedResponse {
  data: Quotation[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ProductSearchResult {
  id: string;
  name: string;
  sku: string;
  sellingPrice: string;
  unitOfMeasure: string;
  category?: {
    name: string;
  };
  brand?: {
    name: string;
  };
  inventory?: Array<{
    quantityAvailable: number;
  }>;
}
