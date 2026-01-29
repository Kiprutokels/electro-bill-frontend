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
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  MoreHorizontal,
  Send,
  CreditCard,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS } from "@/utils/constants";
import { Invoice, InvoiceStatus } from "@/api/services/invoices.service";
import { formatCurrency, formatDate } from "@/utils/format.utils";
import { useInvoices } from "@/hooks/useInvoices";
import { useInvoiceActions } from "@/hooks/useInvoiceActions";
import AddInvoiceDialog from "@/components/invoices/AddInvoiceDialog";
import EditInvoiceDialog from "@/components/invoices/EditInvoiceDialog";
import InvoiceViewDialog from "@/components/invoices/InvoiceViewDialog";

const Invoices = () => {
  const { hasPermission } = useAuth();
  const {
    invoices,
    loading,
    error,
    refreshing,
    currentPage,
    totalPages,
    totalItems,
    searchTerm,
    filters,
    fetchInvoices,
    refresh,
    updateSearch,
    updateFilters,
    updateInvoiceInList,
    removeInvoiceFromList,
    setCurrentPage,
  } = useInvoices();

  const {
    loading: actionLoading,
    updateStatus,
    deleteInvoice,
    recordPayment,
  } = useInvoiceActions();

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

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
      await deleteInvoice(invoiceToDelete.id);
      removeInvoiceFromList(invoiceToDelete.id);
      setInvoiceToDelete(null);
    } catch (err) {
      // Error handled in hook
    }
  };

  const handleStatusUpdate = async (
    invoice: Invoice,
    status: InvoiceStatus
  ) => {
    try {
      const updatedInvoice = await updateStatus(invoice, status);
      updateInvoiceInList(updatedInvoice);
      setIsViewDialogOpen(false);
    } catch (err) {
      // Error handled in hook
    }
  };

  const handlePayment = (invoice: Invoice) => {
    recordPayment(invoice);
  };

  const handleInvoiceAdded = (newInvoice: Invoice) => {
    fetchInvoices(1); // Refresh to get updated data
  };

  const handleInvoiceUpdated = (updatedInvoice: Invoice) => {
    updateInvoiceInList(updatedInvoice);
  };

  const handleStatusFilterChange = (value: string) => {
    if (value === "all") {
      const { status, ...restFilters } = filters;
      updateFilters(restFilters);
    } else {
      updateFilters({ ...filters, status: value as InvoiceStatus });
    }
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    const statusConfigs = {
      [InvoiceStatus.DRAFT]: {
        variant: "secondary" as const,
        icon: Clock,
        className: "bg-gray-100 text-gray-800",
      },
      [InvoiceStatus.SENT]: {
        variant: "default" as const,
        icon: Receipt,
        className: "bg-blue-500 text-white hover:bg-blue-600",
      },
      [InvoiceStatus.PARTIAL]: {
        variant: "default" as const,
        icon: AlertTriangle,
        className: "bg-yellow-500 text-white hover:bg-yellow-600",
      },
      [InvoiceStatus.PAID]: {
        variant: "default" as const,
        icon: CheckCircle,
        className: "bg-green-500 text-white hover:bg-green-600",
      },
      [InvoiceStatus.OVERDUE]: {
        variant: "destructive" as const,
        icon: AlertTriangle,
        className: "bg-orange-500 text-white hover:bg-orange-600",
      },
      [InvoiceStatus.CANCELLED]: {
        variant: "destructive" as const,
        icon: XCircle,
        className: "",
      },
    };

    const config = statusConfigs[status];
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
    const draftCount = invoices.filter(
      (i) => i.status === InvoiceStatus.DRAFT
    ).length;
    const paidAmount = invoices
      .filter((i) => i.status === InvoiceStatus.PAID)
      .reduce((sum, i) => sum + Number(i.totalAmount || 0), 0);
    const pendingAmount = invoices
      .filter((i) =>
        [InvoiceStatus.SENT, InvoiceStatus.PARTIAL].includes(i.status)
      )
      .reduce((sum, i) => sum + Number(i.totalAmount || 0), 0);
    const overdueCount = invoices.filter(
      (i) => i.status === InvoiceStatus.OVERDUE
    ).length;

    return {
      totalInvoices,
      draftCount,
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
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Invoices
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage sales Invoices and billing
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Invoices
            </CardTitle>
            <Receipt className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.totalInvoices}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-gray-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Draft Invoices
            </CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.draftCount}
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
            <div className="text-2xl font-bold text-foreground">
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
            <div className="text-2xl font-bold text-foreground">
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
            <div className="text-2xl font-bold text-foreground">
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
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => updateSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={filters.status || "all"}
                onValueChange={handleStatusFilterChange}
              >
                <SelectTrigger className="w-full sm:w-40">
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
                    <TableHead className="min-w-[120px]">Invoice #</TableHead>
                    <TableHead className="min-w-[200px]">Customer</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Invoice Date
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Due Date
                    </TableHead>
                    <TableHead className="text-right min-w-[100px]">
                      Amount
                    </TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="text-right min-w-[60px]">
                      Actions
                    </TableHead>
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
                        {hasPermission(PERMISSIONS.SALES_CREATE) &&
                          !searchTerm && (
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
                            <div className="font-medium">
                              {invoice.customer?.businessName ||
                                invoice.customer?.contactPerson ||
                                "N/A"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {invoice.customer?.contactPerson &&
                              invoice.customer?.businessName
                                ? invoice.customer.contactPerson
                                : invoice.customer?.email || "N/A"}
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
                          {formatCurrency(Number(invoice.totalAmount || 0))}
                        </TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleView(invoice)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>

                              {hasPermission(PERMISSIONS.SALES_UPDATE) &&
                                invoice.status === InvoiceStatus.DRAFT && (
                                  <DropdownMenuItem
                                    onClick={() => handleEdit(invoice)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                )}

                              {hasPermission(PERMISSIONS.SALES_UPDATE) &&
                                invoice.status === InvoiceStatus.DRAFT && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStatusUpdate(
                                        invoice,
                                        InvoiceStatus.SENT
                                      )
                                    }
                                  >
                                    <Send className="mr-2 h-4 w-4" />
                                    Send to Customer
                                  </DropdownMenuItem>
                                )}

                              {hasPermission(PERMISSIONS.PAYMENTS_CREATE) &&
                                [
                                  InvoiceStatus.SENT,
                                  InvoiceStatus.PARTIAL,
                                ].includes(invoice.status) && (
                                  <DropdownMenuItem
                                    onClick={() => handlePayment(invoice)}
                                    className="text-green-600"
                                  >
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    Record Payment
                                  </DropdownMenuItem>
                                )}

                              {hasPermission(PERMISSIONS.SALES_UPDATE) &&
                                [
                                  InvoiceStatus.DRAFT,
                                  InvoiceStatus.SENT,
                                ].includes(invoice.status) && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStatusUpdate(
                                        invoice,
                                        InvoiceStatus.CANCELLED
                                      )
                                    }
                                    className="text-red-600"
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Cancel Invoice
                                  </DropdownMenuItem>
                                )}

                              {hasPermission(PERMISSIONS.SALES_DELETE) &&
                                invoice.status === InvoiceStatus.DRAFT && (
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteClick(invoice)}
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
                    ))
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
                  onClick={() => fetchInvoices(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchInvoices(currentPage + 1)}
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
              Are you sure you want to delete invoice "
              {invoiceToDelete?.invoiceNumber}"? This action cannot be undone.
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
                "Delete Invoice"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Invoices;
