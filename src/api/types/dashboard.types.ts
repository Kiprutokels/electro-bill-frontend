export interface MonthlyTrendData {
  month: number;
  monthName: string;
  invoiceRevenue: number;
  invoiceCount: number;
  paymentAmount: number;
  paymentCount: number;
}

export interface SalesMetrics {
  totalRevenue: number;
  revenueGrowth: number;
  totalInvoices: number;
  invoicesGrowth: number;
  averageInvoiceValue: number;
}

export interface PaymentMetrics {
  totalPayments: number;
  paymentGrowth: number;
  totalTransactions: number;
  paymentBreakdown: {
    method: string;
    amount: number;
    count: number;
  }[];
}

export interface CustomerMetrics {
  totalCustomers: number;
  activeCustomers: number;
  customersWithDebt: number;
  customersWithCredit: number;
  totalOutstandingDebt: number;
  totalCustomerCredit: number;
}

export interface InventoryMetrics {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalInventoryValue: number;
  totalQuantity: number;
}

export interface RecentActivity {
  type: 'invoice' | 'payment' | 'quotation';
  id: string;
  number: string;
  customer: string;
  amount: number;
  status?: string;
  method?: string;
  date: Date;
}

export interface TopProduct {
  product: {
    name: string;
    sku: string;
    sellingPrice: any;
    category: { name: string } | null;
    brand: { name: string } | null;
  } | null;
  totalQuantitySold: number;
  totalOrders: number;
  revenue: number;
}

export interface TopCustomer {
  customer: {
    customerCode: string;
    businessName: string | null;
    contactPerson: string | null;
    currentBalance: any;
  } | null;
  totalRevenue: number;
  totalInvoices: number;
}

export interface CashFlowData {
  dailyInvoices: {
    date: Date;
    amount: number;
  }[];
  dailyPayments: {
    date: Date;
    amount: number;
  }[];
}

export interface OverdueInvoiceData {
  count: number;
  totalAmount: number;
  invoices: {
    id: string;
    invoiceNumber: string;
    customer: string;
    totalAmount: number;
    amountPaid: number;
    outstandingAmount: number;
    dueDate: Date;
    daysPastDue: number;
  }[];
}

export interface DashboardOverview {
  period: {
    startDate: Date;
    endDate: Date;
  };
  salesMetrics: SalesMetrics;
  paymentMetrics: PaymentMetrics;
  customerMetrics: CustomerMetrics;
  inventoryMetrics: InventoryMetrics;
  recentActivities: {
    recentInvoices: RecentActivity[];
    recentPayments: RecentActivity[];
    recentQuotations: RecentActivity[];
  };
  topProducts: TopProduct[];
  topCustomers: TopCustomer[];
  cashFlowData: CashFlowData;
  monthlyTrends: MonthlyTrendData[];
  overdueInvoices: OverdueInvoiceData;
}

export interface DashboardQueryDto {
  startDate?: string;
  endDate?: string;
}
