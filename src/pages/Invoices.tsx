import React, { useState, useEffect, useMemo } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Receipt,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Loader2,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS } from "@/utils/constants";
import { 
  invoicesService, 
  Invoice, 
  InvoiceStatus,
  InvoiceFilters 
} from "@/api/services/invoices.service";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/currency.utils";
import { formatDate } from "@/utils/format.utils";
import AddInvoiceDialog from "@/components/invoices/AddInvoiceDialog";
import EditInvoiceDialog from "@/components/invoices/EditInvoiceDialog";
import InvoiceViewDialog from "@/components/invoices/InvoiceViewDialog";

const Invoices = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const fetchData = async (page = 1, showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const filters: InvoiceFilters = {};
      if (statusFilter !== "all") {
        filters.status = statusFilter as InvoiceStatus;
      }

      const invoicesData = await invoicesService.getInvoices(page, 10, debouncedSearchTerm, filters);

      setInvoices(invoicesData.data);
      setTotalPages(invoicesData.meta.totalPages);
      setTotalItems(invoicesData.meta.total);
      setCurrentPage(page);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to fetch invoices";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(1);
  }, [debouncedSearchTerm, statusFilter]);

  const handleRefresh = () => {
    fetchData(currentPage, true);
  };

  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
  };

  const handleDeleteConfirm = async () => {
    if (!invoiceToDelete) return;

    try {
      await invoicesService.deleteInvoice(invoiceToDelete.id);
      toast.success("Invoice deleted successfully");
      fetchData(currentPage);
      setInvoiceToDelete(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to delete invoice";
      toast.error(errorMessage);
    }
  };

  const handleStatusUpdate = async (invoice: Invoice, status: InvoiceStatus) => {
    try {
      await invoicesService.updateInvoiceStatus(invoice.id, status);
      toast.success(`Invoice ${status.toLowerCase()} successfully`);
      fetchData(currentPage);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to update invoice status";
      toast.error(errorMessage);
    }
  };

  const handlePayment = (invoice: Invoice) => {
    // Navigate to payment page - implementation to be added later
    navigate(`/payments/new?invoiceId=${invoice.id}`);
  };

  const handleInvoiceAdded = (newInvoice: Invoice) => {
    setInvoices(prev => [newInvoice, ...prev.slice(0, 9)]);
    toast.success("Invoice created successfully");
  };

  const handleInvoiceUpdated = (updatedInvoice: Invoice) => {
    setInvoices(prev =>
      prev.map(i => (i.id === updatedInvoice.id ? updatedInvoice : i))
    );
    toast.success("Invoice updated successfully");
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    const statusConfig = {
      [InvoiceStatus.DRAFT]: { variant: "secondary" as const, icon: Clock, className: "bg-gray-100 text-gray-800" },
      [InvoiceStatus.SENT]: { variant: "default" as const, icon: Receipt, className: "bg-blue-500 text-white" },
      [InvoiceStatus.PARTIAL]: { variant: "default" as const, icon: AlertTriangle, className: "bg-yellow-500 text-white" },
      [InvoiceStatus.PAID]: { variant: "default" as const, icon: CheckCircle, className: "bg-green-500 text-white" },
      [InvoiceStatus.OVERDUE]: { variant: "destructive" as const, icon: AlertTriangle, className: "bg-orange-500 text-white" },
      [InvoiceStatus.CANCELLED]: { variant: "destructive" as const, icon: XCircle, className: "bg-red-500 text-white" },
    };

    const config = statusConfig[status];
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0) + status.slice(1).toLowerCase()}
      </Badge>
    );
  };

  // Calculate stats
  const stats = useMemo(() => {
    const totalInvoices = totalItems;
    const paidAmount = invoices.filter(i => i.status === InvoiceStatus.PAID).reduce((sum, i) => sum + i.totalAmount, 0);
    const pendingAmount = invoices.filter(i => [InvoiceStatus.SENT, InvoiceStatus.PARTIAL].includes(i.status)).reduce((sum, i) => sum + i.totalAmount, 0);
    const overdueCount = invoices.filter(i => i.status === InvoiceStatus.OVERDUE).length;

    return {
      totalInvoices,
      paidAmount,
      pendingAmount,
      overdueCount,
    };
  }, [invoices, totalItems]);

  if (loading && invoices.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            Manage sales invoices and billing
          </p>
        </div>
        {hasPermission(PERMISSIONS.SALES_CREATE) && (
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Invoices
            </CardTitle>
            <Receipt className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {stats.totalInvoices}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid Amount
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {formatCurrency(stats.paidAmount)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Amount
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {formatCurrency(stats.pendingAmount)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {stats.overdueCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Invoice Management</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.values(InvoiceStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0) + status.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={refreshing}
                title="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 border border-destructive/20 rounded-lg bg-destructive/5">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          )}

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Invoice #</TableHead>
                  <TableHead className="min-w-[200px]">Customer</TableHead>
                  <TableHead className="hidden sm:table-cell">Invoice Date</TableHead>
                  <TableHead className="hidden md:table-cell">Due Date</TableHead>
                  <TableHead className="text-right min-w-[100px]">Amount</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="text-right min-w-[160px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm
                          ? "No invoices found matching your search."
                          : "No invoices found."}
                      </div>
                      {hasPermission(PERMISSIONS.SALES_CREATE) && !searchTerm && (
                        <Button
                          variant="outline"
                          onClick={() => setIsAddDialogOpen(true)}
                          className="mt-2"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create Your First Invoice
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.customer.businessName}</div>
                          <div className="text-sm text-muted-foreground">
                            {invoice.customer.contactPerson}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {formatDate(invoice.invoiceDate)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {formatDate(invoice.dueDate)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(invoice.totalAmount)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(invoice.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(invoice)}
                            className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-2"
                            title="View"
                          >
                            <Eye className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">View</span>
                          </Button>

                          {hasPermission(PERMISSIONS.PAYMENTS_CREATE) &&
                            [InvoiceStatus.SENT, InvoiceStatus.PARTIAL].includes(invoice.status) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePayment(invoice)}
                                className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-2 text-green-600 hover:text-green-700"
                                title="Payment"
                              >
                                <CreditCard className="h-4 w-4 sm:mr-1" />
                                <span className="hidden sm:inline">Payment</span>
                              </Button>
                            )}

                          {hasPermission(PERMISSIONS.SALES_UPDATE) &&
                            invoice.status === InvoiceStatus.DRAFT && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(invoice)}
                                className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-2"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4 sm:mr-1" />
                                <span className="hidden sm:inline">Edit</span>
                              </Button>
                            )}

                          {hasPermission(PERMISSIONS.SALES_DELETE) &&
                            invoice.status === InvoiceStatus.DRAFT && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(invoice)}
                                className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-2 text-destructive hover:text-destructive"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4 sm:mr-1" />
                                <span className="hidden sm:inline">Delete</span>
                              </Button>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalItems)} of {totalItems} entries
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchData(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchData(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddInvoiceDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onInvoiceAdded={handleInvoiceAdded}
      />

      {selectedInvoice && (
        <>
          <EditInvoiceDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            invoice={selectedInvoice}
            onInvoiceUpdated={handleInvoiceUpdated}
          />

          <InvoiceViewDialog
            open={isViewDialogOpen}
            onOpenChange={setIsViewDialogOpen}
            invoice={selectedInvoice}
            onEdit={() => {
              setIsViewDialogOpen(false);
              setIsEditDialogOpen(true);
            }}
            onStatusUpdate={handleStatusUpdate}
            onPayment={handlePayment}
          />
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!invoiceToDelete}
        onOpenChange={() => setInvoiceToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice "{invoiceToDelete?.invoiceNumber}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Invoice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Invoices;
