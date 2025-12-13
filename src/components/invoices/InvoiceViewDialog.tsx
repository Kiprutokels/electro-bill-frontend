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
  Receipt,
  Send,
  Calendar,
  User,
  Phone,
  Mail,
  Building,
  CreditCard,
  Clock,
  AlertTriangle,
  Loader2,
  Briefcase,
  FileText,
} from "lucide-react";
import {
  Invoice,
  InvoiceStatus,
  invoicesService,
} from "@/api/services/invoices.service";
import { formatCurrency, formatDate } from "@/utils/format.utils";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS } from "@/utils/constants";
import { toast } from "sonner";

interface InvoiceViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  onEdit: () => void;
  onStatusUpdate: (invoice: Invoice, status: InvoiceStatus) => void;
  onPayment: (invoice: Invoice) => void;
}

const InvoiceViewDialog: React.FC<InvoiceViewDialogProps> = ({
  open,
  onOpenChange,
  invoice,
  onEdit,
  onStatusUpdate,
  onPayment,
}) => {
  const { hasPermission } = useAuth();
  const [fetchingInvoice, setFetchingInvoice] = useState(false);
  const [fullInvoice, setFullInvoice] = useState<Invoice | null>(null);

  // Fetch full invoice details when dialog opens
  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      if (invoice && open && invoice.id) {
        setFetchingInvoice(true);
        try {
          const fullDetails = await invoicesService.getById(invoice.id);
          setFullInvoice(fullDetails);
        } catch (error) {
          console.error("Failed to fetch invoice details:", error);
          toast.error("Failed to load invoice details");
          setFullInvoice(invoice);
        } finally {
          setFetchingInvoice(false);
        }
      }
    };

    if (open) {
      fetchInvoiceDetails();
    } else {
      setFullInvoice(null);
    }
  }, [invoice, open]);

  if (!invoice) return null;

  const displayInvoice = fullInvoice || invoice;

  const getStatusBadge = (status: InvoiceStatus) => {
    const statusConfig = {
      [InvoiceStatus.DRAFT]: {
        variant: "secondary" as const,
        className: "bg-gray-100 text-gray-800",
        icon: Clock,
      },
      [InvoiceStatus.SENT]: {
        variant: "default" as const,
        className: "bg-blue-500 text-white",
        icon: Send,
      },
      [InvoiceStatus.PARTIAL]: {
        variant: "default" as const,
        className: "bg-yellow-500 text-white",
        icon: AlertTriangle,
      },
      [InvoiceStatus.PAID]: {
        variant: "default" as const,
        className: "bg-green-500 text-white",
        icon: CheckCircle,
      },
      [InvoiceStatus.OVERDUE]: {
        variant: "destructive" as const,
        className: "bg-orange-500 text-white",
        icon: AlertTriangle,
      },
      [InvoiceStatus.CANCELLED]: {
        variant: "destructive" as const,
        className: "bg-red-500 text-white",
        icon: XCircle,
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

  const canEdit = displayInvoice.status === InvoiceStatus.DRAFT;
  const canSend = displayInvoice.status === InvoiceStatus.DRAFT;
  const canPayment = [InvoiceStatus.SENT, InvoiceStatus.PARTIAL].includes(
    displayInvoice.status
  );
  const canCancel = [InvoiceStatus.DRAFT, InvoiceStatus.SENT].includes(
    displayInvoice.status
  );

  // Safely handle items array with proper type checking
  const items = Array.isArray(displayInvoice.items) ? displayInvoice.items : [];

  // Determine invoice source
  const isJobInvoice = !!displayInvoice.jobId;
  const isQuotationInvoice = !!displayInvoice.quotationId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Invoice Details
            </DialogTitle>
            <div className="flex items-center gap-2">
              {getStatusBadge(displayInvoice.status)}
              {isJobInvoice && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  <Briefcase className="w-3 h-3 mr-1" />
                  Job Invoice
                </Badge>
              )}
              {isQuotationInvoice && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <FileText className="w-3 h-3 mr-1" />
                  Quotation Invoice
                </Badge>
              )}
            </div>
          </div>
          <DialogDescription>
            View invoice information, items, and manage status updates.
          </DialogDescription>
        </DialogHeader>

        {fetchingInvoice ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Loading invoice details...
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
                    <Receipt className="h-5 w-5" />
                    Invoice Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Invoice Number
                    </p>
                    <p className="font-mono font-medium">
                      {displayInvoice.invoiceNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Invoice Date
                    </p>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(displayInvoice.invoiceDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(displayInvoice.dueDate)}
                    </p>
                  </div>
                  {displayInvoice.paymentTerms && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Payment Terms
                      </p>
                      <p>{displayInvoice.paymentTerms}</p>
                    </div>
                  )}
                  {displayInvoice.job && (
                    <div className="border-t pt-4">
                      <p className="text-sm text-muted-foreground">
                        Related Job
                      </p>
                      <p className="font-mono font-medium text-purple-600">
                        {displayInvoice.job.jobNumber}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {displayInvoice.job.serviceDescription}
                      </p>
                    </div>
                  )}
                  {displayInvoice.quotation && (
                    <div className="border-t pt-4">
                      <p className="text-sm text-muted-foreground">
                        Related Quotation
                      </p>
                      <p className="font-mono font-medium text-blue-600">
                        {displayInvoice.quotation.quotationNumber}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Created By</p>
                    <p className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {displayInvoice.createdByUser
                        ? `${displayInvoice.createdByUser.firstName} ${displayInvoice.createdByUser.lastName}`
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
                      {displayInvoice.customer?.customerCode || "N/A"}
                    </p>
                  </div>
                  {displayInvoice.customer?.businessName && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Business Name
                      </p>
                      <p className="font-medium">
                        {displayInvoice.customer.businessName}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Contact Person
                    </p>
                    <p className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {displayInvoice.customer?.contactPerson || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {displayInvoice.customer?.phone || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {displayInvoice.customer?.email || "N/A"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Items Table */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Items ({items.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No items found in this invoice</p>
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
                                  {item.product?.warrantyPeriodMonths > 0 && (
                                    <Badge variant="outline" className="text-xs mt-1 bg-green-50 text-green-700 border-green-200">
                                      {item.product.warrantyPeriodMonths} months warranty
                                    </Badge>
                                  )}
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
                <div className="space-y-3 max-w-md ml-auto">
                  <div className="flex justify-between text-base">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">
                      {formatCurrency(Number(displayInvoice.subtotal))}
                    </span>
                  </div>
                  
                  {Number(displayInvoice.discountAmount) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span className="font-medium">
                        -{formatCurrency(Number(displayInvoice.discountAmount))}
                      </span>
                    </div>
                  )}

                  <div className="border-t pt-3 space-y-2">
                    {Number(displayInvoice.serviceFee) > 0 && (
                      <div className="flex justify-between text-blue-600">
                        <span>Service Charge:</span>
                        <span className="font-medium">
                          +{formatCurrency(Number(displayInvoice.serviceFee))}
                        </span>
                      </div>
                    )}
                    
                    {Number(displayInvoice.processingFee) > 0 && (
                      <div className="flex justify-between text-purple-600">
                        <span>Processing Fee:</span>
                        <span className="font-medium">
                          +{formatCurrency(Number(displayInvoice.processingFee))}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Tax (included in prices):</span>
                      <span>
                        {formatCurrency(Number(displayInvoice.taxAmount))}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Amount:</span>
                      <span className="text-primary">
                        {formatCurrency(Number(displayInvoice.totalAmount))}
                      </span>
                    </div>
                  </div>

                  {Number(displayInvoice.amountPaid) > 0 && (
                    <>
                      <div className="flex justify-between text-green-600 font-medium">
                        <span>Amount Paid:</span>
                        <span>
                          {formatCurrency(Number(displayInvoice.amountPaid))}
                        </span>
                      </div>
                      <div className="flex justify-between text-orange-600 font-medium border-t pt-3">
                        <span>Outstanding Balance:</span>
                        <span>
                          {formatCurrency(
                            Number(displayInvoice.totalAmount) - 
                            Number(displayInvoice.amountPaid)
                          )}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {displayInvoice.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {displayInvoice.notes}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Payment History */}
            {displayInvoice.receiptItems &&
              displayInvoice.receiptItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Payment History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {displayInvoice.receiptItems.map((receiptItem, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">
                              {receiptItem.receipt.receiptNumber}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(receiptItem.receipt.paymentDate)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {formatCurrency(
                                Number(receiptItem.receipt.totalAmount)
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              {hasPermission(PERMISSIONS.SALES_UPDATE) && canEdit && (
                <Button onClick={onEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Invoice
                </Button>
              )}

              {hasPermission(PERMISSIONS.SALES_UPDATE) && canSend && (
                <Button
                  variant="outline"
                  onClick={() =>
                    onStatusUpdate(displayInvoice, InvoiceStatus.SENT)
                  }
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send to Customer
                </Button>
              )}

              {hasPermission(PERMISSIONS.PAYMENTS_CREATE) && canPayment && (
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => onPayment(displayInvoice)}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Record Payment
                </Button>
              )}

              {hasPermission(PERMISSIONS.SALES_UPDATE) && canCancel && (
                <Button
                  variant="outline"
                  className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                  onClick={() =>
                    onStatusUpdate(displayInvoice, InvoiceStatus.CANCELLED)
                  }
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Invoice
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceViewDialog;
