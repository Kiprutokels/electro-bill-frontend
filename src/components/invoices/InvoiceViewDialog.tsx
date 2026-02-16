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
  Download,
  ArrowRight,
} from "lucide-react";
import {
  Invoice,
  InvoiceStatus,
  InvoiceType,
  invoicesService,
} from "@/api/services/invoices.service";
import { formatCurrency, formatDate } from "@/utils/format.utils";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS } from "@/utils/constants";
import { toast } from "sonner";
import SendInvoiceDialog from "@/components/invoices/SendInvoiceDialog";

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

  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      if (!invoice || !open) return;

      setFetchingInvoice(true);
      try {
        const full = await invoicesService.getById(invoice.id);
        setFullInvoice(full);
      } catch (error) {
        console.error("Failed to fetch invoice details:", error);
        toast.error("Failed to load invoice details");
        setFullInvoice(invoice);
      } finally {
        setFetchingInvoice(false);
      }
    };

    if (open) fetchInvoiceDetails();
    else setFullInvoice(null);
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
    } as const;

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant="secondary" className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0) + status.slice(1).toLowerCase()}
      </Badge>
    );
  };

  const getTypeBadge = (type: InvoiceType) => {
    if (type === InvoiceType.PROFORMA) {
      return (
        <Badge
          variant="outline"
          className="bg-purple-50 text-purple-700 border-purple-200"
        >
          <FileText className="w-3 h-3 mr-1" />
          Proforma
        </Badge>
      );
    }

    return (
      <Badge
        variant="outline"
        className="bg-green-50 text-green-700 border-green-200"
      >
        <Receipt className="w-3 h-3 mr-1" />
        Standard
      </Badge>
    );
  };

  // ✅ Allow editing proforma in DRAFT or SENT
  const canEdit =
    displayInvoice.type === InvoiceType.PROFORMA
      ? [InvoiceStatus.DRAFT, InvoiceStatus.SENT].includes(displayInvoice.status)
      : displayInvoice.status === InvoiceStatus.DRAFT;

  const canSend = displayInvoice.status === InvoiceStatus.DRAFT;

  const canPayment =
    displayInvoice.type === InvoiceType.STANDARD &&
    [InvoiceStatus.SENT, InvoiceStatus.PARTIAL].includes(displayInvoice.status);

  const canCancel = [InvoiceStatus.DRAFT, InvoiceStatus.SENT].includes(
    displayInvoice.status
  );

  const canConvertToStandard =
    displayInvoice.type === InvoiceType.PROFORMA &&
    displayInvoice.status !== InvoiceStatus.CANCELLED;

  const items = Array.isArray(displayInvoice.items) ? displayInvoice.items : [];
  const isJobInvoice = !!displayInvoice.jobId;
  const isQuotationInvoice = !!displayInvoice.quotationId;

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const blob = await invoicesService.downloadPdf(displayInvoice.id);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${displayInvoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Invoice PDF downloaded.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to download PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleConvertToStandard = async () => {
    setConverting(true);
    try {
      const created = await invoicesService.convertProformaToStandard(
        displayInvoice.id
      );
      toast.success(`Standard invoice created: ${created.invoiceNumber}`);

      // Refresh details
      const refreshed = await invoicesService.getById(displayInvoice.id);
      setFullInvoice(refreshed);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to convert to standard invoice"
      );
    } finally {
      setConverting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Invoice Details
              </DialogTitle>

              <div className="flex items-center gap-2 flex-wrap justify-end">
                {getTypeBadge(displayInvoice.type)}
                {getStatusBadge(displayInvoice.status)}

                {isJobInvoice && (
                  <Badge
                    variant="outline"
                    className="bg-purple-50 text-purple-700 border-purple-200"
                  >
                    <Briefcase className="w-3 h-3 mr-1" />
                    Job Invoice
                  </Badge>
                )}

                {isQuotationInvoice && (
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200"
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    From Quotation
                  </Badge>
                )}
              </div>
            </div>

            <DialogDescription>
              View invoice information, items, download PDF, send invoice, and convert proforma to standard.
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
                      <p className="text-sm text-muted-foreground">Invoice Number</p>
                      <p className="font-mono font-medium">{displayInvoice.invoiceNumber}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Invoice Date</p>
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
                        <p className="text-sm text-muted-foreground">Payment Terms</p>
                        <p>{displayInvoice.paymentTerms}</p>
                      </div>
                    )}

                    {displayInvoice.job && (
                      <div className="border-t pt-4">
                        <p className="text-sm text-muted-foreground">Related Job</p>
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
                        <p className="text-sm text-muted-foreground">Related Quotation</p>
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

                    {displayInvoice.type === InvoiceType.PROFORMA && (
                      <div className="border-t pt-4">
                        <p className="text-sm text-muted-foreground">Proforma Note</p>
                        <p className="text-sm">
                          This is a PROFORMA invoice. It cannot be paid until converted to a STANDARD invoice.
                        </p>
                      </div>
                    )}
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
                      <p className="text-sm text-muted-foreground">Customer Code</p>
                      <p className="font-medium">{displayInvoice.customer?.customerCode || "N/A"}</p>
                    </div>

                    {displayInvoice.customer?.businessName && (
                      <div>
                        <p className="text-sm text-muted-foreground">Business Name</p>
                        <p className="font-medium">{displayInvoice.customer.businessName}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-muted-foreground">Contact Person</p>
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
                            <TableHead className="min-w-[200px]">Product</TableHead>
                            <TableHead className="hidden md:table-cell">Description</TableHead>
                            <TableHead className="text-right min-w-[100px]">Unit Price</TableHead>
                            <TableHead className="text-center min-w-[80px]">Quantity</TableHead>
                            <TableHead className="text-right min-w-[100px]">Total</TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {items.map((item) => {
                            const quantity = Number(item.quantity || 0);
                            const unitPrice = Number(item.unitPrice || 0);
                            const subtotal = quantity * unitPrice;

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
                                  </div>
                                </TableCell>

                                <TableCell className="hidden md:table-cell">
                                  <p className="text-sm">{item.description}</p>
                                </TableCell>

                                <TableCell className="text-right">
                                  {formatCurrency(unitPrice)}
                                </TableCell>
                                <TableCell className="text-center">{quantity}</TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(subtotal)}
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
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total Amount:</span>
                        <span className="text-primary">
                          {formatCurrency(Number(displayInvoice.totalAmount))}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                >
                  {downloadingPdf ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Download PDF
                </Button>

                {hasPermission(PERMISSIONS.SALES_UPDATE) && canEdit && (
                  <Button onClick={onEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}

                {hasPermission(PERMISSIONS.SALES_UPDATE) && canSend && (
                  <Button
                    variant="outline"
                    onClick={() => setSendDialogOpen(true)}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send
                  </Button>
                )}

                {hasPermission(PERMISSIONS.SALES_CREATE) && canConvertToStandard && (
                  <Button
                    onClick={handleConvertToStandard}
                    disabled={converting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {converting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="mr-2 h-4 w-4" />
                    )}
                    Convert to Standard
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
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {displayInvoice && (
        <SendInvoiceDialog
          open={sendDialogOpen}
          onOpenChange={setSendDialogOpen}
          invoice={displayInvoice}
          onAfterStatusUpdated={() => {
            onOpenChange(false);
          }}
        />
      )}
    </>
  );
};

export default InvoiceViewDialog;
