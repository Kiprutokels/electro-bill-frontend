import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  FileText,
  Send,
  Calendar,
  User,
  Phone,
  Mail,
  Building,
  ArrowRight,
  Clock,
  Loader2,
  Download,
  Printer,
} from "lucide-react";
import {
  Quotation,
  QuotationStatus,
  quotationsService,
} from "@/api/services/quotations.service";
import { formatCurrency, formatDate } from "@/utils/format.utils";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS } from "@/utils/constants";
import { useQuotationPdf } from "@/hooks/useQuotationPdf";
import { toast } from "sonner";

interface QuotationViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: Quotation | null;
  onEdit: () => void;
  onStatusUpdate: (quotation: Quotation, status: QuotationStatus) => void;
  onConvertToInvoice: (quotation: Quotation) => void;
}

const QuotationViewDialog: React.FC<QuotationViewDialogProps> = ({
  open,
  onOpenChange,
  quotation,
  onEdit,
  onStatusUpdate,
  onConvertToInvoice,
}) => {
  const { hasPermission } = useAuth();
  const { downloadPdf, downloading } = useQuotationPdf();
  const [fetchingQuotation, setFetchingQuotation] = useState(false);
  const [fullQuotation, setFullQuotation] = useState<Quotation | null>(null);

  // Fetch full quotation details when dialog opens
  useEffect(() => {
    const fetchQuotationDetails = async () => {
      if (quotation && open && quotation.id) {
        setFetchingQuotation(true);
        try {
          const fullDetails = await quotationsService.getById(quotation.id);
          setFullQuotation(fullDetails);
        } catch (error) {
          console.error("Failed to fetch quotation details:", error);
          toast.error("Failed to load quotation details");
          setFullQuotation(quotation);
        } finally {
          setFetchingQuotation(false);
        }
      }
    };

    if (open) {
      fetchQuotationDetails();
    } else {
      setFullQuotation(null);
    }
  }, [quotation, open]);

  const handleDownloadPdf = async () => {
    if (!displayQuotation.id) return;
    await downloadPdf(displayQuotation.id, displayQuotation.quotationNumber);
  };

  const handlePrint = () => {
    handleDownloadPdf();
  };

  if (!quotation) return null;

  const displayQuotation = fullQuotation || quotation;

  const getStatusBadge = (status: QuotationStatus) => {
    const statusConfig = {
      [QuotationStatus.DRAFT]: {
        variant: "secondary" as const,
        className: "bg-gray-100 text-gray-800 border border-gray-300",
        icon: Clock,
      },
      [QuotationStatus.SENT]: {
        variant: "default" as const,
        className: "bg-blue-100 text-blue-800 border border-blue-300",
        icon: Send,
      },
      [QuotationStatus.APPROVED]: {
        variant: "default" as const,
        className: "bg-green-100 text-green-800 border border-green-300",
        icon: CheckCircle,
      },
      [QuotationStatus.REJECTED]: {
        variant: "destructive" as const,
        className: "bg-red-100 text-red-800 border border-red-300",
        icon: XCircle,
      },
      [QuotationStatus.EXPIRED]: {
        variant: "secondary" as const,
        className: "bg-orange-100 text-orange-800 border border-orange-300",
        icon: Clock,
      },
      [QuotationStatus.INVOICED]: {
        variant: "default" as const,
        className: "bg-emerald-100 text-emerald-800 border border-emerald-300",
        icon: ArrowRight,
      },
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

  const canEdit = displayQuotation.status === QuotationStatus.DRAFT;
  const canApprove = displayQuotation.status === QuotationStatus.SENT;
  const canConvert = displayQuotation.status === QuotationStatus.APPROVED;
  const canSend = displayQuotation.status === QuotationStatus.DRAFT;

  // Safely handle items array with proper type checking
  const items = Array.isArray(displayQuotation.items)
    ? displayQuotation.items
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Quotation Details
            </DialogTitle>
            {getStatusBadge(displayQuotation.status)}
          </div>
          <DialogDescription>
            View quotation information, items, and manage status updates.
          </DialogDescription>
        </DialogHeader>

        {fetchingQuotation ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Loading quotation details...
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {/* Header Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Quotation Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Quotation Number
                    </p>
                    <p className="font-mono font-medium">
                      {displayQuotation.quotationNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Quotation Date
                    </p>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(displayQuotation.quotationDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valid Until</p>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(displayQuotation.validUntil)}
                    </p>
                  </div>
                  {displayQuotation.approvedDate && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Approved Date
                      </p>
                      <p className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {formatDate(displayQuotation.approvedDate)}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Created By</p>
                    <p className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {displayQuotation.createdByUser
                        ? `${displayQuotation.createdByUser.firstName} ${displayQuotation.createdByUser.lastName}`
                        : "N/A"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Customer Code
                    </p>
                    <p className="font-medium">
                      {displayQuotation.customer?.customerCode || "N/A"}
                    </p>
                  </div>
                  {displayQuotation.customer?.businessName && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Business Name
                      </p>
                      <p className="font-medium">
                        {displayQuotation.customer.businessName}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Contact Person
                    </p>
                    <p className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {displayQuotation.customer?.contactPerson || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {displayQuotation.customer?.phone || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {displayQuotation.customer?.email || "N/A"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Items Table */}
            <Card>
              <CardHeader>
                <CardTitle>Quotation Items ({items.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No items found in this quotation</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[200px]">
                            Product
                          </TableHead>
                          <TableHead className="hidden md:table-cell">
                            Description
                          </TableHead>
                          <TableHead className="text-right min-w-[100px]">
                            Unit Price
                          </TableHead>
                          <TableHead className="text-center min-w-[80px]">
                            Quantity
                          </TableHead>
                          <TableHead className="text-center hidden lg:table-cell">
                            Discount %
                          </TableHead>
                          <TableHead className="text-right min-w-[100px]">
                            Total
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => {
                          const quantity = Number(item.quantity || 0);
                          const unitPrice = Number(item.unitPrice || 0);
                          const discountPercentage = Number(
                            item.discountPercentage || 0
                          );
                          const subtotal = quantity * unitPrice;
                          const discountAmount =
                            subtotal * (discountPercentage / 100);
                          const total = subtotal - discountAmount;

                          return (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">
                                    {item.product?.name || "Unknown Product"}
                                  </p>
                                  <p className="text-sm text-muted-foreground font-mono">
                                    SKU: {item.product?.sku || "N/A"}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {item.product?.category?.name}
                                    {item.product?.brand?.name &&
                                      ` • ${item.product.brand.name}`}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <p className="text-sm">{item.description}</p>
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(unitPrice)}
                              </TableCell>
                              <TableCell className="text-center">
                                {quantity}
                              </TableCell>
                              <TableCell className="text-center hidden lg:table-cell">
                                {discountPercentage > 0
                                  ? `${discountPercentage}%`
                                  : "-"}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(total)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pricing Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-w-md ml-auto">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>
                      {formatCurrency(Number(displayQuotation.subtotal))}
                    </span>
                  </div>
                  {Number(displayQuotation.discountAmount) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>
                        -
                        {formatCurrency(
                          Number(displayQuotation.discountAmount)
                        )}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>
                      {formatCurrency(Number(displayQuotation.taxAmount))}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total Amount:</span>
                    <span>
                      {formatCurrency(Number(displayQuotation.totalAmount))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {displayQuotation.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {displayQuotation.notes}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Related Invoices */}
            {displayQuotation.invoices &&
              displayQuotation.invoices.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Related Invoices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {displayQuotation.invoices.map((invoice) => (
                        <div
                          key={invoice.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">
                              {invoice.invoiceNumber}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(invoice.invoiceDate)} •{" "}
                              {invoice.status}
                            </p>
                          </div>
                          <Badge variant="outline">{invoice.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              {/* Download and Print Actions */}
              <Button
                variant="outline"
                onClick={handleDownloadPdf}
                disabled={downloading}
                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              >
                {downloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Download PDF
              </Button>

              <Button
                variant="outline"
                onClick={handlePrint}
                disabled={downloading}
                className="bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
              >
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>

              {/* Existing actions */}
              {hasPermission(PERMISSIONS.SALES_UPDATE) && canEdit && (
                <Button onClick={onEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Quotation
                </Button>
              )}

              {hasPermission(PERMISSIONS.SALES_UPDATE) && canSend && (
                <Button
                  variant="outline"
                  onClick={() =>
                    onStatusUpdate(displayQuotation, QuotationStatus.SENT)
                  }
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send to Customer
                </Button>
              )}

              {hasPermission(PERMISSIONS.SALES_UPDATE) && canApprove && (
                <>
                  <Button
                    variant="outline"
                    className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                    onClick={() =>
                      onStatusUpdate(displayQuotation, QuotationStatus.APPROVED)
                    }
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                    onClick={() =>
                      onStatusUpdate(displayQuotation, QuotationStatus.REJECTED)
                    }
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </>
              )}

              {hasPermission(PERMISSIONS.SALES_UPDATE) && canConvert && (
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => onConvertToInvoice(displayQuotation)}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Convert to Invoice
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QuotationViewDialog;
