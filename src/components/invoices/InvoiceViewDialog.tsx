import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Eye, 
  Edit, 
  Send, 
  Calendar,
  User,
  Phone,
  Mail,
  Building,
  CreditCard,
  Receipt,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { Invoice, InvoiceStatus } from '@/api/services/invoices.service';
import { formatCurrency } from '@/utils/currency.utils';
import { formatDate } from '@/utils/format.utils';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/utils/constants';

interface InvoiceViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
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

  const canEdit = invoice.status === InvoiceStatus.DRAFT;
  const canSend = invoice.status === InvoiceStatus.DRAFT;
  const canPayment = [InvoiceStatus.SENT, InvoiceStatus.PARTIAL].includes(invoice.status);
  const canCancel = [InvoiceStatus.DRAFT, InvoiceStatus.SENT].includes(invoice.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Invoice Details
            </DialogTitle>
            {getStatusBadge(invoice.status)}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                {invoice.paymentTerms && (
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Terms</p>
                    <p>{invoice.paymentTerms}</p>
                  </div>
                )}
                {invoice.quotation && (
                  <div>
                    <p className="text-sm text-muted-foreground">Related Quotation</p>
                    <p className="font-mono">{invoice.quotation.quotationNumber}</p>
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
                  <p className="text-sm text-muted-foreground">Business Name</p>
                  <p className="font-medium">{invoice.customer.businessName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact Person</p>
                  <p className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {invoice.customer.contactPerson}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {invoice.customer.phone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {invoice.customer.email}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Items Table */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.product.category.name}
                              {item.product.brand && ` • ${item.product.brand.name}`}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{item.product.sku}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(Number(item.quantity) * Number(item.unitPrice))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(invoice.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>{formatCurrency(invoice.taxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(invoice.totalAmount)}</span>
                </div>
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
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{receiptItem.receipt.receiptNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(receiptItem.receipt.paymentDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(receiptItem.receipt.totalAmount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-4">
            {hasPermission(PERMISSIONS.SALES_UPDATE) && canEdit && (
              <Button onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Invoice
              </Button>
            )}

            {hasPermission(PERMISSIONS.SALES_UPDATE) && canSend && (
              <Button
                variant="outline"
                onClick={() => onStatusUpdate(invoice, InvoiceStatus.SENT)}
              >
                <Send className="mr-2 h-4 w-4" />
                Send to Customer
              </Button>
            )}

            {hasPermission(PERMISSIONS.PAYMENTS_CREATE) && canPayment && (
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => onPayment(invoice)}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
            )}

            {hasPermission(PERMISSIONS.SALES_UPDATE) && canCancel && (
              <Button
                variant="outline"
                className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                onClick={() => onStatusUpdate(invoice, InvoiceStatus.CANCELLED)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Invoice
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceViewDialog;