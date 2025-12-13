import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Receipt,
  Building,
  Calendar,
  User,
  Mail,
  Phone,
  Loader2,
  AlertCircle,
  Send,
  CreditCard,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  Briefcase,
  FileText,
} from 'lucide-react';
import { invoicesService, Invoice, InvoiceStatus } from '@/api/services/invoices.service';
import { formatCurrency, formatDate } from '@/utils/format.utils';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/utils/constants';
import { toast } from 'sonner';

const InvoiceView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchInvoice();
    }
  }, [id]);

  const fetchInvoice = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const data = await invoicesService.getById(id);
      setInvoice(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load invoice');
      navigate('/invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: InvoiceStatus) => {
    if (!invoice) return;

    setActionLoading(true);
    try {
      const updated = await invoicesService.updateStatus(invoice.id, status);
      setInvoice(updated);
      toast.success(`Invoice ${status.toLowerCase()} successfully`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update invoice');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayment = () => {
    if (!invoice) return;
    navigate('/payments/new', { state: { invoice } });
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    const configs = {
      [InvoiceStatus.DRAFT]: {
        variant: 'secondary' as const,
        icon: Clock,
        className: 'bg-gray-100 text-gray-800',
      },
      [InvoiceStatus.SENT]: {
        variant: 'default' as const,
        icon: Send,
        className: 'bg-blue-500 text-white hover:bg-blue-600',
      },
      [InvoiceStatus.PARTIAL]: {
        variant: 'default' as const,
        icon: AlertTriangle,
        className: 'bg-yellow-500 text-white hover:bg-yellow-600',
      },
      [InvoiceStatus.PAID]: {
        variant: 'default' as const,
        icon: CheckCircle,
        className: 'bg-green-500 text-white hover:bg-green-600',
      },
      [InvoiceStatus.OVERDUE]: {
        variant: 'destructive' as const,
        icon: AlertTriangle,
        className: 'bg-orange-500 text-white hover:bg-orange-600',
      },
      [InvoiceStatus.CANCELLED]: {
        variant: 'destructive' as const,
        icon: XCircle,
        className: 'bg-red-500 text-white hover:bg-red-600',
      },
    };

    const config = configs[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0) + status.slice(1).toLowerCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p>Invoice not found</p>
            <Button variant="outline" onClick={() => navigate('/invoices')} className="mt-4">
              Back to Invoices
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canEdit = invoice.status === InvoiceStatus.DRAFT;
  const canSend = invoice.status === InvoiceStatus.DRAFT;
  const canPayment = [InvoiceStatus.SENT, InvoiceStatus.PARTIAL].includes(invoice.status);
  const canCancel = [InvoiceStatus.DRAFT, InvoiceStatus.SENT].includes(invoice.status);

  // Determine invoice source
  const isJobInvoice = !!invoice.jobId;
  const isQuotationInvoice = !!invoice.quotationId;

  // Calculate outstanding balance
  const outstandingBalance = Number(invoice.totalAmount) - Number(invoice.amountPaid);

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/invoices')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Invoice Details</h1>
            <p className="text-muted-foreground font-mono">{invoice.invoiceNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {getStatusBadge(invoice.status)}
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
          <Button variant="outline" size="icon" title="Download PDF">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <p className="font-mono font-medium">{invoice.invoiceNumber}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Invoice Date</p>
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(invoice.invoiceDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(invoice.dueDate)}
                </p>
              </div>
            </div>
            {invoice.paymentTerms && (
              <div>
                <p className="text-sm text-muted-foreground">Payment Terms</p>
                <p>{invoice.paymentTerms}</p>
              </div>
            )}
            {invoice.job && (
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">Related Job</p>
                <p className="font-mono font-medium text-purple-600">
                  {invoice.job.jobNumber}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {invoice.job.serviceDescription}
                </p>
              </div>
            )}
            {invoice.quotation && (
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">Related Quotation</p>
                <p className="font-mono font-medium text-blue-600">
                  {invoice.quotation.quotationNumber}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Created By</p>
              <p className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {invoice.createdByUser
                  ? `${invoice.createdByUser.firstName} ${invoice.createdByUser.lastName}`
                  : 'N/A'}
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
              <p className="text-sm text-muted-foreground">Customer Code</p>
              <p className="font-medium">{invoice.customer?.customerCode || 'N/A'}</p>
            </div>
            {invoice.customer?.businessName && (
              <div>
                <p className="text-sm text-muted-foreground">Business Name</p>
                <p className="font-medium">{invoice.customer.businessName}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Contact Person</p>
              <p className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {invoice.customer?.contactPerson || 'N/A'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {invoice.customer?.phone || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {invoice.customer?.email || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Items ({invoice.items?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Product</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead className="text-right min-w-[100px]">Unit Price</TableHead>
                  <TableHead className="text-center min-w-[80px]">Qty</TableHead>
                  <TableHead className="text-right min-w-[100px]">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items?.map((item: any) => {
                  const quantity = Number(item.quantity || 0);
                  const unitPrice = Number(item.unitPrice || 0);
                  const total = quantity * unitPrice;

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.product?.name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground font-mono">
                            SKU: {item.product?.sku || 'N/A'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.product?.category?.name}
                            {item.product?.brand?.name && ` • ${item.product.brand.name}`}
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
                      <TableCell className="text-center">{quantity}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(total)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-w-md ml-auto">
            <div className="flex justify-between text-base">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">{formatCurrency(Number(invoice.subtotal))}</span>
            </div>
            
            {Number(invoice.discountAmount) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span className="font-medium">-{formatCurrency(Number(invoice.discountAmount))}</span>
              </div>
            )}

            <div className="border-t pt-3 space-y-2">
              {Number(invoice.serviceFee) > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>Service Charge:</span>
                  <span className="font-medium">+{formatCurrency(Number(invoice.serviceFee))}</span>
                </div>
              )}
              
              {Number(invoice.processingFee) > 0 && (
                <div className="flex justify-between text-purple-600">
                  <span>Processing Fee:</span>
                  <span className="font-medium">+{formatCurrency(Number(invoice.processingFee))}</span>
                </div>
              )}
            </div>

            <div className="border-t pt-3">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Tax (included in prices):</span>
                <span>{formatCurrency(Number(invoice.taxAmount))}</span>
              </div>
            </div>

            <div className="border-t pt-3">
              <div className="flex justify-between font-bold text-lg">
                <span>Total Amount:</span>
                <span className="text-primary">{formatCurrency(Number(invoice.totalAmount))}</span>
              </div>
            </div>

            {Number(invoice.amountPaid) > 0 && (
              <>
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Amount Paid:</span>
                  <span>{formatCurrency(Number(invoice.amountPaid))}</span>
                </div>
                <div className="flex justify-between text-orange-600 font-medium border-t pt-3">
                  <span>Outstanding Balance:</span>
                  <span className="text-xl">{formatCurrency(outstandingBalance)}</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      {invoice.receiptItems && invoice.receiptItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invoice.receiptItems.map((receiptItem, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div>
                    <p className="font-medium">{receiptItem.receipt.receiptNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(receiptItem.receipt.paymentDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">
                      {formatCurrency(Number(receiptItem.receipt.totalAmount))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            {hasPermission(PERMISSIONS.SALES_UPDATE) && canEdit && (
              <Button onClick={() => navigate(`/invoices/${invoice.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Invoice
              </Button>
            )}

            {hasPermission(PERMISSIONS.SALES_UPDATE) && canSend && (
              <Button
                variant="outline"
                onClick={() => handleStatusUpdate(InvoiceStatus.SENT)}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send to Customer
              </Button>
            )}

            {hasPermission(PERMISSIONS.PAYMENTS_CREATE) && canPayment && (
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={handlePayment}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
            )}

            {hasPermission(PERMISSIONS.SALES_UPDATE) && canCancel && (
              <Button
                variant="outline"
                className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                onClick={() => handleStatusUpdate(InvoiceStatus.CANCELLED)}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" />
                )}
                Cancel Invoice
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceView;
