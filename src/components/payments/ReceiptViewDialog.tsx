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
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 20px; 
              font-size: 12px;
              line-height: 1.4;
              color: #333;
            }
            .receipt-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
            }
            .receipt-header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .business-name {
              font-size: 24px;
              font-weight: bold;
              color: #333;
              margin-bottom: 5px;
            }
            .business-details {
              font-size: 11px;
              color: #666;
              margin-bottom: 15px;
            }
            .receipt-title {
              font-size: 20px;
              font-weight: bold;
              color: #333;
              margin-bottom: 5px;
            }
            .receipt-number {
              font-size: 16px;
              color: #666;
              margin-bottom: 10px;
            }
            .receipt-date {
              font-size: 12px;
              color: #666;
            }
            .section {
              margin: 20px 0;
            }
            .section-title {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 10px;
              color: #333;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            .details-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 20px;
            }
            .detail-item {
              margin-bottom: 8px;
            }
            .detail-label {
              font-weight: bold;
              color: #555;
              display: inline-block;
              width: 120px;
            }
            .detail-value {
              color: #333;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
              font-size: 11px;
            }
            th {
              background-color: #f8f9fa;
              font-weight: bold;
              color: #333;
            }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .total-row {
              font-weight: bold;
              background-color: #f9f9f9;
            }
            .invoice-items-table th,
            .invoice-items-table td {
              font-size: 10px;
              padding: 6px;
            }
            .summary-section {
              background-color: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            .summary-row.total {
              font-weight: bold;
              font-size: 14px;
              border-top: 1px solid #333;
              padding-top: 8px;
              margin-top: 10px;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 11px;
              color: #666;
            }
            .badge {
              display: inline-block;
              padding: 2px 6px;
              background-color: #e9ecef;
              color: #495057;
              font-size: 10px;
              border-radius: 3px;
              margin-left: 5px;
            }
            .badge-success {
              background-color: #d4edda;
              color: #155724;
            }
            .badge-danger {
              background-color: #f8d7da;
              color: #721c24;
            }
            .balance-info {
              background-color: #e7f3ff;
              padding: 10px;
              border-radius: 5px;
              margin: 15px 0;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .no-print { display: none !important; }
              .receipt-container { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="receipt-header">
              <div class="business-name">${fullReceipt.systemSettings?.businessName || 'ElectroBill Electronics'}</div>
              ${fullReceipt.systemSettings ? `
                <div class="business-details">
                  ${fullReceipt.systemSettings.email ? `${fullReceipt.systemSettings.email}<br>` : ''}
                  ${fullReceipt.systemSettings.phone ? `${fullReceipt.systemSettings.phone}<br>` : ''}
                  ${[
                    fullReceipt.systemSettings.addressLine1,
                    fullReceipt.systemSettings.addressLine2,
                    fullReceipt.systemSettings.city,
                    fullReceipt.systemSettings.country
                  ].filter(Boolean).join(', ')}<br>
                  ${fullReceipt.systemSettings.taxNumber ? `Tax No: ${fullReceipt.systemSettings.taxNumber}` : ''}
                </div>
              ` : ''}
              <div class="receipt-title">PAYMENT RECEIPT</div>
              <div class="receipt-number">#${fullReceipt.receiptNumber}</div>
              <div class="receipt-date">
                <strong>Date & Time:</strong> ${formatDateTime(paymentDateTime.toString())}
              </div>
            </div>

            <div class="section">
              <div class="section-title">Customer & Payment Information</div>
              <div class="details-grid">
                <div>
                  <div class="detail-item">
                    <span class="detail-label">Customer:</span>
                    <span class="detail-value">${fullReceipt.customer.businessName || fullReceipt.customer.contactPerson || 'N/A'}</span>
                  </div>
                  ${fullReceipt.customer.businessName && fullReceipt.customer.contactPerson ? `
                    <div class="detail-item">
                      <span class="detail-label">Contact:</span>
                      <span class="detail-value">${fullReceipt.customer.contactPerson}</span>
                    </div>
                  ` : ''}
                  <div class="detail-item">
                    <span class="detail-label">Customer Code:</span>
                    <span class="detail-value">${fullReceipt.customer.customerCode}</span>
                  </div>
                  ${fullReceipt.customer.email ? `
                    <div class="detail-item">
                      <span class="detail-label">Email:</span>
                      <span class="detail-value">${fullReceipt.customer.email}</span>
                    </div>
                  ` : ''}
                  ${fullReceipt.customer.phone ? `
                    <div class="detail-item">
                      <span class="detail-label">Phone:</span>
                      <span class="detail-value">${fullReceipt.customer.phone}</span>
                    </div>
                  ` : ''}
                </div>
                <div>
                  <div class="detail-item">
                    <span class="detail-label">Payment Method:</span>
                    <span class="detail-value">${fullReceipt.paymentMethod.name} <span class="badge">${fullReceipt.paymentMethod.type}</span></span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Amount Received:</span>
                    <span class="detail-value" style="font-size: 16px; font-weight: bold; color: #28a745;">${formatCurrency(Number(fullReceipt.totalAmount))}</span>
                  </div>
                  ${fullReceipt.referenceNumber ? `
                    <div class="detail-item">
                      <span class="detail-label">Reference:</span>
                      <span class="detail-value">${fullReceipt.referenceNumber}</span>
                    </div>
                  ` : ''}
                  <div class="detail-item">
                    <span class="detail-label">Processed By:</span>
                    <span class="detail-value">${fullReceipt.createdByUser.firstName} ${fullReceipt.createdByUser.lastName}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Invoice Payments</div>
              <table>
                <thead>
                  <tr>
                    <th>Invoice Number</th>
                    <th>Invoice Date</th>
                    <th class="text-right">Invoice Total</th>
                    <th class="text-right">Previous Paid</th>
                    <th class="text-right">Amount Paid</th>
                    <th class="text-right">Remaining</th>
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
                        <td class="text-right" style="color: ${remaining <= 0.01 ? '#28a745' : '#dc3545'}; font-weight: ${remaining <= 0.01 ? 'bold' : 'normal'};">
                          ${formatCurrency(Math.max(0, remaining))}
                          ${remaining <= 0.01 ? ' <span class="badge badge-success">PAID</span>' : ''}
                        </td>
                      </tr>
                    `;
                  }).join('') || '<tr><td colspan="6" class="text-center">No invoice items found</td></tr>'}
                </tbody>
              </table>

              ${fullReceipt.items?.some(item => item.invoice?.items && item.invoice.items.length > 0) ? `
                <div style="margin-top: 20px;">
                  <div class="section-title">Invoice Items Details</div>
                  ${fullReceipt.items.map(receiptItem => {
                    if (!receiptItem.invoice?.items || receiptItem.invoice.items.length === 0) return '';
                    
                    return `
                      <div style="margin-bottom: 15px;">
                        <strong style="color: #333;">Invoice: ${receiptItem.invoiceNumber}</strong>
                        <table class="invoice-items-table" style="margin-top: 5px;">
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th>SKU</th>
                              <th class="text-center">Qty</th>
                              <th class="text-right">Unit Price</th>
                              <th class="text-center">Discount %</th>
                              <th class="text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${receiptItem.invoice.items.map(invItem => {
                              const itemTotal = Number(invItem.quantity) * Number(invItem.unitPrice) * (1 - Number(invItem.discountPercentage) / 100);
                              return `
                                <tr>
                                  <td>
                                    <strong>${invItem.product.name}</strong>
                                    ${invItem.batch ? `<br><small>Batch: ${invItem.batch.batchNumber}</small>` : ''}
                                  </td>
                                  <td>${invItem.product.sku}</td>
                                  <td class="text-center">${Number(invItem.quantity)}</td>
                                  <td class="text-right">${formatCurrency(Number(invItem.unitPrice))}</td>
                                  <td class="text-center">${Number(invItem.discountPercentage)}%</td>
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
            </div>

            <div class="summary-section">
              <div class="section-title">Payment Summary</div>
              <div class="summary-row">
                <span>Total Amount Received:</span>
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
                <div class="summary-row" style="font-size: 11px; color: #666; margin-top: 10px;">
                  <span>Amount Before Tax (${fullReceipt.taxInformation.taxRate}%):</span>
                  <span>${formatCurrency(fullReceipt.taxInformation.totalBeforeTax)}</span>
                </div>
                <div class="summary-row" style="font-size: 11px; color: #666;">
                  <span>Tax Amount:</span>
                  <span>${formatCurrency(fullReceipt.taxInformation.taxAmount)}</span>
                </div>
              ` : ''}
            </div>

            ${fullReceipt.balanceExplanation ? `
              <div class="balance-info">
                <div class="section-title">Customer Balance Update</div>
                <div class="summary-row">
                  <span>Previous Balance:</span>
                  <span style="color: ${fullReceipt.balanceExplanation.previousBalance > 0 ? '#dc3545' : '#28a745'};">
                    ${formatCurrency(Math.abs(fullReceipt.balanceExplanation.previousBalance))}
                    ${fullReceipt.balanceExplanation.previousBalance > 0 ? ' (Debt)' : fullReceipt.balanceExplanation.previousBalance < 0 ? ' (Credit)' : ''}
                  </span>
                </div>
                <div class="summary-row">
                  <span>Payment Received:</span>
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
                    ${fullReceipt.balanceExplanation.balanceType === 'ZERO' ? ' (Paid in Full)' : ''}
                  </span>
                </div>
              </div>
            ` : ''}

            ${fullReceipt.notes ? `
              <div class="section">
                <div class="section-title">Notes</div>
                <div style="background-color: #f8f9fa; padding: 10px; border-radius: 5px;">
                  ${fullReceipt.notes}
                </div>
              </div>
            ` : ''}

            <div class="footer">
              <p><strong>Thank you for your payment!</strong></p>
              <p>Generated on ${formatDateTime(new Date().toString())} | System: ElectroBill</p>
              <p style="margin-top: 10px; font-size: 10px;">This is a computer-generated receipt and does not require a signature.</p>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
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
      <DialogContent className="max-w-[95vw] w-full sm:max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="no-print">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
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
            <div className="flex flex-wrap gap-2 mb-4 no-print">
              <Button onClick={handlePrint} variant="outline" className="flex-1 sm:flex-initial">
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button onClick={handleDownload} variant="outline" className="flex-1 sm:flex-initial">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              {onEdit && (
                <Button onClick={() => onEdit(receiptData)} variant="outline" className="flex-1 sm:flex-initial">
                  Edit
                </Button>
              )}
            </div>

            <div id="receipt-content" className="space-y-4 sm:space-y-6">
              <Card>
                <CardContent className="text-center pt-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Building className="h-6 w-6" />
                    <h1 className="text-xl sm:text-2xl font-bold">
                      {fullReceipt?.systemSettings?.businessName || 'ElectroBill Electronics'}
                    </h1>
                  </div>
                  {fullReceipt?.systemSettings && (
                    <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
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
                    <h2 className="text-lg sm:text-xl font-bold">PAYMENT RECEIPT</h2>
                    <p className="text-base sm:text-lg text-muted-foreground">#{receiptData.receiptNumber}</p>
                    <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span><strong>Date & Time:</strong> {formatDateTime(paymentDate)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="font-medium text-sm">Name:</span>
                      <p className="text-sm">
                        {receiptData.customer.businessName || 
                         receiptData.customer.contactPerson || 
                         'N/A'}
                      </p>
                    </div>
                    {receiptData.customer.businessName && receiptData.customer.contactPerson && (
                      <div>
                        <span className="font-medium text-sm">Contact:</span>
                        <p className="text-sm">{receiptData.customer.contactPerson}</p>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-sm">Customer Code:</span>
                      <p className="text-sm font-mono">{receiptData.customer.customerCode}</p>
                    </div>
                    {receiptData.customer.email && (
                      <div>
                        <span className="font-medium text-sm">Email:</span>
                        <p className="text-sm break-all">{receiptData.customer.email}</p>
                      </div>
                    )}
                    {receiptData.customer.phone && (
                      <div>
                        <span className="font-medium text-sm">Phone:</span>
                        <p className="text-sm">{receiptData.customer.phone}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Payment Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="font-medium text-sm">Payment Method:</span>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-sm">{receiptData.paymentMethod.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {receiptData.paymentMethod.type}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-sm">Amount Received:</span>
                      <p className="text-lg sm:text-xl font-bold text-green-600">
                        {formatCurrency(Number(receiptData.totalAmount))}
                      </p>
                    </div>
                    {receiptData.referenceNumber && (
                      <div>
                        <span className="font-medium text-sm">Reference:</span>
                        <p className="text-sm font-mono">{receiptData.referenceNumber}</p>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-sm">Processed By:</span>
                      <p className="text-sm">
                        {receiptData.createdByUser.firstName} {receiptData.createdByUser.lastName}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Invoice Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[120px]">Invoice Number</TableHead>
                          <TableHead className="hidden md:table-cell">Date</TableHead>
                          <TableHead className="text-right">Invoice Total</TableHead>
                          <TableHead className="text-right">Previous Paid</TableHead>
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
                              <TableCell className="font-medium text-sm">
                                {item.invoiceNumber}
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-sm">
                                {invoiceDate && formatDate(invoiceDate)}
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                {formatCurrency(Number(item.invoiceTotal))}
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                {formatCurrency(Number(item.previousBalance))}
                              </TableCell>
                              <TableCell className="text-right font-medium text-green-600 text-sm">
                                {formatCurrency(Number(item.amountPaid))}
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                <span className={remaining <= 0.01 ? 'text-green-600 font-medium' : ''}>
                                  {formatCurrency(Math.max(0, remaining))}
                                  {remaining <= 0.01 && (
                                    <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700">
                                      PAID
                                    </Badge>
                                  )}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Invoice Items Details */}
                  {receiptData.items?.some(item => item.invoice?.items && item.invoice.items.length > 0) && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-4 text-sm">Invoice Items Details</h4>
                      {receiptData.items.map(receiptItem => {
                        if (!receiptItem.invoice?.items || receiptItem.invoice.items.length === 0) return null;
                        
                        return (
                          <div key={receiptItem.id} className="mb-6">
                            <h5 className="font-medium text-sm text-blue-600 mb-2">
                              Invoice: {receiptItem.invoiceNumber}
                            </h5>
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="min-w-[150px]">Product</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead className="text-center">Qty</TableHead>
                                    <TableHead className="text-right">Unit Price</TableHead>
                                    <TableHead className="text-center">Discount</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {receiptItem.invoice.items.map(invItem => {
                                    const itemTotal = Number(invItem.quantity) * 
                                                    Number(invItem.unitPrice) * 
                                                    (1 - Number(invItem.discountPercentage) / 100);
                                    return (
                                      <TableRow key={invItem.id}>
                                        <TableCell>
                                          <div>
                                            <p className="font-medium text-sm">{invItem.product.name}</p>
                                            {invItem.batch && (
                                              <p className="text-xs text-muted-foreground">
                                                Batch: {invItem.batch.batchNumber}
                                              </p>
                                            )}
                                          </div>
                                        </TableCell>
                                        <TableCell className="text-sm font-mono">{invItem.product.sku}</TableCell>
                                        <TableCell className="text-center text-sm">{Number(invItem.quantity)}</TableCell>
                                        <TableCell className="text-right text-sm">{formatCurrency(Number(invItem.unitPrice))}</TableCell>
                                        <TableCell className="text-center text-sm">{Number(invItem.discountPercentage)}%</TableCell>
                                        <TableCell className="text-right font-medium text-sm">{formatCurrency(itemTotal)}</TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Payment Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Amount Received:</span>
                      <span className="font-medium">
                        {formatCurrency(Number(receiptData.totalAmount))}
                      </span>
                    </div>
                    
                    {fullReceipt?.taxInformation && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span>Applied to Invoices:</span>
                          <span>
                            {formatCurrency(fullReceipt.taxInformation.totalAmountPaidToInvoices)}
                          </span>
                        </div>
                        
                        {fullReceipt.taxInformation.balanceCredited > 0 && (
                          <div className="flex justify-between text-sm text-green-600 bg-green-50 p-2 rounded">
                            <span>Customer Credit:</span>
                            <span className="font-medium">
                              {formatCurrency(fullReceipt.taxInformation.balanceCredited)}
                            </span>
                          </div>
                        )}
                        
                        {fullReceipt.taxInformation.balanceIssued > 0 && (
                          <div className="flex justify-between text-sm text-blue-600 bg-blue-50 p-2 rounded">
                            <span>Change Issued:</span>
                            <span className="font-medium">
                              {formatCurrency(fullReceipt.taxInformation.balanceIssued)}
                            </span>
                          </div>
                        )}

                        <Separator />
                        
                        <div className="text-xs text-muted-foreground space-y-1">
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

              {fullReceipt?.balanceExplanation && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Customer Balance Update</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Previous Balance:</span>
                        <span className={`font-medium ${fullReceipt.balanceExplanation.previousBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(Math.abs(fullReceipt.balanceExplanation.previousBalance))}
                          {fullReceipt.balanceExplanation.previousBalance > 0 ? ' (Debt)' : fullReceipt.balanceExplanation.previousBalance < 0 ? ' (Credit)' : ''}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payment Received:</span>
                        <span className="text-green-600 font-medium">
                          -{formatCurrency(fullReceipt.balanceExplanation.paymentReceived)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-base">
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

              {receiptData.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm bg-gray-50 p-3 rounded">{receiptData.notes}</p>
                  </CardContent>
                </Card>
              )}

              <div className="text-center text-xs sm:text-sm text-muted-foreground border-t pt-4">
                <p className="font-medium">Thank you for your payment!</p>
                <p className="mt-1">
                  Generated on {formatDateTime(new Date().toString())} | System: ElectroBill
                </p>
                <p className="mt-2 text-xs">This is a computer-generated receipt and does not require a signature.</p>
              </div>
            </div>

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
