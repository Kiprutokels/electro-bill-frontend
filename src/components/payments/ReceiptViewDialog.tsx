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
import { Loader2, Download, Printer, Receipt, Building, Clock } from "lucide-react";
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
    const printContent = document.getElementById('receipt-content');
    if (!printContent || !fullReceipt) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const paymentDateTime = new Date(fullReceipt.paymentDate);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${fullReceipt.receiptNumber}</title>
          <meta charset="utf-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 15px; 
              font-size: 11px;
              line-height: 1.3;
              color: #333;
            }
            .receipt-container { max-width: 600px; margin: 0 auto; background: white; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 1px solid #333; padding-bottom: 15px; }
            .business-name { font-size: 18px; font-weight: bold; margin-bottom: 3px; }
            .business-info { font-size: 9px; color: #666; margin-bottom: 10px; }
            .receipt-title { font-size: 16px; font-weight: bold; margin-bottom: 3px; }
            .receipt-meta { font-size: 10px; color: #666; }
            .section { margin: 15px 0; }
            .section-title { font-size: 12px; font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 3px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
            .info-item { margin-bottom: 5px; }
            .info-label { font-weight: bold; color: #555; display: inline-block; width: 80px; }
            .info-value { color: #333; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #ddd; padding: 5px; text-align: left; font-size: 10px; }
            th { background-color: #f8f9fa; font-weight: bold; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .summary { background-color: #f8f9fa; padding: 10px; border-radius: 3px; margin: 15px 0; }
            .summary-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
            .summary-row.total { font-weight: bold; border-top: 1px solid #333; padding-top: 5px; margin-top: 8px; }
            .footer { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 9px; color: #666; }
            .badge { padding: 1px 4px; background: #e9ecef; color: #495057; font-size: 8px; border-radius: 2px; }
            .badge-success { background: #d4edda; color: #155724; }
            .badge-danger { background: #f8d7da; color: #721c24; }
            .balance-info { background: #e7f3ff; padding: 8px; border-radius: 3px; margin: 10px 0; }
            .compact-table th, .compact-table td { padding: 3px; font-size: 9px; }
            @media print { body { margin: 0; padding: 8px; } .no-print { display: none !important; } }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <div class="business-name">${fullReceipt.systemSettings?.businessName || 'ElectroBill Electronics'}</div>
              ${fullReceipt.systemSettings ? `
                <div class="business-info">
                  ${[
                    fullReceipt.systemSettings.email,
                    fullReceipt.systemSettings.phone,
                    [fullReceipt.systemSettings.addressLine1, fullReceipt.systemSettings.city].filter(Boolean).join(', '),
                    fullReceipt.systemSettings.taxNumber ? `Tax: ${fullReceipt.systemSettings.taxNumber}` : ''
                  ].filter(Boolean).join(' | ')}
                </div>
              ` : ''}
              <div class="receipt-title">PAYMENT RECEIPT</div>
              <div class="receipt-meta">#${fullReceipt.receiptNumber} | ${formatDateTime(paymentDateTime.toString())}</div>
            </div>

            <div class="section">
              <div class="section-title">Payment Details</div>
              <div class="info-grid">
                <div>
                  <div class="info-item">
                    <span class="info-label">Customer:</span>
                    <span class="info-value">${fullReceipt.customer.businessName || fullReceipt.customer.contactPerson || 'N/A'}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Code:</span>
                    <span class="info-value">${fullReceipt.customer.customerCode}</span>
                  </div>
                  ${fullReceipt.customer.phone ? `
                    <div class="info-item">
                      <span class="info-label">Phone:</span>
                      <span class="info-value">${fullReceipt.customer.phone}</span>
                    </div>
                  ` : ''}
                </div>
                <div>
                  <div class="info-item">
                    <span class="info-label">Method:</span>
                    <span class="info-value">${fullReceipt.paymentMethod.name} <span class="badge">${fullReceipt.paymentMethod.type}</span></span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Amount:</span>
                    <span class="info-value" style="font-size: 14px; font-weight: bold; color: #28a745;">${formatCurrency(Number(fullReceipt.totalAmount))}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">By:</span>
                    <span class="info-value">${fullReceipt.createdByUser.firstName} ${fullReceipt.createdByUser.lastName}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Invoice Payments</div>
              <table>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th class="text-right">Total</th>
                    <th class="text-right">Prev Paid</th>
                    <th class="text-right">Paid Now</th>
                    <th class="text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  ${fullReceipt.items?.map((item) => {
                    const remaining = Number(item.invoiceTotal) - Number(item.previousBalance) - Number(item.amountPaid);
                    const invoiceDate = item.invoice?.invoiceDate 
                      ? formatDate(typeof item.invoice.invoiceDate === 'string' ? item.invoice.invoiceDate : item.invoice.invoiceDate.toString())
                      : 'N/A';
                    
                    return `
                      <tr>
                        <td style="font-weight: bold;">${item.invoiceNumber}</td>
                        <td>${invoiceDate}</td>
                        <td class="text-right">${formatCurrency(Number(item.invoiceTotal))}</td>
                        <td class="text-right">${formatCurrency(Number(item.previousBalance))}</td>
                        <td class="text-right" style="font-weight: bold; color: #28a745;">${formatCurrency(Number(item.amountPaid))}</td>
                        <td class="text-right" style="color: ${remaining <= 0.01 ? '#28a745' : '#dc3545'};">
                          ${formatCurrency(Math.max(0, remaining))}
                          ${remaining <= 0.01 ? ' <span class="badge badge-success">PAID</span>' : ''}
                        </td>
                      </tr>
                    `;
                  }).join('') || '<tr><td colspan="6" class="text-center">No items</td></tr>'}
                </tbody>
              </table>
            </div>

            ${fullReceipt.items?.some(item => item.invoice?.items?.length > 0) ? `
              <div class="section">
                <div class="section-title">Item Details</div>
                ${fullReceipt.items.map(receiptItem => {
                  if (!receiptItem.invoice?.items?.length) return '';
                  return `
                    <div style="margin-bottom: 10px;">
                      <strong style="color: #333;">Invoice: ${receiptItem.invoiceNumber}</strong>
                      <table class="compact-table">
                        <thead><tr><th>Product</th><th>Qty</th><th class="text-right">Price</th><th>Disc%</th><th class="text-right">Total</th></tr></thead>
                        <tbody>
                          ${receiptItem.invoice.items.map(invItem => {
                            const itemTotal = Number(invItem.quantity) * Number(invItem.unitPrice) * (1 - Number(invItem.discountPercentage) / 100);
                            return `
                              <tr>
                                <td>${invItem.product.name}${invItem.batch ? ` (${invItem.batch.batchNumber})` : ''}</td>
                                <td>${Number(invItem.quantity)}</td>
                                <td class="text-right">${formatCurrency(Number(invItem.unitPrice))}</td>
                                <td>${Number(invItem.discountPercentage)}%</td>
                                <td class="text-right">${formatCurrency(itemTotal)}</td>
                              </tr>
                            `;
                          }).join('')}
                        </tbody>
                      </table>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : ''}

            <div class="summary">
              <div class="section-title">Summary</div>
              <div class="summary-row">
                <span>Amount Received:</span>
                <strong>${formatCurrency(Number(fullReceipt.totalAmount))}</strong>
              </div>
              ${fullReceipt.taxInformation ? `
                <div class="summary-row">
                  <span>Applied to Invoices:</span>
                  <span>${formatCurrency(fullReceipt.taxInformation.totalAmountPaidToInvoices)}</span>
                </div>
                ${fullReceipt.taxInformation.balanceCredited > 0 ? `
                  <div class="summary-row" style="color: #28a745;">
                    <span>Customer Credit:</span>
                    <strong>${formatCurrency(fullReceipt.taxInformation.balanceCredited)}</strong>
                  </div>
                ` : ''}
                ${fullReceipt.taxInformation.balanceIssued > 0 ? `
                  <div class="summary-row" style="color: #007bff;">
                    <span>Change Issued:</span>
                    <strong>${formatCurrency(fullReceipt.taxInformation.balanceIssued)}</strong>
                  </div>
                ` : ''}
                <div style="font-size: 9px; color: #666; margin-top: 5px;">
                  Before Tax (${fullReceipt.taxInformation.taxRate}%): ${formatCurrency(fullReceipt.taxInformation.totalBeforeTax)} | 
                  Tax: ${formatCurrency(fullReceipt.taxInformation.taxAmount)}
                </div>
              ` : ''}
            </div>

            ${fullReceipt.balanceExplanation ? `
              <div class="balance-info">
                <div class="section-title">Balance Update</div>
                <div class="summary-row">
                  <span>Previous:</span>
                  <span style="color: ${fullReceipt.balanceExplanation.previousBalance > 0 ? '#dc3545' : '#28a745'};">
                    ${formatCurrency(Math.abs(fullReceipt.balanceExplanation.previousBalance))}
                    ${fullReceipt.balanceExplanation.previousBalance > 0 ? ' (Debt)' : fullReceipt.balanceExplanation.previousBalance < 0 ? ' (Credit)' : ''}
                  </span>
                </div>
                <div class="summary-row">
                  <span>Payment:</span>
                  <span style="color: #28a745;">-${formatCurrency(fullReceipt.balanceExplanation.paymentReceived)}</span>
                </div>
                <div class="summary-row total">
                  <span>New Balance:</span>
                  <span style="color: ${
                    fullReceipt.balanceExplanation.balanceType === 'DEBT' ? '#dc3545' :
                    fullReceipt.balanceExplanation.balanceType === 'CREDIT' ? '#28a745' : '#6c757d'
                  };">
                    ${formatCurrency(Math.abs(fullReceipt.balanceExplanation.newBalance))}
                    ${fullReceipt.balanceExplanation.balanceType === 'DEBT' ? ' (Debt)' : ''}
                    ${fullReceipt.balanceExplanation.balanceType === 'CREDIT' ? ' (Credit)' : ''}
                    ${fullReceipt.balanceExplanation.balanceType === 'ZERO' ? ' (Paid)' : ''}
                  </span>
                </div>
              </div>
            ` : ''}

            ${fullReceipt.notes ? `
              <div class="section">
                <div class="section-title">Notes</div>
                <div style="background: #f8f9fa; padding: 8px; border-radius: 3px; font-size: 10px;">
                  ${fullReceipt.notes}
                </div>
              </div>
            ` : ''}

            <div class="footer">
              <p><strong>Thank you for your payment!</strong></p>
              <p>Generated: ${formatDateTime(new Date().toString())} | ElectroBill System</p>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  const handleDownload = () => {
    handlePrint();
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
            Receipt - {receiptData.receiptNumber}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center space-y-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading receipt...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-4 no-print">
              <Button onClick={handlePrint} variant="outline" size="sm">
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                PDF
              </Button>
              {onEdit && (
                <Button onClick={() => onEdit(receiptData)} variant="outline" size="sm">
                  Edit
                </Button>
              )}
            </div>

            <div id="receipt-content" className="space-y-4">
              {/* Compact Header */}
              <Card>
                <CardContent className="text-center pt-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Building className="h-5 w-5" />
                    <h1 className="text-lg font-bold">
                      {fullReceipt?.systemSettings?.businessName || 'ElectroBill Electronics'}
                    </h1>
                  </div>
                  {fullReceipt?.systemSettings && (
                    <p className="text-xs text-muted-foreground mb-2">
                      {[
                        fullReceipt.systemSettings.email,
                        fullReceipt.systemSettings.phone,
                        [fullReceipt.systemSettings.addressLine1, fullReceipt.systemSettings.city].filter(Boolean).join(', ')
                      ].filter(Boolean).join(' | ')}
                    </p>
                  )}
                  <Separator className="my-3" />
                  <h2 className="text-base font-bold">PAYMENT RECEIPT</h2>
                  <p className="text-sm text-muted-foreground">#{receiptData.receiptNumber}</p>
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDateTime(paymentDate)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Compact Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Customer</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-xs">
                    <div><strong>Name:</strong> {receiptData.customer.businessName || receiptData.customer.contactPerson || 'N/A'}</div>
                    <div><strong>Code:</strong> {receiptData.customer.customerCode}</div>
                    {receiptData.customer.phone && <div><strong>Phone:</strong> {receiptData.customer.phone}</div>}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Payment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-xs">
                    <div>
                      <strong>Method:</strong> {receiptData.paymentMethod.name} 
                      <Badge variant="outline" className="ml-1 text-xs">{receiptData.paymentMethod.type}</Badge>
                    </div>
                    <div><strong>Amount:</strong> <span className="text-green-600 font-bold text-sm">{formatCurrency(Number(receiptData.totalAmount))}</span></div>
                    <div><strong>By:</strong> {receiptData.createdByUser.firstName} {receiptData.createdByUser.lastName}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Compact Invoice Table */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Invoice Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="text-xs">
                        <TableHead className="py-2">Invoice #</TableHead>
                        <TableHead className="py-2 hidden sm:table-cell">Date</TableHead>
                        <TableHead className="py-2 text-right">Total</TableHead>
                        <TableHead className="py-2 text-right">Paid Now</TableHead>
                        <TableHead className="py-2 text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receiptData.items?.map((item) => {
                        const remaining = Number(item.invoiceTotal) - Number(item.previousBalance) - Number(item.amountPaid);
                        const invoiceDate = item.invoice?.invoiceDate 
                          ? (typeof item.invoice.invoiceDate === 'string' ? item.invoice.invoiceDate : item.invoice.invoiceDate.toString())
                          : null;
                        
                        return (
                          <TableRow key={item.id} className="text-xs">
                            <TableCell className="py-1 font-medium">{item.invoiceNumber}</TableCell>
                            <TableCell className="py-1 hidden sm:table-cell">{invoiceDate && formatDate(invoiceDate)}</TableCell>
                            <TableCell className="py-1 text-right">{formatCurrency(Number(item.invoiceTotal))}</TableCell>
                            <TableCell className="py-1 text-right font-medium text-green-600">{formatCurrency(Number(item.amountPaid))}</TableCell>
                            <TableCell className="py-1 text-right">
                              <span className={remaining <= 0.01 ? 'text-green-600 font-medium' : ''}>
                                {formatCurrency(Math.max(0, remaining))}
                                {remaining <= 0.01 && <Badge variant="outline" className="ml-1 text-xs bg-green-50">PAID</Badge>}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Invoice Items Details */}
              {receiptData.items?.some(item => item.invoice?.items && item.invoice.items.length > 0) && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Invoice Items</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {receiptData.items.map(receiptItem => {
                      if (!receiptItem.invoice?.items || receiptItem.invoice.items.length === 0) return null;
                      
                      return (
                        <div key={receiptItem.id}>
                          <h5 className="font-medium text-xs text-blue-600 dark:text-blue-400 mb-2">
                            Invoice: {receiptItem.invoiceNumber}
                          </h5>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="text-xs">
                                  <TableHead className="py-1">Product</TableHead>
                                  <TableHead className="py-1 text-center w-16">Qty</TableHead>
                                  <TableHead className="py-1 text-right">Price</TableHead>
                                  <TableHead className="py-1 text-center w-16">Disc%</TableHead>
                                  <TableHead className="py-1 text-right">Total</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {receiptItem.invoice.items.map(invItem => {
                                  const itemTotal = Number(invItem.quantity) * 
                                                  Number(invItem.unitPrice) * 
                                                  (1 - Number(invItem.discountPercentage) / 100);
                                  return (
                                    <TableRow key={invItem.id} className="text-xs">
                                      <TableCell className="py-1">
                                        <div>
                                          <p className="font-medium">{invItem.product.name}</p>
                                          {invItem.batch && (
                                            <p className="text-xs text-muted-foreground">
                                              Batch: {invItem.batch.batchNumber}
                                            </p>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell className="py-1 text-center">{Number(invItem.quantity)}</TableCell>
                                      <TableCell className="py-1 text-right">{formatCurrency(Number(invItem.unitPrice))}</TableCell>
                                      <TableCell className="py-1 text-center">{Number(invItem.discountPercentage)}%</TableCell>
                                      <TableCell className="py-1 text-right font-medium">{formatCurrency(itemTotal)}</TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Compact Summary */}
              <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Summary</CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-1">
                  <div className="flex justify-between"><span>Amount Received:</span><strong>{formatCurrency(Number(receiptData.totalAmount))}</strong></div>
                  {fullReceipt?.taxInformation && (
                    <>
                      <div className="flex justify-between"><span>Applied to Invoices:</span><span>{formatCurrency(fullReceipt.taxInformation.totalAmountPaidToInvoices)}</span></div>
                      {fullReceipt.taxInformation.balanceCredited > 0 && (
                        <div className="flex justify-between text-green-600 dark:text-green-400"><span>Customer Credit:</span><strong>{formatCurrency(fullReceipt.taxInformation.balanceCredited)}</strong></div>
                      )}
                      {fullReceipt.taxInformation.balanceIssued > 0 && (
                        <div className="flex justify-between text-blue-600 dark:text-blue-400"><span>Change Issued:</span><strong>{formatCurrency(fullReceipt.taxInformation.balanceIssued)}</strong></div>
                      )}
                      <Separator className="my-1" />
                      <div className="flex justify-between text-muted-foreground"><span>Before Tax ({fullReceipt.taxInformation.taxRate}%):</span><span>{formatCurrency(fullReceipt.taxInformation.totalBeforeTax)}</span></div>
                      <div className="flex justify-between text-muted-foreground"><span>Tax Amount:</span><span>{formatCurrency(fullReceipt.taxInformation.taxAmount)}</span></div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Balance Update (if exists) */}
              {fullReceipt?.balanceExplanation && (
                <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Balance Update</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>Previous:</span>
                      <span className={fullReceipt.balanceExplanation.previousBalance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                        {formatCurrency(Math.abs(fullReceipt.balanceExplanation.previousBalance))}
                        {fullReceipt.balanceExplanation.previousBalance > 0 ? ' (Debt)' : fullReceipt.balanceExplanation.previousBalance < 0 ? ' (Credit)' : ''}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment:</span>
                      <span className="text-green-600 dark:text-green-400">-{formatCurrency(fullReceipt.balanceExplanation.paymentReceived)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>New Balance:</span>
                      <span className={
                        fullReceipt.balanceExplanation.balanceType === 'DEBT' ? 'text-red-600 dark:text-red-400' :
                        fullReceipt.balanceExplanation.balanceType === 'CREDIT' ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
                      }>
                        {formatCurrency(Math.abs(fullReceipt.balanceExplanation.newBalance))}
                        {fullReceipt.balanceExplanation.balanceType === 'DEBT' && ' (Debt)'}
                        {fullReceipt.balanceExplanation.balanceType === 'CREDIT' && ' (Credit)'}
                        {fullReceipt.balanceExplanation.balanceType === 'ZERO' && ' (Paid)'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notes (if exists) */}
              {receiptData.notes && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs bg-gray-50 p-2 rounded">{receiptData.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Compact Footer */}
              <div className="text-center text-xs text-muted-foreground border-t pt-3">
                <p className="font-medium">Thank you for your payment!</p>
                <p className="mt-1">Generated: {formatDateTime(new Date().toString())} | ElectroBill</p>
              </div>
            </div>

            <div className="flex justify-end pt-3 no-print">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
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