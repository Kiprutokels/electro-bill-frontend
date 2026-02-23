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
import { Receipt, Loader2, Search, Trash2, FileText, Plus } from "lucide-react";
import {
  invoicesService,
  Invoice,
  CreateInvoiceRequest,
  ProductSearchResult,
  InvoiceType,
} from "@/api/services/invoices.service";
import { validateRequired } from "@/utils/validation.utils";
import { formatCurrency } from "@/utils/format.utils";
import { toast } from "sonner";
import CustomerSearchCombobox from "@/components/jobs/CustomerSearchCombobox";

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
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  const [formData, setFormData] = useState<CreateInvoiceRequest>({
    customerId: "",
    dueDate: "",
    paymentTerms: "Net 30",
    notes: "",
    discountAmount: 0,
    type: InvoiceType.STANDARD,
    items: [],
  });

  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

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
      console.error("Failed to search products:", error);
      toast.error("Failed to search products");
    } finally {
      setSearchLoading(false);
    }
  };

  const addProductToInvoice = (product: ProductSearchResult) => {
    const existingItemIndex = invoiceItems.findIndex(
      (item) => item.productId === product.id,
    );

    if (existingItemIndex >= 0) {
      const updatedItems = [...invoiceItems];
      updatedItems[existingItemIndex].quantity += 1;
      updatedItems[existingItemIndex].total =
        updatedItems[existingItemIndex].quantity *
        updatedItems[existingItemIndex].unitPrice;
      setInvoiceItems(updatedItems);
    } else {
      const unitPrice = Number(product.sellingPrice);
      const newItem: InvoiceItem = {
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        unitPrice,
        quantity: 1,
        total: unitPrice,
      };
      setInvoiceItems((prev) => [...prev, newItem]);
    }

    setProductSearch("");
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
    setInvoiceItems((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const customerError = validateRequired(formData.customerId, "Customer");
    if (customerError) newErrors.customerId = customerError;

    if (!formData.type) newErrors.type = "Invoice type is required";

    if (invoiceItems.length === 0) {
      newErrors.items = "At least one item is required";
    }

    const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    const discount = Number(formData.discountAmount || 0);
    if (discount < 0) {
      newErrors.discountAmount = "Discount cannot be negative";
    } else if (discount > subtotal) {
      newErrors.discountAmount = "Discount cannot exceed subtotal";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotals = () => {
    const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    const discount = Number(formData.discountAmount || 0);
    const total = subtotal - discount;
    return { subtotal, discount, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const requestData: CreateInvoiceRequest = {
        customerId: formData.customerId,
        type: formData.type,
        dueDate: formData.dueDate || undefined,
        paymentTerms: formData.paymentTerms || undefined,
        notes: formData.notes || undefined,
        discountAmount: Number(formData.discountAmount || 0),
        items: invoiceItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      const newInvoice = await invoicesService.create(requestData);
      onInvoiceAdded(newInvoice);
      onOpenChange(false);
      toast.success(
        requestData.type === InvoiceType.PROFORMA
          ? "Proforma invoice created successfully"
          : "Invoice created successfully",
      );
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to create invoice";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customerId: "",
      dueDate: "",
      paymentTerms: "Net 30",
      notes: "",
      discountAmount: 0,
      type: InvoiceType.STANDARD,
      items: [],
    });
    setInvoiceItems([]);
    setProductSearch("");
    setSearchResults([]);
    setErrors({});
  };

  const totals = calculateTotals();
  const isProforma = formData.type === InvoiceType.PROFORMA;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col w-[calc(100vw-2rem)] sm:w-full">
        <DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                Create New Invoice
              </DialogTitle>
              <DialogDescription className="text-sm mt-0.5">
                Generate a standard or proforma invoice for a customer
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-1">
            <div className="grid gap-6 py-6 px-1">
              {/* ── Section 1: Customer ── */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-blue-500 rounded-full" />
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    Customer
                  </h3>
                </div>

                <div className="space-y-1">
                  <Label className="text-sm font-semibold">
                    Select Customer <span className="text-destructive">*</span>
                  </Label>
                  <CustomerSearchCombobox
                    value={formData.customerId}
                    onValueChange={(val) => {
                      setFormData((prev) => ({ ...prev, customerId: val }));
                      setErrors((prev) => ({ ...prev, customerId: "" }));
                    }}
                  />
                  {errors.customerId && (
                    <p className="text-xs text-destructive mt-1">
                      {errors.customerId}
                    </p>
                  )}
                </div>
              </div>

              {/* ── Section 2: Invoice Details ── */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-purple-500 rounded-full" />
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    Invoice Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Invoice Type */}
                  <div className="space-y-1">
                    <Label htmlFor="type" className="text-sm font-semibold">
                      Invoice Type <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.type || InvoiceType.STANDARD}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          type: value as InvoiceType,
                        }))
                      }
                    >
                      <SelectTrigger
                        className={`h-11 ${errors.type ? "border-destructive" : ""}`}
                      >
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={InvoiceType.STANDARD}>
                          <span className="flex items-center gap-2">
                            <Receipt className="h-4 w-4" />
                            Standard Invoice (Payable)
                          </span>
                        </SelectItem>
                        <SelectItem value={InvoiceType.PROFORMA}>
                          <span className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Proforma Invoice (Not payable)
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.type && (
                      <p className="text-xs text-destructive">{errors.type}</p>
                    )}
                    {isProforma && (
                      <p className="text-xs text-muted-foreground">
                        Proforma invoices are informational only and cannot be
                        paid until converted to standard.
                      </p>
                    )}
                  </div>

                  {/* Due Date */}
                  <div className="space-y-1">
                    <Label htmlFor="dueDate" className="text-sm font-semibold">
                      Due Date
                    </Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          dueDate: e.target.value,
                        }))
                      }
                      className="h-11"
                    />
                  </div>

                  {/* Payment Terms */}
                  <div className="space-y-1 sm:col-span-2">
                    <Label
                      htmlFor="paymentTerms"
                      className="text-sm font-semibold"
                    >
                      Payment Terms
                    </Label>
                    <Input
                      id="paymentTerms"
                      value={formData.paymentTerms}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          paymentTerms: e.target.value,
                        }))
                      }
                      placeholder="e.g., Net 30, Due on Receipt"
                      className="h-11"
                    />
                  </div>
                </div>
              </div>

              {/* ── Section 3: Products ── */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-emerald-500 rounded-full" />
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    Products
                  </h3>
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="productSearch"
                    className="text-sm font-semibold"
                  >
                    Search &amp; Add Products
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="productSearch"
                      placeholder="Search products by name or SKU..."
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        searchProducts(e.target.value);
                      }}
                      className="pl-10 pr-10 h-11"
                    />
                    {searchLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  {searchResults.length > 0 && (
                    <Card className="mt-1 shadow-md">
                      <CardContent className="p-0">
                        <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                          {searchResults.map((product) => (
                            <div
                              key={product.id}
                              className="p-3 hover:bg-muted cursor-pointer transition-colors flex items-center justify-between gap-3"
                              onClick={() => addProductToInvoice(product)}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Plus className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="font-medium text-sm truncate">
                                    {product.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    SKU: {product.sku}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="font-semibold text-sm">
                                  {formatCurrency(Number(product.sellingPrice))}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Stock:{" "}
                                  {product.inventory?.reduce(
                                    (sum, inv) => sum + inv.quantityAvailable,
                                    0,
                                  ) || 0}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {/* ── Section 4: Invoice Items Table ── */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Invoice Items
                    {invoiceItems.length > 0 && (
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        ({invoiceItems.length})
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {invoiceItems.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">
                        No items added. Search and add products above.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto -mx-2 px-2">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[150px]">
                              Product
                            </TableHead>
                            <TableHead className="hidden md:table-cell">
                              SKU
                            </TableHead>
                            <TableHead className="text-right min-w-[90px]">
                              Unit Price
                            </TableHead>
                            <TableHead className="text-center min-w-[80px]">
                              Qty
                            </TableHead>
                            <TableHead className="text-right min-w-[90px]">
                              Total
                            </TableHead>
                            <TableHead className="w-[40px]" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoiceItems.map((item, index) => (
                            <TableRow key={item.productId}>
                              <TableCell>
                                <p className="font-medium text-sm leading-tight">
                                  {item.productName}
                                </p>
                                <p className="text-xs text-muted-foreground md:hidden">
                                  {item.productSku}
                                </p>
                              </TableCell>
                              <TableCell className="hidden md:table-cell font-mono text-sm text-muted-foreground">
                                {item.productSku}
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                {formatCurrency(item.unitPrice)}
                              </TableCell>
                              <TableCell className="text-center">
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    updateItemQuantity(
                                      index,
                                      parseInt(e.target.value) || 1,
                                    )
                                  }
                                  className="w-16 h-8 text-center mx-auto"
                                />
                              </TableCell>
                              <TableCell className="text-right font-semibold text-sm">
                                {formatCurrency(item.total)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeItem(index)}
                                  className="text-destructive hover:text-destructive h-8 w-8 p-0"
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
                  {errors.items && (
                    <p className="text-sm text-destructive mt-2">
                      {errors.items}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* ── Section 5: Pricing Summary ── */}
              {invoiceItems.length > 0 && (
                <Card className="bg-slate-50 dark:bg-slate-900/50">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Discount input */}
                      <div className="space-y-1">
                        <Label
                          htmlFor="discountAmount"
                          className="text-sm font-semibold"
                        >
                          Discount Amount
                        </Label>
                        <Input
                          id="discountAmount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.discountAmount}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              discountAmount: parseFloat(e.target.value) || 0,
                            }))
                          }
                          className={`h-11 ${errors.discountAmount ? "border-destructive" : ""}`}
                        />
                        {errors.discountAmount && (
                          <p className="text-xs text-destructive">
                            {errors.discountAmount}
                          </p>
                        )}
                      </div>

                      {/* Totals */}
                      <div className="space-y-1.5 text-sm self-end">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Subtotal
                          </span>
                          <span>{formatCurrency(totals.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Discount
                          </span>
                          <span className="text-destructive">
                            -{formatCurrency(totals.discount)}
                          </span>
                        </div>
                        <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                          <span>Total</span>
                          <span>{formatCurrency(totals.total)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ── Section 6: Notes ── */}
              <div className="space-y-1">
                <Label htmlFor="notes" className="text-sm font-semibold">
                  Notes{" "}
                  <span className="text-muted-foreground font-normal">
                    (Optional)
                  </span>
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Additional notes or payment instructions..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-2 flex flex-col sm:flex-row gap-2 px-1 flex-shrink-0">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading
                ? "Creating..."
                : isProforma
                  ? "Create Proforma Invoice"
                  : "Create Invoice"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="h-10 px-6 font-medium sm:flex-initial"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddInvoiceDialog;
