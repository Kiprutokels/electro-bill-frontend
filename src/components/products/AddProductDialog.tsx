import React, { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Plus, Loader2 } from "lucide-react";
import {
  Product,
  CreateProductRequest,
  productsService,
} from "@/api/services/products.service";
import { ProductCategory } from "@/api/services/categories.service";
import { Brand } from "@/api/services/brands.service";
import { validateRequired } from "@/utils/validation.utils";
import { toast } from "sonner";

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductAdded: (product: Product) => void;
  categories: ProductCategory[];
  brands: Brand[];
}

const AddProductDialog: React.FC<AddProductDialogProps> = ({
  open,
  onOpenChange,
  onProductAdded,
  categories,
  brands,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateProductRequest>({
    sku: "",
    name: "",
    description: "",
    categoryId: "",
    brandId: "",
    unitOfMeasure: "PCS",
    sellingPrice: 0,
    wholesalePrice: 0,
    weight: 0,
    dimensions: "",
    warrantyPeriodMonths: 0,
    reorderLevel: 0,
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const skuError = validateRequired(formData.sku, "SKU");
    if (skuError) newErrors.sku = skuError;

    const nameError = validateRequired(formData.name, "Product name");
    if (nameError) newErrors.name = nameError;

    const categoryError = validateRequired(formData.categoryId, "Category");
    if (categoryError) newErrors.categoryId = categoryError;

    if (formData.sellingPrice <= 0) {
      newErrors.sellingPrice = "Selling price must be greater than 0";
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
      const requestData: CreateProductRequest = {
        ...formData,
        description: formData.description || undefined,
        brandId: formData.brandId || undefined,
        wholesalePrice: formData.wholesalePrice || undefined,
        weight: formData.weight || undefined,
        dimensions: formData.dimensions || undefined,
      };

      const newProduct = await productsService.create(requestData);
      onProductAdded(newProduct);
      onOpenChange(false);
      resetForm();
      toast.success("Product created successfully");
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to create product";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      sku: "",
      name: "",
      description: "",
      categoryId: "",
      brandId: "",
      unitOfMeasure: "PCS",
      sellingPrice: 0,
      wholesalePrice: 0,
      weight: 0,
      dimensions: "",
      warrantyPeriodMonths: 0,
      reorderLevel: 0,
      isActive: true,
    });
    setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Product
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SKU */}
            <div className="space-y-2">
              <Label htmlFor="sku">
                SKU <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, sku: e.target.value }))
                }
                placeholder="e.g., SKU-TP-WR841N"
                className={errors.sku ? "border-destructive" : ""}
              />
              {errors.sku && <p className="text-sm text-destructive">{errors.sku}</p>}
            </div>

            {/* Product Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Product Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Product name"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Product description (optional)"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="categoryId">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, categoryId: value }))
                }
              >
                <SelectTrigger className={errors.categoryId ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter((c) => c.isActive)
                    .map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-sm text-destructive">{errors.categoryId}</p>
              )}
            </div>

            {/* Brand */}
            <div className="space-y-2">
              <Label htmlFor="brandId">Brand</Label>
              <Select
                value={formData.brandId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, brandId: value === "no-brand" ? "" : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select brand (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-brand">No Brand</SelectItem>
                  {brands
                    .filter((b) => b.isActive)
                    .map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Unit of Measure */}
            <div className="space-y-2">
              <Label htmlFor="unitOfMeasure">Unit of Measure</Label>
              <Input
                id="unitOfMeasure"
                value={formData.unitOfMeasure}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, unitOfMeasure: e.target.value }))
                }
                placeholder="PCS"
              />
            </div>

            {/* Selling Price */}
            <div className="space-y-2">
              <Label htmlFor="sellingPrice">
                Selling Price <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sellingPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.sellingPrice || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    sellingPrice: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="0.00"
                className={errors.sellingPrice ? "border-destructive" : ""}
              />
              {errors.sellingPrice && (
                <p className="text-sm text-destructive">{errors.sellingPrice}</p>
              )}
            </div>

            {/* Wholesale Price */}
            <div className="space-y-2">
              <Label htmlFor="wholesalePrice">Wholesale Price</Label>
              <Input
                id="wholesalePrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.wholesalePrice || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    wholesalePrice: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Weight */}
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (KG)</Label>
              <Input
                id="weight"
                type="number"
                min="0"
                step="0.001"
                value={formData.weight || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    weight: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="0.000"
              />
            </div>

            {/* Warranty Period */}
            <div className="space-y-2">
              <Label htmlFor="warrantyPeriodMonths">Warranty (Months)</Label>
              <Input
                id="warrantyPeriodMonths"
                type="number"
                min="0"
                value={formData.warrantyPeriodMonths || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    warrantyPeriodMonths: parseInt(e.target.value) || 0,
                  }))
                }
                placeholder="0"
              />
            </div>

            {/* Reorder Level */}
            <div className="space-y-2">
              <Label htmlFor="reorderLevel">Reorder Level</Label>
              <Input
                id="reorderLevel"
                type="number"
                min="0"
                value={formData.reorderLevel || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    reorderLevel: parseInt(e.target.value) || 0,
                  }))
                }
                placeholder="0"
              />
            </div>
          </div>

          {/* Dimensions */}
          <div className="space-y-2">
            <Label htmlFor="dimensions">Dimensions</Label>
            <Input
              id="dimensions"
              value={formData.dimensions}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, dimensions: e.target.value }))
              }
              placeholder="e.g., 20cm x 15cm x 5cm"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, isActive: checked }))
              }
            />
            <Label htmlFor="isActive">Active Product</Label>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Creating Product..." : "Create Product"}
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

export default AddProductDialog;