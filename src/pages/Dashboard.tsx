import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DollarSign, 
  Package, 
  Users, 
  ShoppingCart,
  TrendingUp,
  AlertTriangle 
} from 'lucide-react';

const Dashboard = () => {
  // Mock data - replace with real API calls
  const stats = {
    totalRevenue: 125400,
    totalProducts: 342,
    totalCustomers: 89,
    pendingOrders: 12,
    lowStockItems: 8,
    monthlyGrowth: 12.5
  };

  const recentTransactions = [
    { id: 1, customer: 'ABC Electronics', amount: 2500, date: '2025-01-15', status: 'Paid' },
    { id: 2, customer: 'Tech Solutions', amount: 1800, date: '2025-01-14', status: 'Pending' },
    { id: 3, customer: 'Network Systems', amount: 3200, date: '2025-01-14', status: 'Paid' },
  ];

  const lowStockProducts = [
    { id: 1, name: 'TP-Link Router AC1200', stock: 3, reorderLevel: 10 },
    { id: 2, name: 'Cat6 Ethernet Cable', stock: 5, reorderLevel: 25 },
    { id: 3, name: 'Power Extension 5M', stock: 2, reorderLevel: 15 },
  ];

  return (
    <div className="space-responsive">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-responsive">
        <h1 className="text-responsive-3xl font-bold text-foreground">Dashboard</h1>
        <div className="text-responsive-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid-responsive grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-responsive-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-responsive-xl font-bold text-foreground">
              KES {stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-responsive-sm text-muted-foreground mt-1">
              <span className="text-green-600 dark:text-green-400 font-medium">+{stats.monthlyGrowth}%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-responsive-sm font-medium text-muted-foreground">
              Total Products
            </CardTitle>
            <Package className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-responsive-xl font-bold text-foreground">
              {stats.totalProducts}
            </div>
            <p className="text-responsive-sm text-muted-foreground mt-1">
              Active inventory items
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-responsive-sm font-medium text-muted-foreground">
              Customers
            </CardTitle>
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-responsive-xl font-bold text-foreground">
              {stats.totalCustomers}
            </div>
            <p className="text-responsive-sm text-muted-foreground mt-1">
              Active customers
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-responsive-sm font-medium text-muted-foreground">
              Pending Orders
            </CardTitle>
            <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 dark:text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-responsive-xl font-bold text-foreground">
              {stats.pendingOrders}
            </div>
            <p className="text-responsive-sm text-muted-foreground mt-1">
              Awaiting processing
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 space-responsive">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span>Recent Transactions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-responsive">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-muted/30 rounded-lg space-responsive">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate text-responsive-sm">{transaction.customer}</p>
                    <p className="text-responsive-sm text-muted-foreground">{transaction.date}</p>
                  </div>
                  <div className="flex sm:flex-col sm:text-right space-responsive">
                    <p className="font-medium text-foreground text-responsive-sm">KES {transaction.amount.toLocaleString()}</p>
                    <span className={`text-responsive-sm px-2 py-1 rounded-full whitespace-nowrap ${
                      transaction.status === 'Paid' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                    }`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
              <span>Low Stock Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-responsive">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 space-responsive">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate text-responsive-sm">{product.name}</p>
                    <p className="text-responsive-sm text-muted-foreground">
                      Reorder Level: {product.reorderLevel}
                    </p>
                  </div>
                  <div className="flex sm:justify-end">
                    <span className="bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100 px-3 py-1 rounded-full text-responsive-sm font-medium whitespace-nowrap">
                      {product.stock} left
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;