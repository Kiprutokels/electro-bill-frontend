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
  FileText,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  MoreHorizontal,
  Send,
  Download,
  Printer,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS } from "@/utils/constants";
import { Quotation, QuotationStatus } from "@/api/services/quotations.service";
import { formatCurrency, formatDate } from "@/utils/format.utils";
import { useQuotations } from "@/hooks/useQuotations";
import { useQuotationActions } from "@/hooks/useQuotationActions";
import { useQuotationPdf } from "@/hooks/useQuotationPdf";
import AddQuotationDialog from "@/components/quotations/AddQuotationDialog";
import EditQuotationDialog from "@/components/quotations/EditQuotationDialog";
import QuotationViewDialog from "@/components/quotations/QuotationViewDialog";

const Quotations = () => {
  const { hasPermission } = useAuth();
  const {
    quotations,
    loading,
    error,
    refreshing,
    currentPage,
    totalPages,
    totalItems,
    searchTerm,
    filters,
    fetchQuotations,
    refresh,
    updateSearch,
    updateFilters,
    updateQuotationInList,
    removeQuotationFromList,
    setCurrentPage,
  } = useQuotations();

  const {
    loading: actionLoading,
    updateStatus,
    convertToInvoice,
    deleteQuotation,
  } = useQuotationActions();

  const { downloadPdf, downloading } = useQuotationPdf();

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState<Quotation | null>(
    null
  );
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(
    null
  );

  const handleView = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (quotation: Quotation) => {
    setQuotationToDelete(quotation);
  };

  const handleDeleteConfirm = async () => {
    if (!quotationToDelete) return;

    try {
      await deleteQuotation(quotationToDelete.id);
      removeQuotationFromList(quotationToDelete.id);
      setQuotationToDelete(null);
    } catch (err) {
      // Error handled in hook
    }
  };

  const handleStatusUpdate = async (
    quotation: Quotation,
    status: QuotationStatus
  ) => {
    try {
      const updatedQuotation = await updateStatus(quotation, status);
      updateQuotationInList(updatedQuotation);
      setIsViewDialogOpen(false);
    } catch (err) {
      // Error handled in hook
    }
  };

  const handleConvertToInvoice = async (quotation: Quotation) => {
    try {
      await convertToInvoice(quotation);
      setIsViewDialogOpen(false);
    } catch (err) {
      // Error handled in hook
    }
  };

  const handleDownloadPdf = async (quotation: Quotation) => {
    await downloadPdf(quotation.id, quotation.quotationNumber);
  };

  const handlePrint = (quotation: Quotation) => {
    // For now, just download the PDF
    handleDownloadPdf(quotation);
  };

  const handleQuotationAdded = (newQuotation: Quotation) => {
    fetchQuotations(1); // Refresh to get updated data
  };

  const handleQuotationUpdated = (updatedQuotation: Quotation) => {
    updateQuotationInList(updatedQuotation);
  };

  const handleStatusFilterChange = (value: string) => {
    if (value === "all") {
      const { status, ...restFilters } = filters;
      updateFilters(restFilters);
    } else {
      updateFilters({ ...filters, status: value as QuotationStatus });
    }
  };

  const getStatusBadge = (status: QuotationStatus) => {
    const statusConfigs = {
      [QuotationStatus.DRAFT]: {
        variant: "secondary" as const,
        icon: Clock,
        className: "bg-gray-100 text-gray-800 hover:bg-gray-200",
      },
      [QuotationStatus.SENT]: {
        variant: "default" as const,
        icon: ArrowRight,
        className: "bg-blue-500 text-white hover:bg-blue-600",
      },
      [QuotationStatus.APPROVED]: {
        variant: "default" as const,
        icon: CheckCircle,
        className: "bg-green-500 text-white hover:bg-green-600",
      },
      [QuotationStatus.REJECTED]: {
        variant: "destructive" as const,
        icon: XCircle,
        className: "bg-red-500 text-white hover:bg-red-600",
      },
      [QuotationStatus.EXPIRED]: {
        variant: "secondary" as const,
        icon: Clock,
        className: "bg-orange-100 text-orange-800 hover:bg-orange-200",
      },
      [QuotationStatus.INVOICED]: {
        variant: "default" as const,
        icon: FileText,
        className: "bg-emerald-500 text-white hover:bg-emerald-600",
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
    const totalQuotations = totalItems;
    const draftCount = quotations.filter(
      (q) => q.status === QuotationStatus.DRAFT
    ).length;
    const approvedCount = quotations.filter(
      (q) => q.status === QuotationStatus.APPROVED
    ).length;
    const totalValue = quotations.reduce(
      (sum, q) => sum + Number(q.totalAmount || 0),
      0
    );

    return {
      totalQuotations,
      draftCount,
      approvedCount,
      totalValue,
    };
  }, [quotations, totalItems]);

  if (loading && quotations.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading quotations...</p>
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
            Quotations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage sales quotations and proposals
          </p>
        </div>
        {hasPermission(PERMISSIONS.SALES_CREATE) && (
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Quotation
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Quotations
            </CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.totalQuotations}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Draft Quotations
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
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
              Approved
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.approvedCount}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(stats.totalValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Quotation Management</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search quotations..."
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
                  {Object.values(QuotationStatus).map((status) => (
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
                    <TableHead className="min-w-[120px]">Quotation #</TableHead>
                    <TableHead className="min-w-[200px]">Customer</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Valid Until
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
                  {quotations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {searchTerm
                            ? "No quotations found matching your search."
                            : "No quotations found."}
                        </div>
                        {hasPermission(PERMISSIONS.SALES_CREATE) &&
                          !searchTerm && (
                            <Button
                              variant="outline"
                              onClick={() => setIsAddDialogOpen(true)}
                              className="mt-2"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Create Your First Quotation
                            </Button>
                          )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    quotations.map((quotation) => (
                      <TableRow key={quotation.id}>
                        <TableCell className="font-medium">
                          {quotation.quotationNumber}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {quotation.customer?.businessName ||
                                quotation.customer?.contactPerson ||
                                "N/A"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {quotation.customer?.contactPerson &&
                              quotation.customer?.businessName
                                ? quotation.customer.contactPerson
                                : quotation.customer?.email || "N/A"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {formatDate(quotation.quotationDate)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {formatDate(quotation.validUntil)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(quotation.totalAmount || 0))}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(quotation.status)}
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
                              <DropdownMenuItem
                                onClick={() => handleView(quotation)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => handleDownloadPdf(quotation)}
                                disabled={downloading}
                              >
                                {downloading ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Download className="mr-2 h-4 w-4" />
                                )}
                                Download PDF
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => handlePrint(quotation)}
                              >
                                <Printer className="mr-2 h-4 w-4" />
                                Print
                              </DropdownMenuItem>

                              {hasPermission(PERMISSIONS.SALES_UPDATE) &&
                                quotation.status === QuotationStatus.DRAFT && (
                                  <DropdownMenuItem
                                    onClick={() => handleEdit(quotation)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                )}

                              {hasPermission(PERMISSIONS.SALES_UPDATE) &&
                                quotation.status === QuotationStatus.DRAFT && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStatusUpdate(
                                        quotation,
                                        QuotationStatus.SENT
                                      )
                                    }
                                  >
                                    <Send className="mr-2 h-4 w-4" />
                                    Send to Customer
                                  </DropdownMenuItem>
                                )}

                              {hasPermission(PERMISSIONS.SALES_UPDATE) &&
                                quotation.status === QuotationStatus.SENT && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusUpdate(
                                          quotation,
                                          QuotationStatus.APPROVED
                                        )
                                      }
                                      className="text-green-600"
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusUpdate(
                                          quotation,
                                          QuotationStatus.REJECTED
                                        )
                                      }
                                      className="text-red-600"
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Reject
                                    </DropdownMenuItem>
                                  </>
                                )}

                              {hasPermission(PERMISSIONS.SALES_UPDATE) &&
                                quotation.status ===
                                  QuotationStatus.APPROVED && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleConvertToInvoice(quotation)
                                    }
                                    className="text-blue-600"
                                  >
                                    <ArrowRight className="mr-2 h-4 w-4" />
                                    Convert to Invoice
                                  </DropdownMenuItem>
                                )}

                              {hasPermission(PERMISSIONS.SALES_DELETE) &&
                                quotation.status === QuotationStatus.DRAFT && (
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteClick(quotation)}
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
                  onClick={() => fetchQuotations(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchQuotations(currentPage + 1)}
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
      <AddQuotationDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onQuotationAdded={handleQuotationAdded}
      />

      {selectedQuotation && (
        <>
          <EditQuotationDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            quotation={selectedQuotation}
            onQuotationUpdated={handleQuotationUpdated}
          />

          <QuotationViewDialog
            open={isViewDialogOpen}
            onOpenChange={setIsViewDialogOpen}
            quotation={selectedQuotation}
            onEdit={() => {
              setIsViewDialogOpen(false);
              setIsEditDialogOpen(true);
            }}
            onStatusUpdate={handleStatusUpdate}
            onConvertToInvoice={handleConvertToInvoice}
          />
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!quotationToDelete}
        onOpenChange={() => setQuotationToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quotation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete quotation "
              {quotationToDelete?.quotationNumber}"? This action cannot be
              undone.
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
                "Delete Quotation"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Quotations;
