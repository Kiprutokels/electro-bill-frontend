import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Download, Printer, Receipt, Building } from "lucide-react";
import { formatCurrency, formatDate, formatDateTime } from "@/utils/format.utils";
import { toast } from "sonner";
import {
  paymentService,
  Receipt as ReceiptType,
  ReceiptWithDetails,
} from "@/api/services/payment.service";

interface ReceiptViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: ReceiptType | null;
  onEdit?: (receipt: ReceiptType) => void;
}

const ReceiptViewDialog: React.FC<ReceiptViewDialogProps> = ({
  open,
  onOpenChange,
  receipt,
  onEdit,
}) => {
  const [loading, setLoading] = useState(false);
  const [fullReceipt, setFullReceipt] = useState<ReceiptWithDetails | null>(null);

  useEffect(() => {
    const fetchFullReceipt = async () => {
      if (receipt && open && receipt.id) {
        setLoading(true);
        try {
          const fullDetails = await paymentService.getReceiptById(receipt.id);
          setFullReceipt(fullDetails);
        } catch (error) {
          console.error("Failed to fetch receipt details:", error);
          toast.error("Failed to load receipt details");
          // Use basic receipt data as fallback
          setFullReceipt({
            ...receipt,
            taxInformation: {
              taxRate: 16,
              totalBeforeTax: 0,
              taxAmount: 0,
              totalAmountPaidToInvoices: 0,
              totalAmountReceived: Number(receipt.totalAmount),
              balanceIssued: Number(receipt.balanceIssued || 0),
              balanceCredited: Number(receipt.balanceCredited || 0),
            },
            systemSettings: {
              businessName: 'ElectroBill Electronics',
            },
          } as ReceiptWithDetails);
        } finally {
          setLoading(false);
        }
      }
    };

    if (open) {
      fetchFullReceipt();
    } else {
      setFullReceipt(null);
    }
  }, [receipt, open]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!fullReceipt) return;

    const printContent = document.getElementById('receipt-content');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${fullReceipt.receiptNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .receipt-header { text-align: center; margin-bottom: 30px; }
            .business-name { font-size: 24px; font-weight: bold; }
            .receipt-number { font-size: 18px; color: #666; }
            .section { margin: 20px 0; }
            .section-title { font-weight: bold; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .text-right { text-align: right; }
            .total-row { font-weight: bold; background-color: #f9f9f9; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  if (!receipt) return null;

  const receiptData = fullReceipt || receipt;
  const paymentDate = typeof receiptData.paymentDate === 'string' 
    ? receiptData.paymentDate 
    : receiptData.paymentDate.toString();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="no-print">
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Receipt Details - {receiptData.receiptNumber}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading receipt details...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Action Buttons */}
            <div className="flex gap-2 mb-4 no-print">
              <Button onClick={handlePrint} variant="outline" className="flex-1">
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button onClick={handleDownload} variant="outline" className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              {onEdit && (
                <Button onClick={() => onEdit(receiptData)} variant="outline" className="flex-1">
                  Edit
                </Button>
              )}
            </div>

            {/* Receipt Content */}
            <div id="receipt-content" className="space-y-6">
              {/* Business Header */}
              <Card>
                <CardContent className="text-center pt-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Building className="h-6 w-6" />
                    <h1 className="text-2xl font-bold">
                      {fullReceipt?.systemSettings?.businessName || 'ElectroBill Electronics'}
                    </h1>
                  </div>
                  {fullReceipt?.systemSettings && (
                    <div className="text-sm text-muted-foreground space-y-1">
                      {fullReceipt.systemSettings.email && (
                        <p>{fullReceipt.systemSettings.email}</p>
                      )}
                      {fullReceipt.systemSettings.phone && (
                        <p>{fullReceipt.systemSettings.phone}</p>
                      )}
                      {(fullReceipt.systemSettings.addressLine1 || fullReceipt.systemSettings.city) && (
                        <p>
                          {[
                            fullReceipt.systemSettings.addressLine1,
                            fullReceipt.systemSettings.addressLine2,
                            fullReceipt.systemSettings.city,
                            fullReceipt.systemSettings.country
                          ].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {fullReceipt.systemSettings.taxNumber && (
                        <p>Tax No: {fullReceipt.systemSettings.taxNumber}</p>
                      )}
                    </div>
                  )}
                  <Separator className="my-4" />
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold">PAYMENT RECEIPT</h2>
                    <p className="text-lg text-muted-foreground">#{receiptData.receiptNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      Date: {formatDateTime(paymentDate)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Customer & Payment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <span className="font-medium">Name:</span>
                      <p>
                        {receiptData.customer.businessName || 
                         receiptData.customer.contactPerson || 
                         'N/A'}
                      </p>
                    </div>
                    {receiptData.customer.businessName && receiptData.customer.contactPerson && (
                      <div>
                        <span className="font-medium">Contact:</span>
                        <p>{receiptData.customer.contactPerson}</p>
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Customer Code:</span>
                      <p>{receiptData.customer.customerCode}</p>
                    </div>
                    {receiptData.customer.email && (
                      <div>
                        <span className="font-medium">Email:</span>
                        <p>{receiptData.customer.email}</p>
                      </div>
                    )}
                    {receiptData.customer.phone && (
                      <div>
                        <span className="font-medium">Phone:</span>
                        <p>{receiptData.customer.phone}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Payment Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <span className="font-medium">Payment Method:</span>
                      <p>
                        {receiptData.paymentMethod.name}
                        <Badge variant="outline" className="ml-2">
                          {receiptData.paymentMethod.type}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Amount Received:</span>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(Number(receiptData.totalAmount))}
                      </p>
                    </div>
                    {receiptData.referenceNumber && (
                      <div>
                        <span className="font-medium">Reference:</span>
                        <p>{receiptData.referenceNumber}</p>
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Processed By:</span>
                      <p>
                        {receiptData.createdByUser.firstName} {receiptData.createdByUser.lastName}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Invoice Payments */}
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice Number</TableHead>
                        <TableHead className="hidden md:table-cell">Date</TableHead>
                        <TableHead className="text-right">Invoice Total</TableHead>
                        <TableHead className="text-right">Previous Balance</TableHead>
                        <TableHead className="text-right">Amount Paid</TableHead>
                        <TableHead className="text-right">Remaining</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receiptData.items?.map((item) => {
                        const remaining = Number(item.invoiceTotal) - 
                                        Number(item.previousBalance) - 
                                        Number(item.amountPaid);
                        
                        const invoiceDate = item.invoice?.invoiceDate 
                          ? (typeof item.invoice.invoiceDate === 'string' 
                              ? item.invoice.invoiceDate 
                              : item.invoice.invoiceDate.toString())
                          : null;
                        
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.invoiceNumber}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {invoiceDate && formatDate(invoiceDate)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(Number(item.invoiceTotal))}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(Number(item.previousBalance))}
                            </TableCell>
                            <TableCell className="text-right font-medium text-green-600">
                              {formatCurrency(Number(item.amountPaid))}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={remaining <= 0.01 ? 'text-green-600 font-medium' : ''}>
                                {formatCurrency(Math.max(0, remaining))}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Payment Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Amount Received:</span>
                      <span className="font-medium">
                        {formatCurrency(Number(receiptData.totalAmount))}
                      </span>
                    </div>
                    
                    {fullReceipt?.taxInformation && (
                      <>
                        <div className="flex justify-between">
                          <span>Applied to Invoices:</span>
                          <span>
                            {formatCurrency(fullReceipt.taxInformation.totalAmountPaidToInvoices)}
                          </span>
                        </div>
                        
                        {fullReceipt.taxInformation.balanceCredited > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Customer Credit:</span>
                            <span className="font-medium">
                              {formatCurrency(fullReceipt.taxInformation.balanceCredited)}
                            </span>
                          </div>
                        )}
                        
                        {fullReceipt.taxInformation.balanceIssued > 0 && (
                          <div className="flex justify-between text-blue-600">
                            <span>Change Issued:</span>
                            <span className="font-medium">
                              {formatCurrency(fullReceipt.taxInformation.balanceIssued)}
                            </span>
                          </div>
                        )}

                        <Separator />
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex justify-between">
                            <span>Amount Before Tax ({fullReceipt.taxInformation.taxRate}%):</span>
                            <span>{formatCurrency(fullReceipt.taxInformation.totalBeforeTax)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tax Amount:</span>
                            <span>{formatCurrency(fullReceipt.taxInformation.taxAmount)}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Balance Information */}
              {fullReceipt?.balanceExplanation && (
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Balance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Previous Balance:</span>
                        <span className={fullReceipt.balanceExplanation.previousBalance > 0 ? 'text-red-600' : 'text-green-600'}>
                          {formatCurrency(Math.abs(fullReceipt.balanceExplanation.previousBalance))}
                          {fullReceipt.balanceExplanation.previousBalance > 0 ? ' (Debt)' : fullReceipt.balanceExplanation.previousBalance < 0 ? ' (Credit)' : ''}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payment Received:</span>
                        <span className="text-green-600">
                          -{formatCurrency(fullReceipt.balanceExplanation.paymentReceived)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-medium">
                        <span>New Balance:</span>
                        <span className={
                          fullReceipt.balanceExplanation.balanceType === 'DEBT' ? 'text-red-600' :
                          fullReceipt.balanceExplanation.balanceType === 'CREDIT' ? 'text-green-600' :
                          'text-gray-600'
                        }>
                          {formatCurrency(Math.abs(fullReceipt.balanceExplanation.newBalance))}
                          {fullReceipt.balanceExplanation.balanceType === 'DEBT' && ' (Debt)'}
                          {fullReceipt.balanceExplanation.balanceType === 'CREDIT' && ' (Credit)'}
                          {fullReceipt.balanceExplanation.balanceType === 'ZERO' && ' (Paid in Full)'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              {receiptData.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{receiptData.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Footer */}
              <div className="text-center text-sm text-muted-foreground border-t pt-4">
                <p>Thank you for your payment!</p>
                <p className="mt-1">
                  Generated on {formatDateTime(new Date().toString())} | System: ElectroBill
                </p>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-4 no-print">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptViewDialog;
