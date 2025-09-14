import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  RefreshCw,
  Loader2,
  Eye,
  Trash2,
  MoreHorizontal,
  CreditCard,
  DollarSign,
  Receipt,
  Settings,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS } from "@/utils/constants";
import { formatCurrency, formatDate } from "@/utils/format.utils";
import { usePayments } from "@/hooks/usePayments";
import { usePaymentActions } from "@/hooks/usePaymentActions";
import { Receipt as ReceiptType } from "@/api/types/payment.types";
import ProcessPaymentDialog from "@/components/payments/ProcessPaymentDialog";
import ReceiptViewDialog from "@/components/payments/ReceiptViewDialog";
import PaymentMethodsDialog from "@/components/payments/PaymentMethodsDialog";
import { toast } from "sonner";

const Payments = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const {
    receipts,
    loading,
    error,
    refreshing,
    currentPage,
    totalPages,
    totalItems,
    searchTerm,
    filters,
    fetchReceipts,
    refresh,
    updateSearch,
    updateFilters,
    removeReceiptFromList,
    setCurrentPage,
  } = usePayments();

  const { loading: actionLoading, deleteReceipt } = usePaymentActions();

  // Dialog states
  const [isProcessPaymentOpen, setIsProcessPaymentOpen] = useState(false);
  const [isReceiptViewOpen, setIsReceiptViewOpen] = useState(false);
  const [isPaymentMethodsOpen, setIsPaymentMethodsOpen] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState<ReceiptType | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptType | null>(null);

  const handleView = (receipt: ReceiptType) => {
    setSelectedReceipt(receipt);
    setIsReceiptViewOpen(true);
  };

  const handleDeleteClick = (receipt: ReceiptType) => {
    setReceiptToDelete(receipt);
  };

  const handleDeleteConfirm = async () => {
    if (!receiptToDelete) return;

    try {
      await deleteReceipt(receiptToDelete.id);
      removeReceiptFromList(receiptToDelete.id);
      setReceiptToDelete(null);
      toast.success("Receipt deleted successfully");
    } catch (err) {
      // Error handled in hook
    }
  };

  const handleDateFilterChange = (field: 'startDate' | 'endDate', value: string) => {
    if (value === "") {
      const { [field]: _, ...restFilters } = filters;
      updateFilters(restFilters);
    } else {
      updateFilters({ ...filters, [field]: value });
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const totalReceipts = totalItems;
    const totalAmount = receipts.reduce(
      (sum, receipt) => sum + Number(receipt.totalAmount || 0),
      0
    );
    const avgReceiptAmount = totalReceipts > 0 ? totalAmount / totalReceipts : 0;
    
    const today = new Date().toDateString();
    const todayReceipts = receipts.filter((receipt) => {
      const receiptDate = typeof receipt.paymentDate === 'string' 
        ? receipt.paymentDate 
        : receipt.paymentDate.toString();
      return new Date(receiptDate).toDateString() === today;
    }).length;

    return {
      totalReceipts,
      totalAmount,
      avgReceiptAmount,
      todayReceipts,
    };
  }, [receipts, totalItems]);

  if (loading && receipts.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Payments & Receipts
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage customer payments and generate receipts
          </p>
        </div>
        <div className="flex gap-2">
          {hasPermission(PERMISSIONS.PAYMENTS_CREATE) && (
            <Button
              onClick={() => setIsProcessPaymentOpen(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Process Payment
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setIsPaymentMethodsOpen(true)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Payment Methods
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Receipts
            </CardTitle>
            <Receipt className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.totalReceipts}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Amount
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(stats.totalAmount)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Receipt
            </CardTitle>
            <CreditCard className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(stats.avgReceiptAmount)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Payments
            </CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.todayReceipts}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Payment Records</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search receipts..."
                  value={searchTerm}
                  onChange={(e) => updateSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Input
                type="date"
                value={filters.startDate || ""}
                onChange={(e) => handleDateFilterChange('startDate', e.target.value)}
                className="w-full sm:w-40"
                placeholder="Start Date"
              />
              
              <Input
                type="date"
                value={filters.endDate || ""}
                onChange={(e) => handleDateFilterChange('endDate', e.target.value)}
                className="w-full sm:w-40"
                placeholder="End Date"
              />

              <Button
                variant="outline"
                size="icon"
                onClick={refresh}
                disabled={refreshing}
                title="Refresh"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
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
                    <TableHead className="min-w-[120px]">Receipt #</TableHead>
                    <TableHead className="min-w-[200px]">Customer</TableHead>
                    <TableHead className="hidden sm:table-cell">Payment Date</TableHead>
                    <TableHead className="hidden md:table-cell">Method</TableHead>
                    <TableHead className="text-right min-w-[100px]">Amount</TableHead>
                    <TableHead className="hidden lg:table-cell">Items</TableHead>
                    <TableHead className="text-right min-w-[60px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {searchTerm
                            ? "No receipts found matching your search."
                            : "No payment records found."}
                        </div>
                        {hasPermission(PERMISSIONS.PAYMENTS_CREATE) && !searchTerm && (
                          <Button
                            variant="outline"
                            onClick={() => setIsProcessPaymentOpen(true)}
                            className="mt-2"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Process Your First Payment
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    receipts.map((receipt) => {
                      const paymentDate = typeof receipt.paymentDate === 'string' 
                        ? receipt.paymentDate 
                        : receipt.paymentDate.toString();
                      
                      return (
                        <TableRow key={receipt.id}>
                          <TableCell className="font-medium">
                            {receipt.receiptNumber}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {receipt.customer.businessName ||
                                  receipt.customer.contactPerson ||
                                  "N/A"}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {receipt.customer.contactPerson &&
                                receipt.customer.businessName
                                  ? receipt.customer.contactPerson
                                  : receipt.customer.email || "N/A"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {formatDate(paymentDate)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline">
                              {receipt.paymentMethod.name}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            {formatCurrency(Number(receipt.totalAmount))}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Badge variant="secondary">
                              {receipt._count?.items || 0} invoices
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleView(receipt)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Receipt
                                </DropdownMenuItem>

                                {hasPermission(PERMISSIONS.PAYMENTS_DELETE) && (
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteClick(receipt)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 px-4 sm:px-0 gap-4">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * 10 + 1} to{" "}
                {Math.min(currentPage * 10, totalItems)} of {totalItems} entries
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchReceipts(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchReceipts(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ProcessPaymentDialog
        open={isProcessPaymentOpen}
        onOpenChange={setIsProcessPaymentOpen}
        onPaymentProcessed={(receipt) => {
          refresh();
          toast.success("Payment processed successfully");
        }}
      />

      {selectedReceipt && (
        <ReceiptViewDialog
          open={isReceiptViewOpen}
          onOpenChange={setIsReceiptViewOpen}
          receipt={selectedReceipt}
        />
      )}

      <PaymentMethodsDialog
        open={isPaymentMethodsOpen}
        onOpenChange={setIsPaymentMethodsOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!receiptToDelete}
        onOpenChange={() => setReceiptToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Receipt</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete receipt "
              {receiptToDelete?.receiptNumber}"? This will reverse all invoice 
              payments and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Receipt"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Payments;
