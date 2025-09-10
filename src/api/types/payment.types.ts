export interface PaymentMethod {
  id: string;
  name: string;
  type: "CASH" | "MPESA" | "BANK_TRANSFER" | "CARD" | "CHECK";
  isActive: boolean;
  createdAt: string;
  _count?: {
    receipts: number;
  };
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  customerId?: string;
  supplierId?: string;
  invoiceId?: string;
  paymentMethodId: string;
  amount: number;
  paymentDate: string;
  referenceNumber?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  customer?: {
    id: string;
    customerCode: string;
    businessName?: string;
    contactPerson?: string;
    phone: string;
    email?: string;
  };
  supplier?: {
    id: string;
    supplierCode: string;
    companyName: string;
    contactPerson?: string;
    phone: string;
    email?: string;
  };
  invoice?: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    amountPaid: number;
    status: string;
  };
  paymentMethod: PaymentMethod;
  createdByUser: {
    firstName: string;
    lastName: string;
    username: string;
  };
}

export interface OutstandingInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  amountPaid: number;
  status: string;
  outstandingBalance: number;
}

export interface CustomerOutstanding {
  customer: {
    id: string;
    customerCode: string;
    businessName?: string;
    contactPerson?: string;
  };
  totalOutstanding: number;
  outstandingInvoices: OutstandingInvoice[];
}

export interface CreatePaymentRequest {
  customerId: string;
  paymentMethodId: string;
  totalAmount: number;
  referenceNumber?: string;
  notes?: string;
  invoiceAllocations?: Array<{
    invoiceId: string;
    amount: number;
  }>;
}

export interface PaymentSummary {
  totalReceipts: number;
  totalAmount: number;
  paymentMethodSummary: Array<{
    paymentMethod: string;
    type: string;
    count: number;
    amount: number;
  }>;
  dailySummary: Array<{
    date: string;
    count: number;
    amount: number;
  }>;
}

export interface Transaction {
  id: string;
  transactionNumber: string;
  transactionType:
    | "INVOICE"
    | "RECEIPT"
    | "PURCHASE"
    | "PAYMENT"
    | "ADJUSTMENT";
  referenceId?: string;
  customerId?: string;
  supplierId?: string;
  debit: number;
  credit: number;
  balanceBf: number;
  balanceCf: number;
  transactionDate: string;
  description?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  customer?: {
    id: string;
    customerCode: string;
    businessName?: string;
    contactPerson?: string;
  };
  supplier?: {
    id: string;
    supplierCode: string;
    companyName: string;
    contactPerson?: string;
  };
  createdByUser: {
    firstName: string;
    lastName: string;
    username: string;
  };
}
