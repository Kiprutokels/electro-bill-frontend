export interface Transaction {
  id: string;
  invoiceId: string;
  paymentId: string;
  amount: number;
  type: 'PAYMENT' | 'REFUND' | 'ADJUSTMENT';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  reference?: string;
  description?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
  invoice?: {
    id: string;
    invoiceNumber: string;
    customerName: string;
    totalAmount: number;
  };
  payment?: {
    id: string;
    method: string;
    amount: number;
    status: string;
  };
}

export interface CreateTransactionDto {
  invoiceId: string;
  paymentId: string;
  amount: number;
  type: 'PAYMENT' | 'REFUND' | 'ADJUSTMENT';
  reference?: string;
  description?: string;
}

export interface UpdateTransactionDto {
  status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  reference?: string;
  description?: string;
  processedAt?: string;
}

export interface TransactionFilters {
  invoiceId?: string;
  paymentId?: string;
  type?: 'PAYMENT' | 'REFUND' | 'ADJUSTMENT';
  status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
}
