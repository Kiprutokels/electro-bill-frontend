export enum TransactionType {
  INVOICE = "INVOICE",
  RECEIPT = "RECEIPT",
  PURCHASE = "PURCHASE",
  PAYMENT = "PAYMENT",
  ADJUSTMENT = "ADJUSTMENT",
  CREDIT_NOTE = "CREDIT_NOTE",
}

export interface TransactionCustomer {
  id: string;
  customerCode: string;
  businessName?: string;
  contactPerson: string;
}

export interface TransactionSupplier {
  id: string;
  supplierCode: string;
  companyName: string;
  contactPerson?: string;
}

export interface TransactionUser {
  id: string;
  firstName: string;
  lastName: string;
}

export interface Transaction {
  id: string;
  transactionNumber: string;
  transactionType: TransactionType;
  referenceId?: string;
  customerId?: string;
  supplierId?: string;
  debit: string;
  credit: string;
  balanceBf: string;
  balanceCf: string;
  transactionDate: string;
  description?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  customer?: TransactionCustomer;
  supplier?: TransactionSupplier;
  createdByUser?: TransactionUser;
}

export interface TransactionFilters {
  customerId?: string;
  supplierId?: string;
  transactionType?: TransactionType;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface TransactionPaginatedResponse {
  data: Transaction[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TransactionSummary {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalTransactions: number;
    totalDebits: number;
    totalCredits: number;
    netMovement: number;
  };
  byType: Array<{
    transactionType: TransactionType;
    count: number;
    totalDebits: number;
    totalCredits: number;
  }>;
}

export interface CustomerStatement {
  customer: {
    id: string;
    customerCode: string;
    businessName?: string;
    contactPerson: string;
    phone: string;
    email?: string;
    currentBalance: string;
  };
  period: {
    startDate: string;
    endDate: string;
  };
  openingBalance: number;
  closingBalance: number;
  summary: {
    totalDebits: number;
    totalCredits: number;
    netMovement: number;
  };
  transactions: Transaction[];
}
