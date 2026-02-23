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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Loader2, Search, Trash2, Plus } from "lucide-react";
import {
  quotationsService,
  Quotation,
  CreateQuotationRequest,
  ProductSearchResult,
} from "@/api/services/quotations.service";
import { validateRequired } from "@/utils/validation.utils";
import { formatCurrency } from "@/utils/format.utils";
import { toast } from "sonner";
import CustomerSearchCombobox from "@/components/jobs/CustomerSearchCombobox";

interface QuotationItem {
  productId: string;
  productName: string;
  productSku: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

interface AddQuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQuotationAdded: (quotation: Quotation) => void;
}

const AddQuotationDialog: React.FC<AddQuotationDialogProps> = ({
  open,
  onOpenChange,
  onQuotationAdded,
}) => {
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  const [formData, setFormData] = useState<CreateQuotationRequest>({
    customerId: "",
    validUntil: "",
    notes: "",
    discountAmount: 0,
    items: [],
  });

  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([]);
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
      const results = await quotationsService.searchProducts(search);
      setSearchResults(results);
    } catch (error) {
      console.error("Failed to search products:", error);
      toast.error("Failed to search products");
    } finally {
      setSearchLoading(false);
    }
  };

  const addProductToQuotation = (product: ProductSearchResult) => {
    const existingItemIndex = quotationItems.findIndex(
      (item) => item.productId === product.id,
    );

    if (existingItemIndex >= 0) {
      const updatedItems = [...quotationItems];
      updatedItems[existingItemIndex].quantity += 1;
      updatedItems[existingItemIndex].total =
        updatedItems[existingItemIndex].quantity *
        updatedItems[existingItemIndex].unitPrice;
      setQuotationItems(updatedItems);
    } else {
      const unitPrice = Number(product.sellingPrice);
      const newItem: QuotationItem = {
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        unitPrice,
        quantity: 1,
        total: unitPrice,
      };
      setQuotationItems((prev) => [...prev, newItem]);
    }

    setProductSearch("");
    setSearchResults([]);
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) return;
    const updatedItems = [...quotationItems];
    updatedItems[index].quantity = quantity;
    updatedItems[index].total = quantity * updatedItems[index].unitPrice;
    setQuotationItems(updatedItems);
  };

  const removeItem = (index: number) => {
    setQuotationItems((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const customerError = validateRequired(formData.customerId, "Customer");
    if (customerError) newErrors.customerId = customerError;
    if (quotationItems.length === 0) {
      newErrors.items = "At least one item is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotals = () => {
    const subtotal = quotationItems.reduce((sum, item) => sum + item.total, 0);
    const discount = formData.discountAmount || 0;
    const total = subtotal - discount;
    return { subtotal, discount, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const requestData: CreateQuotationRequest = {
        customerId: formData.customerId,
        validUntil: formData.validUntil || undefined,
        notes: formData.notes || undefined,
        discountAmount: formData.discountAmount || 0,
        items: quotationItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      const newQuotation = await quotationsService.create(requestData);
      onQuotationAdded(newQuotation);
      onOpenChange(false);
      toast.success("Quotation created successfully");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to create quotation";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customerId: "",
      validUntil: "",
      notes: "",
      discountAmount: 0,
      items: [],
    });
    setQuotationItems([]);
    setProductSearch("");
    setSearchResults([]);
    setErrors({});
  };

  const totals = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col w-[calc(100vw-2rem)] sm:w-full">
        <DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                Create New Quotation
              </DialogTitle>
              <DialogDescription className="text-sm mt-0.5">
                Build a quotation for a customer with product line items
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
                  <div className="w-1 h-5 bg-emerald-500 rounded-full" />
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

              {/* ── Section 2: Quotation Meta ── */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-blue-500 rounded-full" />
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    Quotation Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label
                      htmlFor="validUntil"
                      className="text-sm font-semibold"
                    >
                      Valid Until
                    </Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          validUntil: e.target.value,
                        }))
                      }
                      className="h-11"
                    />
                  </div>
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
                      className="h-11"
                    />
                  </div>
                </div>
              </div>

              {/* ── Section 3: Add Products ── */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-purple-500 rounded-full" />
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
                              onClick={() => addProductToQuotation(product)}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Plus className="h-4 w-4 text-emerald-500 flex-shrink-0" />
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

              {/* ── Section 4: Quotation Items Table ── */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Quotation Items
                    {quotationItems.length > 0 && (
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        ({quotationItems.length})
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {quotationItems.length === 0 ? (
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
                          {quotationItems.map((item, index) => (
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

              {/* ── Section 5: Totals Summary ── */}
              {quotationItems.length > 0 && (
                <Card className="bg-slate-50 dark:bg-slate-900/50">
                  <CardContent className="pt-4">
                    <div className="flex flex-col sm:flex-row sm:justify-end gap-1 text-sm">
                      <div className="sm:w-64 space-y-1.5">
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
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Additional notes or terms..."
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
              className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Creating Quotation..." : "Create Quotation"}
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

export default AddQuotationDialog;
