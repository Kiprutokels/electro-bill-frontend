export interface PaymentMethod {
  id: string;
  name: string;
  type: "CASH" | "BANK_TRANSFER" | "MOBILE_MONEY" | "CHEQUE" | "CARD";
  isActive: boolean;
  _count?: {
    receipts: number;
  };
}

export interface PaymentItem {
  invoiceId: string;
  amountPaid: number;
}

export interface CreatePaymentDto {
  customerId: string;
  paymentMethodId: string;
  totalAmount: number;
  referenceNumber?: string;
  notes?: string;
  items: PaymentItem[];
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  customerId: string;
  paymentMethodId: string;
  totalAmount: number;
  paymentDate: string | Date;
  referenceNumber?: string;
  notes?: string;
  balanceIssued: number;
  balanceCredited: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  customer: {
    id: string;
    customerCode: string;
    businessName: string | null;
    contactPerson: string | null;
    phone: string | null;
    email: string | null;
  };
  paymentMethod: {
    id: string;
    name: string;
    type: string;
  };
  createdByUser: {
    id: string;
    firstName: string;
    lastName: string;
  };
  items: ReceiptItem[];
  _count?: {
    items: number;
  };
}

export interface ReceiptItem {
  id: string;
  receiptId: string;
  invoiceId: string;
  invoiceNumber: string;
  invoiceTotal: number;
  amountPaid: number;
  previousBalance: number;
  invoice?: {
    id: string;
    invoiceNumber: string;
    invoiceDate: string | Date;
    totalAmount: number;
    status: string;
    items?: InvoiceItem[];
  };
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId: string;
  batchId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercentage: number;
  product: {
    id: string;
    name: string;
    sku: string;
  };
  batch?: {
    id: string;
    batchNumber: string;
  };
}

export interface OutstandingInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string | Date;
  dueDate: string | Date;
  totalAmount: number;
  amountPaid: number;
  outstandingBalance: number;
  status: string;
  isOverdue: boolean;
}

export interface PaymentQueryDto {
  customerId?: string;
  paymentMethodId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaymentFilters {
  customerId?: string;
  paymentMethodId?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaymentPaginatedResponse {
  data: Receipt[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TaxInformation {
  taxRate: number;
  totalBeforeTax: number;
  taxAmount: number;
  totalAmountPaidToInvoices: number;
  totalAmountReceived: number;
  balanceIssued: number;
  balanceCredited: number;
}

export interface BalanceExplanation {
  previousBalance: number;
  paymentReceived: number;
  invoicePayments: number;
  excessCredit: number;
  newBalance: number;
  balanceType: "DEBT" | "CREDIT" | "ZERO";
}

export interface SystemSettings {
  businessName: string;
  businessType?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  country?: string;
  taxNumber?: string;
}

export interface ReceiptWithDetails extends Receipt {
  taxInformation: TaxInformation;
  balanceExplanation?: BalanceExplanation;
  systemSettings: SystemSettings;
}
