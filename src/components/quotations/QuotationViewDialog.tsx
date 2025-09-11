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
  CheckCircle, 
  XCircle, 
  FileText, 
  Send, 
  Calendar,
  User,
  Phone,
  Mail,
  Building,
  ArrowRight
} from 'lucide-react';
import { Quotation, QuotationStatus } from '@/api/services/quotations.service';
import { formatCurrency, formatDate } from '@/utils/format.utils';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/utils/constants';

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

  if (!quotation) return null;

  const getStatusBadge = (status: QuotationStatus) => {
    const statusConfig = {
      [QuotationStatus.DRAFT]: { variant: "secondary" as const, className: "bg-gray-100 text-gray-800" },
      [QuotationStatus.SENT]: { variant: "default" as const, className: "bg-blue-500 text-white" },
      [QuotationStatus.APPROVED]: { variant: "default" as const, className: "bg-green-500 text-white" },
      [QuotationStatus.REJECTED]: { variant: "destructive" as const, className: "bg-red-500 text-white" },
      [QuotationStatus.EXPIRED]: { variant: "secondary" as const, className: "bg-orange-100 text-orange-800" },
      [QuotationStatus.CONVERTED]: { variant: "default" as const, className: "bg-purple-500 text-white" },
    };

    const config = statusConfig[status];
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0) + status.slice(1).toLowerCase()}
      </Badge>
    );
  };

  const canEdit = quotation.status === QuotationStatus.DRAFT;
  const canApprove = quotation.status === QuotationStatus.SENT;
  const canConvert = quotation.status === QuotationStatus.APPROVED;
  const canSend = quotation.status === QuotationStatus.DRAFT;

  // Safely handle items array with proper type checking
  const items = Array.isArray(quotation.items) ? quotation.items : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Quotation Details
            </DialogTitle>
            {getStatusBadge(quotation.status)}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Quotation Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Quotation Number</p>
                  <p className="font-mono font-medium">{quotation.quotationNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quotation Date</p>
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(quotation.quotationDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valid Until</p>
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(quotation.validUntil)}
                  </p>
                </div>
                {quotation.approvedDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Approved Date</p>
                    <p className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {formatDate(quotation.approvedDate)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Created By</p>
                  <p className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {quotation.createdByUser 
                      ? `${quotation.createdByUser.firstName} ${quotation.createdByUser.lastName}`
                      : 'N/A'
                    }
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
                  <p className="font-medium">{quotation.customer?.customerCode || 'N/A'}</p>
                </div>
                {quotation.customer?.businessName && (
                  <div>
                    <p className="text-sm text-muted-foreground">Business Name</p>
                    <p className="font-medium">{quotation.customer.businessName}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Contact Person</p>
                  <p className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {quotation.customer?.contactPerson || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {quotation.customer?.phone || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {quotation.customer?.email || 'N/A'}
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
                <p className="text-center text-muted-foreground py-4">No items found</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-center">Quantity</TableHead>
                        <TableHead className="text-center">Discount %</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => {
                        const quantity = Number(item.quantity || 0);
                        const unitPrice = Number(item.unitPrice || 0);
                        const discountPercentage = Number(item.discountPercentage || 0);
                        const subtotal = quantity * unitPrice;
                        const discountAmount = subtotal * (discountPercentage / 100);
                        const total = subtotal - discountAmount;

                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.product?.name || 'Unknown Product'}</p>
                                <p className="text-sm text-muted-foreground font-mono">
                                  SKU: {item.product?.sku || 'N/A'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {item.product?.category?.name}
                                  {item.product?.brand?.name && ` • ${item.product.brand.name}`}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">{item.description}</p>
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(unitPrice)}
                            </TableCell>
                            <TableCell className="text-center">
                              {quantity}
                            </TableCell>
                            <TableCell className="text-center">
                              {discountPercentage > 0 ? `${discountPercentage}%` : '-'}
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
                  <span>{formatCurrency(Number(quotation.subtotal))}</span>
                </div>
                {Number(quotation.discountAmount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(Number(quotation.discountAmount))}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>{formatCurrency(Number(quotation.taxAmount))}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(Number(quotation.totalAmount))}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {quotation.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{quotation.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Related Invoices */}
          {quotation.invoices && quotation.invoices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Related Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {quotation.invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(invoice.invoiceDate)} • {invoice.status}
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
            {hasPermission(PERMISSIONS.SALES_UPDATE) && canEdit && (
              <Button onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Quotation
              </Button>
            )}

            {hasPermission(PERMISSIONS.SALES_UPDATE) && canSend && (
              <Button
                variant="outline"
                onClick={() => onStatusUpdate(quotation, QuotationStatus.SENT)}
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
                  onClick={() => onStatusUpdate(quotation, QuotationStatus.APPROVED)}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                  onClick={() => onStatusUpdate(quotation, QuotationStatus.REJECTED)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </>
            )}

            {hasPermission(PERMISSIONS.SALES_UPDATE) && canConvert && (
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => onConvertToInvoice(quotation)}
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Convert to Invoice
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuotationViewDialog;
