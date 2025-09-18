import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Search,
  Eye,
  RefreshCw,
  Loader2,
  MoreHorizontal,
  FileText,
  TrendingUp,
  Users,
  Building2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS } from "@/utils/constants";
import { 
  Transaction, 
  TransactionType,
  TransactionFilters 
} from "@/api/types/transaction.types";
import { formatCurrency, formatDate } from "@/utils/format.utils";
import { useTransactions } from "@/hooks/useTransactions";
import { useTransactionSummary } from "@/hooks/useTransactionSummary";
import TransactionViewDialog from "@/components/transactions/TransactionViewDialog";

const Transactions = () => {
  const { hasPermission } = useAuth();
  const [dateRange, setDateRange] = useState<{from?: Date; to?: Date}>({});
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const {
    transactions,
    loading,
    error,
    refreshing,
    currentPage,
    totalPages,
    totalItems,
    searchTerm,
    filters,
    fetchTransactions,
    refresh,
    updateSearch,
    updateFilters,
    setCurrentPage,
  } = useTransactions();

  const { summary } = useTransactionSummary(
    dateRange.from?.toISOString().split('T')[0],
    dateRange.to?.toISOString().split('T')[0]
  );

  const handleView = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsViewDialogOpen(true);
  };

  const handleFilterChange = (key: keyof TransactionFilters, value: string) => {
    if (value === "all") {
      const { [key]: _, ...restFilters } = filters;
      updateFilters(restFilters);
    } else {
      updateFilters({ ...filters, [key]: value });
    }
  };

  const handleDateRangeChange = (range: {from?: Date; to?: Date} | undefined) => {
    setDateRange(range || {});
    updateFilters({
      ...filters,
      startDate: range?.from?.toISOString().split('T')[0],
      endDate: range?.to?.toISOString().split('T')[0],
    });
  };

  const getTransactionTypeBadge = (type: TransactionType) => {
    const typeConfigs = {
      [TransactionType.INVOICE]: {
        variant: "default" as const,
        icon: ArrowUpCircle,
        className: "bg-blue-500 text-white hover:bg-blue-600",
      },
      [TransactionType.RECEIPT]: {
        variant: "default" as const,
        icon: ArrowDownCircle,
        className: "bg-green-500 text-white hover:bg-green-600",
      },
      [TransactionType.PURCHASE]: {
        variant: "default" as const,
        icon: ArrowUpCircle,
        className: "bg-purple-500 text-white hover:bg-purple-600",
      },
      [TransactionType.PAYMENT]: {
        variant: "default" as const,
        icon: ArrowDownCircle,
        className: "bg-orange-500 text-white hover:bg-orange-600",
      },
      [TransactionType.ADJUSTMENT]: {
        variant: "secondary" as const,
        icon: FileText,
        className: "bg-gray-500 text-white hover:bg-gray-600",
      },
      [TransactionType.CREDIT_NOTE]: {
        variant: "default" as const,
        icon: ArrowDownCircle,
        className: "bg-red-500 text-white hover:bg-red-600",
      },
    };

    const config = typeConfigs[type];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        <span className="hidden sm:inline">
          {type.replace('_', ' ')}
        </span>
        <span className="sm:hidden">
          {type.slice(0, 3)}
        </span>
      </Badge>
    );
  };

  // Calculate stats
  const stats = useMemo(() => {
    const totalTransactions = totalItems;
    const totalDebits = transactions.reduce((sum, t) => sum + Number(t.debit || 0), 0);
    const totalCredits = transactions.reduce((sum, t) => sum + Number(t.credit || 0), 0);
    const netMovement = totalDebits - totalCredits;

    return {
      totalTransactions,
      totalDebits,
      totalCredits,
      netMovement,
    };
  }, [transactions, totalItems]);

  if (!hasPermission(PERMISSIONS.PAYMENTS_READ)) {
    return (
      <div className="p-4 sm:p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>You don't have permission to view transactions.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 xs:p-4 sm:p-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-foreground break-words">
            Transactions
          </h1>
          <p className="text-xs xs:text-sm text-muted-foreground mt-1">
            View all system-generated financial transactions
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-2 xs:gap-3 sm:gap-4">
        <Card className="border-l-4 border-l-primary min-w-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 xs:px-4 sm:px-6 pt-3 xs:pt-4 sm:pt-6">
            <CardTitle className="text-xs xs:text-sm font-medium text-muted-foreground truncate pr-2">
              Total Transactions
            </CardTitle>
            <FileText className="h-3 w-3 xs:h-4 xs:w-4 text-primary flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 xs:px-4 sm:px-6 pb-3 xs:pb-4 sm:pb-6">
            <div className="text-lg xs:text-xl sm:text-2xl font-bold text-foreground break-all">
              {stats.totalTransactions}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 min-w-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 xs:px-4 sm:px-6 pt-3 xs:pt-4 sm:pt-6">
            <CardTitle className="text-xs xs:text-sm font-medium text-muted-foreground truncate pr-2">
              <span className="hidden xs:inline">Total Debits</span>
              <span className="xs:hidden">Debits</span>
            </CardTitle>
            <ArrowUpCircle className="h-3 w-3 xs:h-4 xs:w-4 text-red-500 flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 xs:px-4 sm:px-6 pb-3 xs:pb-4 sm:pb-6">
            <div className="text-sm xs:text-lg sm:text-2xl font-bold text-foreground break-all leading-tight">
              {formatCurrency(stats.totalDebits)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 min-w-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 xs:px-4 sm:px-6 pt-3 xs:pt-4 sm:pt-6">
            <CardTitle className="text-xs xs:text-sm font-medium text-muted-foreground truncate pr-2">
              <span className="hidden xs:inline">Total Credits</span>
              <span className="xs:hidden">Credits</span>
            </CardTitle>
            <ArrowDownCircle className="h-3 w-3 xs:h-4 xs:w-4 text-green-500 flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 xs:px-4 sm:px-6 pb-3 xs:pb-4 sm:pb-6">
            <div className="text-sm xs:text-lg sm:text-2xl font-bold text-foreground break-all leading-tight">
              {formatCurrency(stats.totalCredits)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 min-w-0 xs:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 xs:px-4 sm:px-6 pt-3 xs:pt-4 sm:pt-6">
            <CardTitle className="text-xs xs:text-sm font-medium text-muted-foreground truncate pr-2">
              <span className="hidden xs:inline">Net Movement</span>
              <span className="xs:hidden">Net</span>
            </CardTitle>
            <TrendingUp className="h-3 w-3 xs:h-4 xs:w-4 text-blue-500 flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 xs:px-4 sm:px-6 pb-3 xs:pb-4 sm:pb-6">
            <div className={`text-sm xs:text-lg sm:text-2xl font-bold break-all leading-tight ${
              stats.netMovement >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(stats.netMovement)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="min-w-0">
        <CardHeader className="px-3 xs:px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <CardTitle className="text-base xs:text-lg sm:text-xl">Transaction History</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto min-w-0">
              <div className="relative flex-1 sm:w-64 min-w-0">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => updateSearch(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
              
              <div className="flex gap-2 flex-wrap min-w-0">
                <Select
                  value={filters.transactionType || "all"}
                  onValueChange={(value) => handleFilterChange('transactionType', value)}
                >
                  <SelectTrigger className="w-full sm:w-32 lg:w-40 min-w-0">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.values(TransactionType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="hidden sm:block min-w-0">
                  <DatePickerWithRange
                    date={dateRange}
                    onDateChange={handleDateRangeChange}
                  />
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={refresh}
                  disabled={refreshing}
                  title="Refresh"
                  className="flex-shrink-0"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Date Filter */}
          <div className="sm:hidden">
            <DatePickerWithRange
              date={dateRange}
              onDateChange={handleDateRangeChange}
            />
          </div>
        </CardHeader>

        <CardContent className="p-0 sm:p-6">
          {error && (
            <div className="mb-4 mx-4 sm:mx-0 p-4 border border-destructive/20 rounded-lg bg-destructive/5">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          )}

          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px] xs:min-w-[140px] text-xs xs:text-sm">Transaction #</TableHead>
                    <TableHead className="min-w-[80px] xs:min-w-[100px] text-xs xs:text-sm">Type</TableHead>
                    <TableHead className="hidden sm:table-cell min-w-[100px] xs:min-w-[120px] text-xs xs:text-sm">Date</TableHead>
                    <TableHead className="min-w-[150px] xs:min-w-[200px] text-xs xs:text-sm">Entity</TableHead>
                    <TableHead className="text-right min-w-[80px] xs:min-w-[100px] text-xs xs:text-sm">Debit</TableHead>
                    <TableHead className="text-right min-w-[80px] xs:min-w-[100px] text-xs xs:text-sm">Credit</TableHead>
                    <TableHead className="text-right min-w-[80px] xs:min-w-[100px] text-xs xs:text-sm">Balance</TableHead>
                    <TableHead className="text-right min-w-[50px] xs:min-w-[60px] text-xs xs:text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="text-muted-foreground text-sm">
                          {searchTerm
                            ? "No transactions found matching your search."
                            : "No transactions found."}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-mono text-xs break-all">
                              {transaction.transactionNumber}
                            </div>
                            <div className="sm:hidden text-xs text-muted-foreground">
                              {formatDate(transaction.transactionDate)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getTransactionTypeBadge(transaction.transactionType)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">
                          {formatDate(transaction.transactionDate)}
                        </TableCell>
                        <TableCell>
                          <div className="min-w-0">
                            {transaction.customer && (
                              <>
                                <div className="flex items-center space-x-1 min-w-0">
                                  <Users className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                  <span className="font-medium text-sm truncate">
                                    {transaction.customer.businessName ||
                                      transaction.customer.contactPerson}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {transaction.customer.customerCode}
                                </div>
                              </>
                            )}
                            {transaction.supplier && (
                              <>
                                <div className="flex items-center space-x-1 min-w-0">
                                  <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                  <span className="font-medium text-sm truncate">
                                    {transaction.supplier.companyName}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {transaction.supplier.supplierCode}
                                </div>
                              </>
                            )}
                            {!transaction.customer && !transaction.supplier && (
                              <span className="text-muted-foreground text-sm">System</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`text-xs xs:text-sm ${Number(transaction.debit) > 0 ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                            {Number(transaction.debit) > 0 ? formatCurrency(Number(transaction.debit)) : '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`text-xs xs:text-sm ${Number(transaction.credit) > 0 ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                            {Number(transaction.credit) > 0 ? formatCurrency(Number(transaction.credit)) : '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-medium text-xs xs:text-sm ${
                            Number(transaction.balanceCf) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(Number(transaction.balanceCf))}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-6 w-6 xs:h-8 xs:w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-3 w-3 xs:h-4 xs:w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleView(transaction)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 px-4 sm:px-0 gap-4">
              <p className="text-xs xs:text-sm text-muted-foreground text-center sm:text-left">
                Showing {(currentPage - 1) * 10 + 1} to{" "}
                {Math.min(currentPage * 10, totalItems)} of {totalItems} entries
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchTransactions(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="text-xs xs:text-sm"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchTransactions(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                  className="text-xs xs:text-sm"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction View Dialog */}
      {selectedTransaction && (
        <TransactionViewDialog
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          transaction={selectedTransaction}
        />
      )}
    </div>
  );
};

export default Transactions;
