export interface CustomerDetailCustomer {
  id: string;
  customerCode: string;
  businessName?: string | null;
  contactPerson?: string | null;
  email?: string | null;
  phone: string;
  alternatePhone?: string | null;
  taxNumber?: string | null;
  creditLimit: number;
  currentBalance: number;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  country: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerDetailVehicle {
  id: string;
  vehicleReg: string;
  make: string;
  model: string;
  color?: string | null;
  chassisNo: string;
  mileage?: number | null;
  iccidSimcard?: string | null;
  yearOfManufacture?: number | null;
  vehicleType?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerDetailSubscription {
  id: string;
  subscriptionNumber: string;
  startDate: string;
  expiryDate: string;
  status: string;
  autoRenew: boolean;
  renewalPrice?: number | null;
  product: {
    id: string;
    name: string;
    sku: string;
    sellingPrice: number;
    subscriptionFee: number;
    isActive: boolean;
  };
  invoice?: {
    id: string;
    invoiceNumber: string;
    status: string;
    totalAmount: number;
    amountPaid: number;
    invoiceDate: string;
    dueDate: string;
    jobId?: string | null;
  } | null;
  renewals: Array<{
    id: string;
    invoiceId: string;
    startDate: string;
    expiryDate: string;
    amount: number;
    paidAt: string;
    invoice: {
      id: string;
      invoiceNumber: string;
      status: string;
      totalAmount: number;
      amountPaid: number;
      invoiceDate: string;
    };
  }>;
}

export interface CustomerDetailResponse {
  customer: CustomerDetailCustomer;
  vehicles: CustomerDetailVehicle[];
  subscriptions: CustomerDetailSubscription[];
  subscriptionRenewals: any[];
  invoices: any[];
  receipts: any[];
  transactions: any[];
  jobs: any[];
  totals: {
    vehicles: number;
    subscriptions: number;
    renewals: number;
    invoices: number;
    receipts: number;
    transactions: number;
    jobs: number;
  };
  financials: {
    currentBalance: number;
    creditLimit: number;
    totalInvoiced: number;
    totalPaid: number;
    totalOutstanding: number;
  };
  generatedAt: string;
}
