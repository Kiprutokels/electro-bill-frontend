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
import { Loader2, Search, Trash2, Edit } from "lucide-react";
import {
  quotationsService,
  Quotation,
  UpdateQuotationRequest,
  ProductSearchResult,
} from "@/api/services/quotations.service";
import { formatCurrency } from "@/utils/format.utils";
import { toast } from "sonner";

interface QuotationItem {
  productId: string;
  productName: string;
  productSku: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

interface EditQuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: Quotation | null;
  onQuotationUpdated: (quotation: Quotation) => void;
}

const EditQuotationDialog: React.FC<EditQuotationDialogProps> = ({
  open,
  onOpenChange,
  quotation,
  onQuotationUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [fetchingQuotation, setFetchingQuotation] = useState(false);
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [fullQuotation, setFullQuotation] = useState<Quotation | null>(null);

  const [formData, setFormData] = useState<UpdateQuotationRequest>({
    validUntil: "",
    notes: "",
    discountAmount: 0,
    items: [],
  });

  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch full quotation details when dialog opens
  useEffect(() => {
    const fetchQuotationDetails = async () => {
      if (quotation && open && quotation.id) {
        setFetchingQuotation(true);
        try {
          const fullDetails = await quotationsService.getById(quotation.id);
          setFullQuotation(fullDetails);
        } catch (error) {
          console.error("Failed to fetch quotation details:", error);
          toast.error("Failed to load quotation details");
          setFullQuotation(quotation);
        } finally {
          setFetchingQuotation(false);
        }
      }
    };

    if (open) {
      fetchQuotationDetails();
    } else {
      // Reset state when dialog closes
      setFullQuotation(null);
      setQuotationItems([]);
      setProductSearch("");
      setSearchResults([]);
      setErrors({});
    }
  }, [quotation, open]);

  // Process quotation data 
  useEffect(() => {
    const quotationToProcess = fullQuotation || quotation;

    if (quotationToProcess && open) {
      // Format date for input field
      const validUntilDate = quotationToProcess.validUntil
        ? new Date(quotationToProcess.validUntil).toISOString().split("T")[0]
        : "";

      setFormData({
        validUntil: validUntilDate,
        notes: quotationToProcess.notes || "",
        discountAmount: Number(quotationToProcess.discountAmount) || 0,
      });

      const items: QuotationItem[] = [];

      if (
        Array.isArray(quotationToProcess.items) &&
        quotationToProcess.items.length > 0
      ) {
        quotationToProcess.items.forEach((item) => {
          const quantity = Number(item.quantity) || 0;
          const unitPrice = Number(item.unitPrice) || 0;

          const processedItem: QuotationItem = {
            productId: item.productId,
            productName:
              item.product?.name || item.description || "Unknown Product",
            productSku: item.product?.sku || "N/A",
            unitPrice: unitPrice,
            quantity: quantity,
            total: quantity * unitPrice,
          };

          items.push(processedItem);
        });
      }

      setQuotationItems(items);
      setErrors({});
    }
  }, [fullQuotation, quotation, open]);

  const searchProducts = async (search: string) => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const results = await quotationsService.searchProducts(search);
      setSearchResults(results || []);
    } catch (error) {
      console.error("Failed to search products:", error);
      setSearchResults([]);
      toast.error("Failed to search products");
    } finally {
      setSearchLoading(false);
    }
  };

  const addProductToQuotation = (product: ProductSearchResult) => {
    const existingItemIndex = quotationItems.findIndex(
      (item) => item.productId === product.id
    );

    if (existingItemIndex >= 0) {
      const updatedItems = [...quotationItems];
      updatedItems[existingItemIndex].quantity += 1;
      updatedItems[existingItemIndex].total =
        updatedItems[existingItemIndex].quantity *
        updatedItems[existingItemIndex].unitPrice;
      setQuotationItems(updatedItems);
    } else {
      const unitPrice = Number(product.sellingPrice) || 0;
      const newItem: QuotationItem = {
        productId: product.id,
        productName: product.name || "Unknown Product",
        productSku: product.sku || "N/A",
        unitPrice: unitPrice,
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

    if (quotationItems.length === 0) {
      newErrors.items = "At least one item is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotals = () => {
    const subtotal = quotationItems.reduce(
      (sum, item) => sum + (item.total || 0),
      0
    );
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

    if (!validateForm() || !quotation) {
      return;
    }

    setLoading(true);
    try {
      const requestData: UpdateQuotationRequest = {
        validUntil: formData.validUntil || undefined,
        notes: formData.notes || undefined,
        discountAmount: formData.discountAmount,
        items: quotationItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      const updatedQuotation = await quotationsService.update(
        quotation.id,
        requestData
      );
      onQuotationUpdated(updatedQuotation);
      onOpenChange(false);
      toast.success("Quotation updated successfully");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to update quotation";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  if (!quotation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Quotation - {quotation.quotationNumber}
          </DialogTitle>
          <DialogDescription>
            Modify quotation details and items. Changes will recalculate totals
            automatically.
          </DialogDescription>
        </DialogHeader>

        {fetchingQuotation ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Loading quotation details...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Info (Read-only) */}
              <div>
                <Label>Customer</Label>
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium">
                    {quotation.customer?.businessName ||
                      quotation.customer?.contactPerson ||
                      "N/A"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {quotation.customer?.email || "N/A"}
                  </p>
                </div>
              </div>

              {/* Valid Until Date */}
              <div>
                <Label htmlFor="validUntil">Valid Until</Label>
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
                />
              </div>
            </div>

            {/* Product Search */}
            <div>
              <Label htmlFor="productSearch">Add More Products</Label>
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
                          className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0 transition-colors"
                          onClick={() => addProductToQuotation(product)}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">
                                SKU: {product.sku}
                              </p>
                              {product.category?.name && (
                                <p className="text-xs text-muted-foreground">
                                  {product.category.name}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                {formatCurrency(
                                  Number(product.sellingPrice) || 0
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Stock:{" "}
                                {product.inventory?.reduce(
                                  (sum, inv) => sum + inv.quantityAvailable,
                                  0
                                ) || 0}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Quotation Items */}
            <Card>
              <CardHeader>
                <CardTitle>Quotation Items ({quotationItems.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {quotationItems.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-2">
                      No items in this quotation yet.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Use the search above to add products to this quotation.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[200px]">
                            Product
                          </TableHead>
                          <TableHead className="hidden md:table-cell">
                            SKU
                          </TableHead>
                          <TableHead className="text-right min-w-[100px]">
                            Unit Price
                          </TableHead>
                          <TableHead className="text-center min-w-[80px]">
                            Quantity
                          </TableHead>
                          <TableHead className="text-right min-w-[100px]">
                            Total
                          </TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {quotationItems.map((item, index) => (
                          <TableRow key={`${item.productId}-${index}`}>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {item.productName}
                                </p>
                                <p className="text-sm text-muted-foreground md:hidden">
                                  SKU: {item.productSku}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell font-mono text-sm">
                              {item.productSku}
                            </TableCell>
                            <TableCell className="text-right">
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
                                    parseInt(e.target.value) || 1
                                  )
                                }
                                className="w-16 text-center"
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
                {errors.items && (
                  <p className="text-sm text-destructive mt-2">
                    {errors.items}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Pricing Summary */}
            {quotationItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Pricing Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="discountAmount">Discount Amount</Label>
                      <Input
                        id="discountAmount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.discountAmount || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            discountAmount: parseFloat(e.target.value) || 0,
                          }))
                        }
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
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Additional notes (optional)"
                rows={3}
              />
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button
                type="submit"
                disabled={loading || fetchingQuotation}
                className="flex-1"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Updating Quotation..." : "Update Quotation"}
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

export default EditQuotationDialog;
