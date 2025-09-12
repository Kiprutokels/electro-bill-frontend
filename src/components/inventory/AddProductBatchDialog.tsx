import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Loader2, Search } from "lucide-react";
import {
  ProductBatch,
  CreateProductBatchRequest,
  productBatchesService,
} from "@/api/services/productBatches.service";
import { productsService, Product } from "@/api/services/products.service";
import { validateRequired } from "@/utils/validation.utils";
import { formatCurrency } from "@/utils/format.utils";
import { toast } from "sonner";

interface AddProductBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBatchAdded: (batch: ProductBatch) => void;
}

const AddProductBatchDialog: React.FC<AddProductBatchDialogProps> = ({
  open,
  onOpenChange,
  onBatchAdded,
}) => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  const [formData, setFormData] = useState<CreateProductBatchRequest>({
    productId: "",
    supplierBatchRef: "",
    buyingPrice: 0,
    quantityReceived: 0,
    expiryDate: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (open) {
      fetchProducts();
      resetForm();
    }
  }, [open]);

  const fetchProducts = async () => {
    try {
      const response = await productsService.getProducts();
      const productsData = Array.isArray(response) ? response : response.data;
      setProducts(productsData.filter((p: Product) => p.isActive));
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Failed to fetch products");
    }
  };

  const searchProducts = async (search: string) => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await productsService.getProducts(1, 10, search);
      const productsData = Array.isArray(response) ? response : response.data;
      setSearchResults(productsData.filter((p: Product) => p.isActive));
    } catch (error) {
      console.error("Failed to search products:", error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const selectProduct = (product: Product) => {
    setSelectedProduct(product);
    setFormData((prev) => ({ ...prev, productId: product.id }));
    setProductSearch("");
    setSearchResults([]);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const productError = validateRequired(formData.productId, "Product");
    if (productError) newErrors.productId = productError;

    if (formData.buyingPrice <= 0) {
      newErrors.buyingPrice = "Buying price must be greater than 0";
    }

    if (formData.quantityReceived <= 0) {
      newErrors.quantityReceived = "Quantity received must be greater than 0";
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
      const requestData: CreateProductBatchRequest = {
        ...formData,
        supplierBatchRef: formData.supplierBatchRef || undefined,
        expiryDate: formData.expiryDate || undefined,
        notes: formData.notes || undefined,
      };

      const newBatch = await productBatchesService.create(requestData);
      onBatchAdded(newBatch);
      onOpenChange(false);
      toast.success("Product batch created successfully");
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to create batch";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      productId: "",
      supplierBatchRef: "",
      buyingPrice: 0,
      quantityReceived: 0,
      expiryDate: "",
      notes: "",
    });
    setSelectedProduct(null);
    setProductSearch("");
    setSearchResults([]);
    setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Add New Product Batch
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          {/* Product Selection */}
          <div className="space-y-2">
            <Label htmlFor="productSearch">
              Product <span className="text-destructive">*</span>
            </Label>
            
            {selectedProduct ? (
              <Card>
                <CardContent className="p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{selectedProduct.name}</p>
                      <p className="text-sm text-muted-foreground">
                        SKU: {selectedProduct.sku} • 
                        Selling Price: {formatCurrency(Number(selectedProduct.sellingPrice))}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedProduct(null);
                        setFormData(prev => ({ ...prev, productId: "" }));
                      }}
                    >
                      Change
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
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
                    className={`pl-10 ${errors.productId ? "border-destructive" : ""}`}
                  />
                  {searchLoading && (
                    <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <Card>
                    <CardContent className="p-0">
                      <div className="max-h-40 overflow-y-auto">
                        {searchResults.map((product) => (
                          <div
                            key={product.id}
                            className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0 transition-colors"
                            onClick={() => selectProduct(product)}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  SKU: {product.sku}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">
                                  {formatCurrency(Number(product.sellingPrice))}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
            {errors.productId && (
              <p className="text-sm text-destructive">{errors.productId}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Supplier Batch Reference */}
            <div className="space-y-2">
              <Label htmlFor="supplierBatchRef">Supplier Batch Reference</Label>
              <Input
                id="supplierBatchRef"
                value={formData.supplierBatchRef}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, supplierBatchRef: e.target.value }))
                }
                placeholder="Enter supplier reference"
              />
            </div>

            {/* Buying Price */}
            <div className="space-y-2">
              <Label htmlFor="buyingPrice">
                Buying Price per Unit <span className="text-destructive">*</span>
              </Label>
              <Input
                id="buyingPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.buyingPrice || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    buyingPrice: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="0.00"
                className={errors.buyingPrice ? "border-destructive" : ""}
              />
              {errors.buyingPrice && (
                <p className="text-sm text-destructive">{errors.buyingPrice}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quantity Received */}
            <div className="space-y-2">
              <Label htmlFor="quantityReceived">
                Quantity Received <span className="text-destructive">*</span>
              </Label>
              <Input
                id="quantityReceived"
                type="number"
                min="1"
                step="1"
                value={formData.quantityReceived || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    quantityReceived: parseInt(e.target.value) || 0,
                  }))
                }
                placeholder="0"
                className={errors.quantityReceived ? "border-destructive" : ""}
              />
              {errors.quantityReceived && (
                <p className="text-sm text-destructive">{errors.quantityReceived}</p>
              )}
            </div>

            {/* Expiry Date */}
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, expiryDate: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Total Cost Calculation */}
          {formData.buyingPrice > 0 && formData.quantityReceived > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cost Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Unit Cost</p>
                    <p className="font-medium">{formatCurrency(formData.buyingPrice)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Quantity</p>
                    <p className="font-medium">{formData.quantityReceived} units</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Cost</p>
                    <p className="font-semibold text-lg">
                      {formatCurrency(formData.buyingPrice * formData.quantityReceived)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about this batch (optional)"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Creating Batch..." : "Create Batch"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-initial"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductBatchDialog;