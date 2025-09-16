import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  FileText, 
  Calendar, 
  Download, 
  Loader2, 
  TrendingUp,
  TrendingDown,
  Receipt,
  ShoppingCart
} from 'lucide-react';
import { Customer, customersService, CustomerStatementParams } from '@/api/services/customers.service';
import { formatCurrency, formatDate } from '@/utils/format.utils';
import { toast } from 'sonner';

interface CustomerStatementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
}

interface StatementData {
  customer: Customer;
  period: {
    startDate: string;
    endDate: string;
  };
  openingBalance: number;
  closingBalance: number;
  summary: {
    totalInvoiced: number;
    totalPaid: number;
    netChange: number;
  };
  transactions: Array<{
    id: string;
    transactionNumber: string;
    transactionType: string;
    transactionDate: string;
    description: string;
    debit: number;
    credit: number;
    balanceCf: number;
  }>;
  invoices: Array<any>;
  receipts: Array<any>;
}

const CustomerStatementDialog: React.FC<CustomerStatementDialogProps> = ({
  open,
  onOpenChange,
  customer,
}) => {
  const [loading, setLoading] = useState(false);
  const [statementData, setStatementData] = useState<StatementData | null>(null);
  const [dateRange, setDateRange] = useState<CustomerStatementParams>({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const fetchStatement = async () => {
    if (!customer?.id) return;

    setLoading(true);
    try {
      const data = await customersService.getCustomerStatement(customer.id, dateRange);
      setStatementData(data);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch statement';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && customer?.id) {
      fetchStatement();
    }
  }, [open, customer?.id]);

  const handleDateRangeChange = (field: keyof CustomerStatementParams, value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRefreshStatement = () => {
    fetchStatement();
  };

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'INVOICE':
        return <ShoppingCart className="h-4 w-4 text-red-500" />;
      case 'RECEIPT':
        return <Receipt className="h-4 w-4 text-green-500" />;
      default:
        return <FileText className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTransactionTypeBadge = (type: string) => {
    const variants: Record<string, any> = {
      INVOICE: 'destructive',
      RECEIPT: 'default',
      PAYMENT: 'default',
      ADJUSTMENT: 'secondary',
      CREDIT_NOTE: 'secondary',
    };

    return (
      <Badge variant={variants[type] || 'secondary'} className="text-xs">
        {type.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Customer Statement - {customer?.businessName || customer?.contactPerson}
            </DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Range Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statement Period</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                  />
                </div>
                <Button onClick={handleRefreshStatement} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calendar className="mr-2 h-4 w-4" />}
                  {loading ? 'Loading...' : 'Generate Statement'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Generating statement...</p>
              </div>
            </div>
          ) : statementData ? (
            <>
              {/* Statement Header */}
              <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Customer Information</h3>
                      <div className="space-y-2">
                        <p><span className="font-medium">Name:</span> {customer.businessName || customer.contactPerson}</p>
                        <p><span className="font-medium">Code:</span> {customer.customerCode}</p>
                        <p><span className="font-medium">Phone:</span> {customer.phone}</p>
                        {customer.email && <p><span className="font-medium">Email:</span> {customer.email}</p>}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Statement Period</h3>
                      <div className="space-y-2">
                        <p><span className="font-medium">From:</span> {formatDate(statementData.period.startDate)}</p>
                        <p><span className="font-medium">To:</span> {formatDate(statementData.period.endDate)}</p>
                        <p><span className="font-medium">Generated:</span> {formatDate(new Date().toISOString())}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statement Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Opening Balance</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${
                      statementData.openingBalance > 0 ? 'text-red-600' : 
                      statementData.openingBalance < 0 ? 'text-green-600' : 'text-muted-foreground'
                    }`}>
                      {formatCurrency(statementData.openingBalance)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(statementData.summary.totalInvoiced)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                    <TrendingDown className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(statementData.summary.totalPaid)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Closing Balance</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${
                      statementData.closingBalance > 0 ? 'text-red-600' : 
                      statementData.closingBalance < 0 ? 'text-green-600' : 'text-muted-foreground'
                    }`}>
                      {formatCurrency(statementData.closingBalance)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Transactions Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                  {statementData.transactions.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium">No transactions found</p>
                      <p className="text-sm text-muted-foreground">
                        No transactions were recorded during the selected period.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Transaction #</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Debit</TableHead>
                            <TableHead className="text-right">Credit</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {statementData.transactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell>{formatDate(transaction.transactionDate)}</TableCell>
                              <TableCell className="font-medium">{transaction.transactionNumber}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getTransactionTypeIcon(transaction.transactionType)}
                                  {getTransactionTypeBadge(transaction.transactionType)}
                                </div>
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate" title={transaction.description}>
                                {transaction.description}
                              </TableCell>
                              <TableCell className="text-right">
                                {transaction.debit > 0 && (
                                  <span className="text-red-600 font-medium">
                                    {formatCurrency(transaction.debit)}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {transaction.credit > 0 && (
                                  <span className="text-green-600 font-medium">
                                    {formatCurrency(transaction.credit)}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className={`text-right font-medium ${
                                transaction.balanceCf > 0 ? 'text-red-600' : 
                                transaction.balanceCf < 0 ? 'text-green-600' : 'text-muted-foreground'
                              }`}>
                                {formatCurrency(transaction.balanceCf)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No statement data</p>
              <p className="text-sm text-muted-foreground">
                Select a date range and click "Generate Statement" to view the customer statement.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerStatementDialog;