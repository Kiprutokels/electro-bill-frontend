import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, Trash2, Receipt } from 'lucide-react';
import { invoicesService, Invoice, CreateInvoiceRequest } from '@/api/services/invoices.service';
import { customersService, Customer } from '@/api/services/customers.service';
import { validateRequired } from '@/utils/validation.utils';
import { formatCurrency } from '@/utils/currency.utils';
import { toast } from 'sonner';

interface InvoiceItem {
  productId: string;
  productName: string;
  productSku: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

interface AddInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceAdded: (invoice: Invoice) => void;
}

const AddInvoiceDialog: React.FC<AddInvoiceDialogProps> = ({
  open,
  onOpenChange,
  onInvoiceAdded,
}) => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  
  const [formData, setFormData] = useState<CreateInvoiceRequest>({
    customerId: '',
    dueDate: '',
    paymentTerms: '',
    notes: '',
    discountAmount: 0,
    items: [],
  });
  
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      fetchCustomers();
      // Only set default payment terms, leave due date empty
      setFormData(prev => ({
        ...prev,
        paymentTerms: 'Net 30',
      }));
    }
  }, [open]);

  const fetchCustomers = async () => {
    try {
      const response = await customersService.getCustomers();
      console.log(response);
      // Handle both direct array and paginated response formats
      const customersData = Array.isArray(response) ? response : response.data;
      setCustomers(customersData.filter((c: Customer) => c.isActive));
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const searchProducts = async (search: string) => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const results = await invoicesService.searchProducts(search);
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search products:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const addProductToInvoice = (product: any) => {
    const existingItemIndex = invoiceItems.findIndex(item => item.productId === product.id);
    
    if (existingItemIndex >= 0) {
      const updatedItems = [...invoiceItems];
      updatedItems[existingItemIndex].quantity += 1;
      updatedItems[existingItemIndex].total = updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unitPrice;
      setInvoiceItems(updatedItems);
    } else {
      const newItem: InvoiceItem = {
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        unitPrice: Number(product.sellingPrice),
        quantity: 1,
        total: Number(product.sellingPrice),
      };
      setInvoiceItems(prev => [...prev, newItem]);
    }
    
    setProductSearch('');
    setSearchResults([]);
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) return;
    
    const updatedItems = [...invoiceItems];
    updatedItems[index].quantity = quantity;
    updatedItems[index].total = quantity * updatedItems[index].unitPrice;
    setInvoiceItems(updatedItems);
  };

  const removeItem = (index: number) => {
    setInvoiceItems(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const customerError = validateRequired(formData.customerId, 'Customer');
    if (customerError) newErrors.customerId = customerError;

    if (invoiceItems.length === 0) {
      newErrors.items = 'At least one item is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotals = () => {
    const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    const discount = formData.discountAmount || 0;
    const total = subtotal - discount;

    return {
      subtotal,
      discount,
      total,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const requestData: CreateInvoiceRequest = {
        ...formData,
        items: invoiceItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      const newInvoice = await invoicesService.createInvoice(requestData);
      onInvoiceAdded(newInvoice);
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create invoice';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      dueDate: '',
      paymentTerms: '',
      notes: '',
      discountAmount: 0,
      items: [],
    });
    setInvoiceItems([]);
    setProductSearch('');
    setSearchResults([]);
    setErrors({});
  };

  const totals = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Create New Invoice
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Selection */}
            <div>
              <Label htmlFor="customerId">Customer <span className="text-destructive">*</span></Label>
              <Select
                value={formData.customerId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, customerId: value }))}
              >
                <SelectTrigger className={errors.customerId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.businessName || customer.contactPerson}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customerId && <p className="text-sm text-destructive mt-1">{errors.customerId}</p>}
            </div>

            {/* Due Date */}
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
          </div>

          {/* Payment Terms */}
          <div>
            <Label htmlFor="paymentTerms">Payment Terms</Label>
            <Input
              id="paymentTerms"
              value={formData.paymentTerms}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
              placeholder="e.g., Net 30, Due on Receipt"
            />
          </div>

          {/* Product Search */}
          <div>
            <Label htmlFor="productSearch">Add Products</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="productSearch"
                placeholder="Search products by name or SKU..."
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  searchProducts(e.target.value);
                }}
                className="pl-10"
              />
              {searchLoading && (
                <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <Card className="mt-2">
                <CardContent className="p-0">
                  <div className="max-h-40 overflow-y-auto">
                    {searchResults.map((product) => (
                      <div
                        key={product.id}
                        className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                        onClick={() => addProductToInvoice(product)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(product.sellingPrice)}</p>
                            <p className="text-xs text-muted-foreground">Stock: {product.inventory?.reduce((sum: number, inv: any) => sum + inv.quantityAvailable, 0) || 0}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Invoice Items */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Items</CardTitle>
            </CardHeader>
            <CardContent>
              {invoiceItems.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No items added. Search and add products above.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-center">Quantity</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoiceItems.map((item, index) => (
                        <TableRow key={item.productId}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell className="font-mono">{item.productSku}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                              className="w-20 text-center"
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.total)}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(index)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {errors.items && <p className="text-sm text-destructive mt-2">{errors.items}</p>}
            </CardContent>
          </Card>

          {/* Pricing Summary */}
          {invoiceItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pricing Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="discountAmount">Discount Amount</Label>
                    <Input
                      id="discountAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.discountAmount}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        discountAmount: parseFloat(e.target.value) || 0 
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(totals.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>-{formatCurrency(totals.discount)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(totals.total)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes (optional)"
              rows={3}
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Creating Invoice...' : 'Create Invoice'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddInvoiceDialog;