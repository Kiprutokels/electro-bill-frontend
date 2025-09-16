import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Package,
  FileText,
  AlertTriangle,
  CreditCard,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS } from "@/utils/constants";
import { formatCurrency, formatNumber, formatPercentage } from "@/utils/format.utils";
import { useDashboard } from "@/hooks/useDashboard";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { RecentActivities } from "@/components/dashboard/RecentActivities";
import { TopLists } from "@/components/dashboard/TopLists";
import { OverdueInvoices } from "@/components/dashboard/OverdueInvoices";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";

const Dashboard = () => {
  const { user, hasPermission } = useAuth();
  const {
    dashboardData,
    loading,
    error,
    refreshing,
    dateRange,
    refresh,
    updateDateRange,
  } = useDashboard({ autoRefresh: true, refreshInterval: 300000 }); // 5 minutes

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="text-destructive">{error}</div>
          <Button onClick={refresh}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  const {
    salesMetrics,
    paymentMetrics,
    customerMetrics,
    inventoryMetrics,
    recentActivities,
    topProducts,
    topCustomers,
    cashFlowData,
    monthlyTrends,
    overdueInvoices,
    period,
  } = dashboardData;

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, { user?.email}! Here's your business overview.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={updateDateRange}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={refreshing}
            title="Refresh Dashboard"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Period Info */}
      {period && (
        <div className="text-sm text-muted-foreground">
          Showing data from {new Date(period.startDate).toLocaleDateString()} to{" "}
          {new Date(period.endDate).toLocaleDateString()}
        </div>
      )}

      {error && (
        <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales Metrics */}
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(salesMetrics.totalRevenue)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {salesMetrics.revenueGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className={salesMetrics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatPercentage(Math.abs(salesMetrics.revenueGrowth))}
              </span>
              <span className="ml-1">from previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Invoices
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(salesMetrics.totalInvoices)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {salesMetrics.invoicesGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className={salesMetrics.invoicesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatPercentage(Math.abs(salesMetrics.invoicesGrowth))}
              </span>
              <span className="ml-1">from previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Payments Received
            </CardTitle>
            <CreditCard className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(paymentMetrics.totalPayments)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {paymentMetrics.paymentGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className={paymentMetrics.paymentGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatPercentage(Math.abs(paymentMetrics.paymentGrowth))}
              </span>
              <span className="ml-1">from previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Invoice Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(salesMetrics.averageInvoiceValue)}
            </div>
            <div className="text-xs text-muted-foreground">
              Per transaction
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Customers
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(customerMetrics.totalCustomers)}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatNumber(customerMetrics.activeCustomers)} active
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding Debt
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {formatCurrency(customerMetrics.totalOutstandingDebt)}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatNumber(customerMetrics.customersWithDebt)} customers
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Products
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(inventoryMetrics.totalProducts)}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatNumber(inventoryMetrics.lowStockProducts)} low stock
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inventory Value
            </CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(inventoryMetrics.totalInventoryValue)}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatNumber(inventoryMetrics.totalQuantity)} items
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {hasPermission(PERMISSIONS.REPORTS_VIEW) && (
        <DashboardCharts
          monthlyTrends={monthlyTrends}
          cashFlowData={cashFlowData}
          paymentBreakdown={paymentMetrics.paymentBreakdown}
        />
      )}

      {/* Top Lists */}
      <TopLists topProducts={topProducts} topCustomers={topCustomers} />

      {/* Overdue Invoices */}
      {overdueInvoices.count > 0 && (
        <OverdueInvoices overdueData={overdueInvoices} />
      )}

      {/* Recent Activities */}
      <RecentActivities activities={recentActivities} />
    </div>
  );
};

export default Dashboard;
