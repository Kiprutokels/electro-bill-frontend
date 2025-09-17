import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, TrendingUp, TrendingDown, DollarSign, Users, Package, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

// Mock data for charts
const salesTrendData = [
  { name: 'Jan', sales: 4000, expenses: 2400 },
  { name: 'Feb', sales: 3000, expenses: 1398 },
  { name: 'Mar', sales: 2000, expenses: 9800 },
  { name: 'Apr', sales: 2780, expenses: 3908 },
  { name: 'May', sales: 1890, expenses: 4800 },
  { name: 'Jun', sales: 2390, expenses: 3800 },
];

const expenseTrendData = [
  { name: 'Week 1', amount: 1200 },
  { name: 'Week 2', amount: 1900 },
  { name: 'Week 3', amount: 800 },
  { name: 'Week 4', amount: 1600 },
];

// Mock data for tables
const salesLedgerData = [
  { id: 1, date: '2024-01-15', invoiceId: 'INV-001', customer: 'John Electronics', amount: 25000 },
  { id: 2, date: '2024-01-14', invoiceId: 'INV-002', customer: 'Tech Solutions', amount: 18500 },
  { id: 3, date: '2024-01-13', invoiceId: 'INV-003', customer: 'Power Systems', amount: 32000 },
  { id: 4, date: '2024-01-12', invoiceId: 'INV-004', customer: 'Digital Corp', amount: 12750 },
  { id: 5, date: '2024-01-11', invoiceId: 'INV-005', customer: 'Smart Devices', amount: 28900 },
];

const purchaseLedgerData = [
  { id: 1, date: '2024-01-15', supplier: 'Component Supplier A', item: 'Resistors Pack', amount: 5000 },
  { id: 2, date: '2024-01-14', supplier: 'Electronics Wholesale', item: 'Capacitors', amount: 8500 },
  { id: 3, date: '2024-01-13', supplier: 'Tech Components Ltd', item: 'IC Chips', amount: 15000 },
  { id: 4, date: '2024-01-12', supplier: 'Wire Solutions', item: 'Copper Wires', amount: 3200 },
  { id: 5, date: '2024-01-11', supplier: 'Battery Corp', item: 'Lithium Batteries', amount: 12000 },
];

const customReportData = [
  { id: 1, product: 'Smart Switch', category: 'Switches', sales: 150, revenue: 75000, profit: 22500 },
  { id: 2, product: 'LED Bulb 12W', category: 'Lighting', sales: 300, revenue: 90000, profit: 27000 },
  { id: 3, product: 'Circuit Breaker', category: 'Safety', sales: 85, revenue: 68000, profit: 20400 },
  { id: 4, product: 'Extension Cord', category: 'Accessories', sales: 200, revenue: 40000, profit: 12000 },
  { id: 5, product: 'Motor 1HP', category: 'Motors', sales: 25, revenue: 62500, profit: 18750 },
];

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [dateRange, setDateRange] = useState('last-30-days');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  // Mock profit/loss calculations
  const totalRevenue = 117150;
  const totalExpenses = 43700;
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = ((netProfit / totalRevenue) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-responsive-3xl font-bold text-foreground">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-2">Comprehensive business insights and financial reporting</p>
      </div>

      <Tabs defaultValue="income-expense" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="income-expense">Income & Expenses</TabsTrigger>
          <TabsTrigger value="ledgers">Ledgers</TabsTrigger>
          <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
          <TabsTrigger value="custom">Custom Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="income-expense" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <h2 className="text-responsive-xl font-semibold">Income & Expense Tracking</h2>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Sales Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Sales Trends
                </CardTitle>
                <CardDescription>Monthly sales performance overview</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesTrendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-muted-foreground" />
                    <YAxis className="text-muted-foreground" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="sales" fill="hsl(var(--primary))" name="Sales" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Expense Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-destructive" />
                  Expense Trends
                </CardTitle>
                <CardDescription>Weekly expense analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={expenseTrendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-muted-foreground" />
                    <YAxis className="text-muted-foreground" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line type="monotone" dataKey="amount" stroke="hsl(var(--destructive))" strokeWidth={2} name="Expenses" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ledgers" className="space-y-6">
          <h2 className="text-responsive-xl font-semibold">Sales & Purchase Ledgers</h2>
          
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Sales Ledger */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Sales Ledger
                </CardTitle>
                <CardDescription>Recent sales transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Invoice ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesLedgerData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm">{item.date}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.invoiceId}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{item.customer}</TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          {formatCurrency(item.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Purchase Ledger */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-orange-500" />
                  Purchase Ledger
                </CardTitle>
                <CardDescription>Recent purchase transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseLedgerData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm">{item.date}</TableCell>
                        <TableCell className="font-medium">{item.supplier}</TableCell>
                        <TableCell>{item.item}</TableCell>
                        <TableCell className="text-right font-semibold text-destructive">
                          {formatCurrency(item.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profit-loss" className="space-y-6">
          <h2 className="text-responsive-xl font-semibold">Profit & Loss Analysis</h2>
          
          <div className="grid gap-6 md:grid-cols-3">
            {/* Total Revenue Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{formatCurrency(totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  +12.5% from last month
                </p>
              </CardContent>
            </Card>

            {/* Total Expenses Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <TrendingDown className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{formatCurrency(totalExpenses)}</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingDown className="inline h-3 w-3 mr-1" />
                  +8.2% from last month
                </p>
              </CardContent>
            </Card>

            {/* Net Profit Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                <TrendingUp className={`h-4 w-4 ${netProfit > 0 ? 'text-green-500' : 'text-destructive'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${netProfit > 0 ? 'text-green-500' : 'text-destructive'}`}>
                  {formatCurrency(netProfit)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Profit Margin: {profitMargin}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Profit/Loss Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Expenses</CardTitle>
              <CardDescription>Monthly comparison of revenue and expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={salesTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="sales" fill="hsl(var(--primary))" name="Revenue" />
                  <Bar dataKey="expenses" fill="hsl(var(--destructive))" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <h2 className="text-responsive-xl font-semibold">Custom Reports</h2>
            <Button className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Export Report
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Report Filters</CardTitle>
              <CardDescription>Customize your report parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                      <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                      <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                      <SelectItem value="last-year">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="switches">Switches</SelectItem>
                      <SelectItem value="lighting">Lighting</SelectItem>
                      <SelectItem value="safety">Safety</SelectItem>
                      <SelectItem value="accessories">Accessories</SelectItem>
                      <SelectItem value="motors">Motors</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Product</label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Products</SelectItem>
                      <SelectItem value="smart-switch">Smart Switch</SelectItem>
                      <SelectItem value="led-bulb">LED Bulb 12W</SelectItem>
                      <SelectItem value="circuit-breaker">Circuit Breaker</SelectItem>
                      <SelectItem value="extension-cord">Extension Cord</SelectItem>
                      <SelectItem value="motor">Motor 1HP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custom Report Table */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Report</CardTitle>
              <CardDescription>Product performance analysis based on selected filters</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Units Sold</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customReportData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.product}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{item.sales}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        {formatCurrency(item.revenue)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        {formatCurrency(item.profit)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="text-green-600">
                          {((item.profit / item.revenue) * 100).toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
