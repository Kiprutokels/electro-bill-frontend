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
import { Loader2, CreditCard, AlertTriangle, Calculator, Users, Search, X } from "lucide-react";
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
  const [customerSearch, setCustomerSearch] = useState("");
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const [formData, setFormData] = useState({
    paymentMethodId: "",
    totalAmount: 0,
    referenceNumber: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      loadInitialData();
    } else {
      setFormData({
        paymentMethodId: "",
        totalAmount: 0,
        referenceNumber: "",
        notes: "",
      });
      setPaymentItems([]);
      setErrors({});
      setCustomerSearch("");
      setShowCustomerDropdown(false);
      if (!customerId) {
        setSelectedCustomer("");
      }
    }
  }, [open, customerId]);

  useEffect(() => {
    if (selectedCustomer && open) {
      loadCustomerInvoices(selectedCustomer);
    } else {
      setOutstandingInvoices([]);
      setPaymentItems([]);
    }
  }, [selectedCustomer, open]);

  // Customer search effect
  useEffect(() => {
    if (customerSearch && !customerId) {
      const searchTimeout = setTimeout(() => {
        searchCustomers(customerSearch);
      }, 300);
      
      return () => clearTimeout(searchTimeout);
    } else if (!customerSearch) {
      setCustomers([]);
      setShowCustomerDropdown(false);
    }
  }, [customerSearch, customerId]);

  const searchCustomers = async (search: string) => {
    if (search.length < 2) return;
    
    setSearchingCustomers(true);
    try {
      const response = await customersService.getCustomers({ 
        page: 1, 
        limit: 10, 
        search: search.trim()
      });
      setCustomers(response.data || []);
      setShowCustomerDropdown(true);
    } catch (error) {
      console.error("Failed to search customers:", error);
      toast.error("Failed to search customers");
    } finally {
      setSearchingCustomers(false);
    }
  };

  const loadInitialData = async () => {
    setLoadingData(true);
    try {
      const paymentMethodsData = await paymentService.getActivePaymentMethods();
      setPaymentMethods(paymentMethodsData);
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

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer.id);
    setCustomerSearch(customer.businessName || customer.contactPerson || customer.customerCode);
    setShowCustomerDropdown(false);
    setFormData(prev => ({ ...prev, totalAmount: 0 }));
  };

  const clearCustomerSelection = () => {
    setSelectedCustomer("");
    setCustomerSearch("");
    setCustomers([]);
    setShowCustomerDropdown(false);
    setFormData(prev => ({ ...prev, totalAmount: 0 }));
  };

  const handleItemSelection = (index: number, selected: boolean) => {
    const updatedItems = [...paymentItems];
    updatedItems[index].selected = selected;

    if (selected) {
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
    
    const validAmount = Math.min(Math.max(0, amount), maxAmount);
    updatedItems[index].paymentAmount = validAmount;

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
      <DialogContent className="max-w-[95vw] w-full sm:max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <CreditCard className="h-5 w-5" />
            Process Customer Payment
          </DialogTitle>
          <DialogDescription className="text-sm">
            Search and select a customer, then choose invoices to pay and enter payment details.
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
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {!customerId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Users className="h-5 w-5" />
                    Select Customer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="customer">Customer *</Label>
                    <div className="relative">
                      <div className="flex items-center space-x-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <Input
                            placeholder="Search customer by name, code, or phone..."
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            className="pl-10 pr-10"
                          />
                          {customerSearch && (
                            <button
                              type="button"
                              onClick={clearCustomerSelection}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                          {searchingCustomers && (
                            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
                          )}
                        </div>
                      </div>
                      
                      {showCustomerDropdown && customers.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                          {customers.map((customer) => (
                            <div
                              key={customer.id}
                              onClick={() => handleCustomerSelect(customer)}
                              className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium text-sm">
                                  {customer.businessName || customer.contactPerson || "Unknown Customer"}
                                </span>
                                <div className="text-xs text-gray-500 mt-1">
                                  Code: {customer.customerCode}
                                  {customer.phone && ` • Phone: ${customer.phone}`}
                                  {customer.email && ` • Email: ${customer.email}`}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {errors.customerId && (
                      <p className="text-sm text-destructive mt-1">{errors.customerId}</p>
                    )}
                  </div>

                  {selectedCustomerData && (
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-3 text-sm">Selected Customer</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                        <div>
                          <span className="text-muted-foreground">Name:</span>
                          <p className="font-medium break-words">
                            {selectedCustomerData.businessName || selectedCustomerData.contactPerson}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Code:</span>
                          <p className="font-medium">{selectedCustomerData.customerCode}</p>
                        </div>
                        {selectedCustomerData.email && (
                          <div className="sm:col-span-2">
                            <span className="text-muted-foreground">Email:</span>
                            <p className="font-medium break-all">{selectedCustomerData.email}</p>
                          </div>
                        )}
                        {selectedCustomerData.phone && (
                          <div>
                            <span className="text-muted-foreground">Phone:</span>
                            <p className="font-medium">{selectedCustomerData.phone}</p>
                          </div>
                        )}
                        {selectedCustomerData.currentBalance !== undefined && (
                          <div>
                            <span className="text-muted-foreground">Balance:</span>
                            <p className={`font-bold ${
                              Number(selectedCustomerData.currentBalance) > 0 
                                ? 'text-red-600' 
                                : Number(selectedCustomerData.currentBalance) < 0
                                ? 'text-green-600'
                                : 'text-gray-600'
                            }`}>
                              {formatCurrency(Number(selectedCustomerData.currentBalance))}
                              {Number(selectedCustomerData.currentBalance) > 0 && ' (Debt)'}
                              {Number(selectedCustomerData.currentBalance) < 0 && ' (Credit)'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {selectedCustomer && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <Select
                    value={formData.paymentMethodId}
                    onValueChange={(value) =>
                      setFormData(prev => ({ ...prev, paymentMethodId: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          <div className="flex items-center gap-2">
                            <span>{method.name}</span>
                            <Badge variant="outline" className="text-xs">{method.type}</Badge>
                          </div>
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
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {selectedCustomer && (
              <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    Outstanding Invoices ({outstandingInvoices.length})
                    {selectedCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
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
                      className="w-full sm:w-auto"
                    >
                      {paymentItems.every(item => item.selected) ? "Deselect All" : "Select All"}
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {outstandingInvoices.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground text-sm">
                        No outstanding invoices found for this customer.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">Select</TableHead>
                            <TableHead className="min-w-[120px]">Invoice</TableHead>
                            <TableHead className="hidden md:table-cell">Due Date</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Outstanding</TableHead>
                            <TableHead className="text-right min-w-[140px]">Payment Amount</TableHead>
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
                                <div>
                                  <p className="font-medium text-sm">{item.invoiceNumber}</p>
                                  {item.isOverdue && (
                                    <Badge variant="destructive" className="mt-1 text-xs">
                                      <AlertTriangle className="w-3 h-3 mr-1" />
                                      Overdue
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <div className={`text-xs sm:text-sm ${item.isOverdue ? 'text-red-600 font-medium' : ''}`}>
                                  {formatDate(item.dueDate.toString())}
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-sm font-medium">
                                {formatCurrency(item.totalAmount)}
                              </TableCell>
                              <TableCell className="text-right font-bold text-sm text-orange-600">
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
                                  className="w-full sm:w-32 text-right text-sm font-medium"
                                  disabled={!item.selected}
                                  placeholder="0.00"
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

            {selectedCount > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Calculator className="h-5 w-5" />
                    Payment Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
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
                        className="text-xl font-bold w-full"
                      />
                      {errors.totalAmount && (
                        <p className="text-sm text-destructive mt-1">{errors.totalAmount}</p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Selected Invoices:</span>
                        <span className="font-bold">{selectedCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Invoice Payments:</span>
                        <span className="font-bold text-blue-600">{formatCurrency(selectedTotal)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-base sm:text-lg font-bold">
                        <span>Total Payment:</span>
                        <span className="text-green-600">{formatCurrency(formData.totalAmount)}</span>
                      </div>
                      {formData.totalAmount > selectedTotal && (
                        <div className="flex justify-between text-xs sm:text-sm text-green-600 bg-green-50 p-2 rounded">
                          <span>Excess (Customer Credit):</span>
                          <span className="font-bold">{formatCurrency(formData.totalAmount - selectedTotal)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
                  className="w-full resize-none"
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={loading || loadingData || selectedCount === 0} 
                className="flex-1 order-2 sm:order-1 h-12"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Processing Payment..." : `Process Payment (${formatCurrency(formData.totalAmount)})`}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 sm:flex-initial order-1 sm:order-2 h-12"
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
