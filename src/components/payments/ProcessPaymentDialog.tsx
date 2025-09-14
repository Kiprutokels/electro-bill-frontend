import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, CreditCard, AlertTriangle, Calculator, Users } from "lucide-react";
import { formatCurrency, formatDate } from "@/utils/format.utils";
import { toast } from "sonner";
import {
  paymentService,
  PaymentMethod,
  OutstandingInvoice,
  CreatePaymentDto,
  ReceiptWithDetails,
} from "@/api/services/payment.service";
import { customersService, Customer } from "@/api/services/customers.service";

interface ProcessPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId?: string;
  preSelectedInvoiceId?: string;
  onPaymentProcessed?: (receipt: ReceiptWithDetails) => void;
}

interface PaymentItem {
  invoiceId: string;
  invoiceNumber: string;
  totalAmount: number;
  amountPaid: number;
  outstandingBalance: number;
  paymentAmount: number;
  selected: boolean;
  dueDate: string | Date;
  isOverdue: boolean;
}

const ProcessPaymentDialog: React.FC<ProcessPaymentDialogProps> = ({
  open,
  onOpenChange,
  customerId,
  preSelectedInvoiceId,
  onPaymentProcessed,
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [outstandingInvoices, setOutstandingInvoices] = useState<OutstandingInvoice[]>([]);
  const [paymentItems, setPaymentItems] = useState<PaymentItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>(customerId || "");

  const [formData, setFormData] = useState({
    paymentMethodId: "",
    totalAmount: 0,
    referenceNumber: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load initial data when dialog opens
  useEffect(() => {
    if (open) {
      loadInitialData();
    } else {
      // Reset form when dialog closes
      setFormData({
        paymentMethodId: "",
        totalAmount: 0,
        referenceNumber: "",
        notes: "",
      });
      setPaymentItems([]);
      setErrors({});
      if (!customerId) {
        setSelectedCustomer("");
      }
    }
  }, [open, customerId]);

  // Load outstanding invoices when customer changes
  useEffect(() => {
    if (selectedCustomer && open) {
      loadCustomerInvoices(selectedCustomer);
    } else {
      setOutstandingInvoices([]);
      setPaymentItems([]);
    }
  }, [selectedCustomer, open]);

  const loadInitialData = async () => {
    setLoadingData(true);
    try {
      const promises = [paymentService.getActivePaymentMethods()];
      
      if (!customerId) {
        promises.push(customersService.getAll(1, 100));
      }

      const results = await Promise.all(promises);
      setPaymentMethods(results[0]);
      
      if (!customerId && results[1]) {
        setCustomers(results[1].data || []);
      }

    } catch (error) {
      console.error("Failed to load initial data:", error);
      toast.error("Failed to load payment data");
    } finally {
      setLoadingData(false);
    }
  };

  const loadCustomerInvoices = async (custId: string) => {
    try {
      const invoices = await paymentService.getCustomerOutstandingInvoices(custId);
      setOutstandingInvoices(invoices);

      // Convert to payment items
      const items: PaymentItem[] = invoices.map((invoice) => ({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount,
        amountPaid: invoice.amountPaid,
        outstandingBalance: invoice.outstandingBalance,
        paymentAmount: 0,
        selected: preSelectedInvoiceId === invoice.id,
        dueDate: invoice.dueDate,
        isOverdue: invoice.isOverdue,
      }));

      // Pre-select invoice if specified
      if (preSelectedInvoiceId) {
        const preSelectedItem = items.find(item => item.invoiceId === preSelectedInvoiceId);
        if (preSelectedItem) {
          preSelectedItem.selected = true;
          preSelectedItem.paymentAmount = preSelectedItem.outstandingBalance;
          setFormData(prev => ({
            ...prev,
            totalAmount: preSelectedItem.outstandingBalance,
          }));
        }
      }

      setPaymentItems(items);
    } catch (error) {
      console.error("Failed to load customer invoices:", error);
      toast.error("Failed to load customer invoices");
      setOutstandingInvoices([]);
      setPaymentItems([]);
    }
  };

  const handleCustomerChange = (custId: string) => {
    setSelectedCustomer(custId);
    setFormData(prev => ({ ...prev, totalAmount: 0 }));
  };

  const handleItemSelection = (index: number, selected: boolean) => {
    const updatedItems = [...paymentItems];
    updatedItems[index].selected = selected;

    if (selected) {
      // Auto-fill with full outstanding amount
      updatedItems[index].paymentAmount = updatedItems[index].outstandingBalance;
    } else {
      updatedItems[index].paymentAmount = 0;
    }

    setPaymentItems(updatedItems);
    calculateTotalAmount(updatedItems);
  };

  const handlePaymentAmountChange = (index: number, amount: number) => {
    const updatedItems = [...paymentItems];
    const maxAmount = updatedItems[index].outstandingBalance;
    
    // Ensure amount doesn't exceed outstanding balance
    const validAmount = Math.min(Math.max(0, amount), maxAmount);
    updatedItems[index].paymentAmount = validAmount;

    // Auto-select if amount > 0
    if (validAmount > 0 && !updatedItems[index].selected) {
      updatedItems[index].selected = true;
    } else if (validAmount === 0 && updatedItems[index].selected) {
      updatedItems[index].selected = false;
    }

    setPaymentItems(updatedItems);
    calculateTotalAmount(updatedItems);
  };

  const calculateTotalAmount = (items: PaymentItem[]) => {
    const total = items
      .filter(item => item.selected)
      .reduce((sum, item) => sum + item.paymentAmount, 0);
    
    setFormData(prev => ({ ...prev, totalAmount: total }));
  };

  const handleSelectAll = () => {
    const allSelected = paymentItems.every(item => item.selected);
    const updatedItems = paymentItems.map(item => ({
      ...item,
      selected: !allSelected,
      paymentAmount: !allSelected ? item.outstandingBalance : 0,
    }));
    
    setPaymentItems(updatedItems);
    calculateTotalAmount(updatedItems);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedCustomer) {
      newErrors.customerId = "Please select a customer";
    }

    if (!formData.paymentMethodId) {
      newErrors.paymentMethodId = "Please select a payment method";
    }

    if (formData.totalAmount <= 0) {
      newErrors.totalAmount = "Payment amount must be greater than 0";
    }

    const selectedItems = paymentItems.filter(item => item.selected);
    if (selectedItems.length === 0) {
      newErrors.items = "Please select at least one invoice to pay";
    }

    // Validate individual payment amounts
    const invalidItems = selectedItems.filter(item => 
      item.paymentAmount <= 0 || item.paymentAmount > item.outstandingBalance
    );
    if (invalidItems.length > 0) {
      newErrors.amounts = "Please check payment amounts for selected invoices";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const selectedItems = paymentItems.filter(item => item.selected);
      
      const paymentData: CreatePaymentDto = {
        customerId: selectedCustomer,
        paymentMethodId: formData.paymentMethodId,
        totalAmount: formData.totalAmount,
        referenceNumber: formData.referenceNumber || undefined,
        notes: formData.notes || undefined,
        items: selectedItems.map(item => ({
          invoiceId: item.invoiceId,
          amountPaid: item.paymentAmount,
        })),
      };

      const receipt = await paymentService.processPayment(paymentData);
      
      if (onPaymentProcessed) {
        onPaymentProcessed(receipt);
      }
      
      onOpenChange(false);
      toast.success("Payment processed successfully");
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to process payment";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = paymentItems.filter(item => item.selected).length;
  const selectedTotal = paymentItems
    .filter(item => item.selected)
    .reduce((sum, item) => sum + item.paymentAmount, 0);

  const selectedCustomerData = customers.find(c => c.id === selectedCustomer);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Process Customer Payment
          </DialogTitle>
          <DialogDescription>
            Select a customer and invoices to pay, then enter payment details. A receipt will be automatically generated.
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading payment data...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Selection */}
            {!customerId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Select Customer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="customer">Customer *</Label>
                    <Select value={selectedCustomer} onValueChange={handleCustomerChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.businessName || customer.contactPerson || "Unknown Customer"}
                            <span className="text-muted-foreground ml-2">
                              ({customer.customerCode})
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.customerId && (
                      <p className="text-sm text-destructive mt-1">{errors.customerId}</p>
                    )}
                  </div>

                  {selectedCustomerData && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Customer Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Name:</span>
                          <span className="ml-2">
                            {selectedCustomerData.businessName || selectedCustomerData.contactPerson}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Code:</span>
                          <span className="ml-2">{selectedCustomerData.customerCode}</span>
                        </div>
                        {selectedCustomerData.email && (
                          <div>
                            <span className="text-muted-foreground">Email:</span>
                            <span className="ml-2">{selectedCustomerData.email}</span>
                          </div>
                        )}
                        {selectedCustomerData.currentBalance && (
                          <div>
                            <span className="text-muted-foreground">Balance:</span>
                            <span className={`ml-2 font-medium ${
                              Number(selectedCustomerData.currentBalance) > 0 
                                ? 'text-red-600' 
                                : Number(selectedCustomerData.currentBalance) < 0
                                ? 'text-green-600'
                                : 'text-gray-600'
                            }`}>
                              {formatCurrency(Number(selectedCustomerData.currentBalance))}
                              {Number(selectedCustomerData.currentBalance) > 0 && ' (Debt)'}
                              {Number(selectedCustomerData.currentBalance) < 0 && ' (Credit)'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Payment Method and Reference */}
            {selectedCustomer && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <Select
                    value={formData.paymentMethodId}
                    onValueChange={(value) =>
                      setFormData(prev => ({ ...prev, paymentMethodId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          {method.name} ({method.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.paymentMethodId && (
                    <p className="text-sm text-destructive mt-1">{errors.paymentMethodId}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="referenceNumber">Reference Number</Label>
                  <Input
                    id="referenceNumber"
                    placeholder="e.g., M-Pesa code, cheque number"
                    value={formData.referenceNumber}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, referenceNumber: e.target.value }))
                    }
                  />
                </div>
              </div>
            )}

            {/* Outstanding Invoices */}
            {selectedCustomer && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    Outstanding Invoices ({outstandingInvoices.length})
                    {selectedCount > 0 && (
                      <Badge variant="secondary">
                        {selectedCount} selected
                      </Badge>
                    )}
                  </CardTitle>
                  {outstandingInvoices.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                    >
                      {paymentItems.every(item => item.selected) ? "Deselect All" : "Select All"}
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {outstandingInvoices.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No outstanding invoices found for this customer.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">Select</TableHead>
                            <TableHead>Invoice</TableHead>
                            <TableHead className="hidden md:table-cell">Due Date</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Outstanding</TableHead>
                            <TableHead className="text-right min-w-[120px]">Payment Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paymentItems.map((item, index) => (
                            <TableRow key={item.invoiceId}>
                              <TableCell>
                                <Checkbox
                                  checked={item.selected}
                                  onCheckedChange={(checked) =>
                                    handleItemSelection(index, !!checked)
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div>
                                    <p className="font-medium">{item.invoiceNumber}</p>
                                    {item.isOverdue && (
                                      <Badge variant="destructive" className="mt-1">
                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                        Overdue
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <div className={`text-sm ${item.isOverdue ? 'text-red-600' : ''}`}>
                                  {formatDate(item.dueDate.toString())}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(item.totalAmount)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(item.outstandingBalance)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max={item.outstandingBalance}
                                  value={item.paymentAmount || ""}
                                  onChange={(e) =>
                                    handlePaymentAmountChange(index, parseFloat(e.target.value) || 0)
                                  }
                                  className="w-28 text-right"
                                  disabled={!item.selected}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  {errors.items && (
                    <p className="text-sm text-destructive mt-2">{errors.items}</p>
                  )}
                  {errors.amounts && (
                    <p className="text-sm text-destructive mt-2">{errors.amounts}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Payment Summary */}
            {selectedCount > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Payment Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="totalAmount">Total Payment Amount</Label>
                      <Input
                        id="totalAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.totalAmount || ""}
                        onChange={(e) =>
                          setFormData(prev => ({ ...prev, totalAmount: parseFloat(e.target.value) || 0 }))
                        }
                        className="text-lg font-bold"
                      />
                      {errors.totalAmount && (
                        <p className="text-sm text-destructive mt-1">{errors.totalAmount}</p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Selected Invoices:</span>
                        <span className="font-medium">{selectedCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Invoice Payments:</span>
                        <span className="font-medium">{formatCurrency(selectedTotal)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total Payment:</span>
                        <span>{formatCurrency(formData.totalAmount)}</span>
                      </div>
                      {formData.totalAmount > selectedTotal && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Excess (Customer Credit):</span>
                          <span>{formatCurrency(formData.totalAmount - selectedTotal)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {selectedCustomer && (
              <div>
                <Label htmlFor="notes">Payment Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Optional payment notes or description"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, notes: e.target.value }))
                  }
                  rows={3}
                />
              </div>
            )}

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button 
                type="submit" 
                disabled={loading || loadingData || selectedCount === 0} 
                className="flex-1"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Processing Payment..." : `Process Payment (${formatCurrency(formData.totalAmount)})`}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 sm:flex-initial"
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProcessPaymentDialog;
