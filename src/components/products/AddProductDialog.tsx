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

// UI form state (allows empty strings for better UX)
interface FormState {
  sku: string;
  name: string;
  description: string;
  categoryId: string;
  brandId: string;
  unitOfMeasure: string;
  sellingPrice: string;
  wholesalePrice: string;
  subscriptionFee: string;
  weight: string;
  dimensions: string;
  warrantyPeriodMonths: string;
  reorderLevel: string;
  isActive: boolean;
}

const AddProductDialog: React.FC<AddProductDialogProps> = ({
  open,
  onOpenChange,
  onProductAdded,
  categories,
  brands,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormState>({
    sku: "",
    name: "",
    description: "",
    categoryId: "",
    brandId: "",
    unitOfMeasure: "PCS",
    sellingPrice: "",
    wholesalePrice: "",
    subscriptionFee: "",
    weight: "",
    dimensions: "",
    warrantyPeriodMonths: "",
    reorderLevel: "",
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const getNumericValues = () => ({
    sellingPrice: formData.sellingPrice === "" ? 0 : Number(formData.sellingPrice),
    wholesalePrice: formData.wholesalePrice === "" ? 0 : Number(formData.wholesalePrice),
    subscriptionFee: formData.subscriptionFee === "" ? 0 : Number(formData.subscriptionFee),
    weight: formData.weight === "" ? 0 : Number(formData.weight),
    warrantyPeriodMonths: formData.warrantyPeriodMonths === "" ? 0 : Number(formData.warrantyPeriodMonths),
    reorderLevel: formData.reorderLevel === "" ? 0 : Number(formData.reorderLevel),
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const skuError = validateRequired(formData.sku, "SKU");
    if (skuError) newErrors.sku = skuError;

    const nameError = validateRequired(formData.name, "Product name");
    if (nameError) newErrors.name = nameError;

    const categoryError = validateRequired(formData.categoryId, "Category");
    if (categoryError) newErrors.categoryId = categoryError;

    const { sellingPrice, subscriptionFee } = getNumericValues();

    if (sellingPrice <= 0) {
      newErrors.sellingPrice = "Selling price must be greater than 0";
    }

    if (subscriptionFee < 0) {
      newErrors.subscriptionFee = "Subscription fee cannot be negative";
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
      const {
        sellingPrice,
        wholesalePrice,
        subscriptionFee,
        weight,
        warrantyPeriodMonths,
        reorderLevel,
      } = getNumericValues();

      const requestData: CreateProductRequest = {
        sku: formData.sku,
        name: formData.name,
        description: formData.description || undefined,
        categoryId: formData.categoryId,
        brandId: formData.brandId || undefined,
        unitOfMeasure: formData.unitOfMeasure,
        sellingPrice,
        wholesalePrice: wholesalePrice || undefined,
        subscriptionFee,
        weight: weight || undefined,
        dimensions: formData.dimensions || undefined,
        warrantyPeriodMonths,
        reorderLevel,
        isActive: formData.isActive,
      };

      const newProduct = await productsService.create(requestData);
      onProductAdded(newProduct);
      onOpenChange(false);
      resetForm();
      toast.success("Product created successfully");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to create product";
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
      sellingPrice: "",
      wholesalePrice: "",
      subscriptionFee: "",
      weight: "",
      dimensions: "",
      warrantyPeriodMonths: "",
      reorderLevel: "",
      isActive: true,
    });
    setErrors({});
  };

  const handleInputChange = (field: keyof FormState, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
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
            <div className="space-y-2">
              <Label htmlFor="sku">
                SKU <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) =>
                  handleInputChange("sku", e.target.value)
                }
                placeholder="e.g., SKU-TP-WR841N"
                className={errors.sku ? "border-destructive" : ""}
              />
              {errors.sku && (
                <p className="text-sm text-destructive">{errors.sku}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Product Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  handleInputChange("name", e.target.value)
                }
                placeholder="Product name"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                handleInputChange("description", e.target.value)
              }
              placeholder="Product description (optional)"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoryId">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) =>
                  handleInputChange("categoryId", value)
                }
              >
                <SelectTrigger
                  className={errors.categoryId ? "border-destructive" : ""}
                >
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

            <div className="space-y-2">
              <Label htmlFor="brandId">Brand</Label>
              <Select
                value={formData.brandId}
                onValueChange={(value) =>
                  handleInputChange(
                    "brandId",
                    value === "no-brand" ? "" : value
                  )
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
            <div className="space-y-2">
              <Label htmlFor="sellingPrice">
                Selling Price <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sellingPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.sellingPrice}
                onChange={(e) =>
                  handleInputChange("sellingPrice", e.target.value)
                }
                placeholder="0.00"
                className={errors.sellingPrice ? "border-destructive" : ""}
              />
              {errors.sellingPrice && (
                <p className="text-sm text-destructive">{errors.sellingPrice}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscriptionFee">Subscription Fee</Label>
              <Input
                id="subscriptionFee"
                type="number"
                min="0"
                step="0.01"
                value={formData.subscriptionFee}
                onChange={(e) =>
                  handleInputChange("subscriptionFee", e.target.value)
                }
                placeholder="0.00"
                className={errors.subscriptionFee ? "border-destructive" : ""}
              />
              {errors.subscriptionFee && (
                <p className="text-sm text-destructive">{errors.subscriptionFee}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="wholesalePrice">Wholesale Price</Label>
              <Input
                id="wholesalePrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.wholesalePrice}
                onChange={(e) =>
                  handleInputChange("wholesalePrice", e.target.value)
                }
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unitOfMeasure">Unit of Measure</Label>
              <Input
                id="unitOfMeasure"
                value={formData.unitOfMeasure}
                onChange={(e) =>
                  handleInputChange("unitOfMeasure", e.target.value)
                }
                placeholder="PCS"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight (KG)</Label>
              <Input
                id="weight"
                type="number"
                min="0"
                step="0.001"
                value={formData.weight}
                onChange={(e) =>
                  handleInputChange("weight", e.target.value)
                }
                placeholder="0.000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warrantyPeriodMonths">Warranty (Months)</Label>
              <Input
                id="warrantyPeriodMonths"
                type="number"
                min="0"
                value={formData.warrantyPeriodMonths}
                onChange={(e) =>
                  handleInputChange("warrantyPeriodMonths", e.target.value)
                }
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reorderLevel">Reorder Level</Label>
            <Input
              id="reorderLevel"
              type="number"
              min="0"
              value={formData.reorderLevel}
              onChange={(e) =>
                handleInputChange("reorderLevel", e.target.value)
              }
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dimensions">Dimensions</Label>
            <Input
              id="dimensions"
              value={formData.dimensions}
              onChange={(e) =>
                handleInputChange("dimensions", e.target.value)
              }
              placeholder="e.g., 20cm x 15cm x 5cm"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                handleInputChange("isActive", checked)
              }
            />
            <Label htmlFor="isActive">Active Product</Label>
          </div>

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