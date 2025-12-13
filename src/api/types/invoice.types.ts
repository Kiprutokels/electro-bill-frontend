export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export interface InvoiceCustomer {
  id: string;
  customerCode: string;
  businessName: string;
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

export interface InvoiceUser {
  id: string;
  firstName: string;
  lastName: string;
}

export interface InvoiceProduct {
  id: string;
  name: string;
  sku: string;
  sellingPrice: string;
  unitOfMeasure: string;
  warrantyPeriodMonths: number;
  category: {
    name: string;
  };
  brand?: {
    name: string;
  };
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId: string;
  batchId?: string;
  description: string;
  quantity: string;
  unitPrice: string;
  discountPercentage: string;
  createdAt: string;
  product: InvoiceProduct;
  batch?: {
    id: string;
    batchNumber: string;
    buyingPrice: string;
  };
}

export interface InvoiceQuotation {
  id: string;
  quotationNumber: string;
  quotationDate: string;
}

export interface InvoiceJob {
  id: string;
  jobNumber: string;
  status: string;
  serviceDescription: string;
}

export interface InvoiceReceipt {
  id: string;
  receiptNumber: string;
  paymentDate: string;
  totalAmount: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  quotationId?: string;
  customerId: string;
  jobId?: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  serviceFee: number;
  processingFee: number; 
  totalAmount: string;
  amountPaid: string;
  status: InvoiceStatus;
  paymentTerms?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  customer: InvoiceCustomer;
  quotation?: InvoiceQuotation;
  job?: InvoiceJob;
  createdByUser: InvoiceUser;
  items: InvoiceItem[];
  receiptItems?: Array<{
    receipt: InvoiceReceipt;
  }>;
  _count?: {
    items: number;
  };
}

export interface CreateInvoiceRequest {
  quotationId?: string;
  customerId: string;
  dueDate?: string;
  paymentTerms?: string;
  notes?: string;
  discountAmount?: number;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

export interface UpdateInvoiceRequest {
  dueDate?: string;
  paymentTerms?: string;
  notes?: string;
  discountAmount?: number;
  items?: Array<{
    productId: string;
    quantity: number;
  }>;
}

export interface InvoiceFilters {
  customerId?: string;
  status?: InvoiceStatus;
  startDate?: string;
  endDate?: string;
}

export interface InvoicePaginatedResponse {
  data: Invoice[];
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
  warrantyPeriodMonths: number;
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
