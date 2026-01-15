import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  Package,
  Tag,
  Folder,
  Edit,
  Power,
  Calendar,
  Hash,
  DollarSign,
} from "lucide-react";
import { Product } from "@/api/services/products.service";
import { formatCurrency, formatDate } from "@/utils/format.utils";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS } from "@/utils/constants";

interface ProductViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onEdit: () => void;
  onToggleStatus: () => void;
}

const ProductViewDialog: React.FC<ProductViewDialogProps> = ({
  open,
  onOpenChange,
  product,
  onEdit,
  onToggleStatus,
}) => {
  const { hasPermission } = useAuth();

  if (!product) return null;

  const getStatusBadge = () => {
    if (!product.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }

    const totalQuantity = product.totalQuantity || 0;
    const reorderLevel = product.reorderLevel;

    if (totalQuantity === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (totalQuantity <= reorderLevel && reorderLevel > 0) {
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-600">Low Stock</Badge>
      );
    } else {
      return (
        <Badge className="bg-green-500 hover:bg-green-600">In Stock</Badge>
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Product Details
            </DialogTitle>
            {getStatusBadge()}
          </div>
        </DialogHeader>

        <div className="space-y-4 md:space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Product Name</p>
                  <p className="font-semibold text-lg">{product.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">SKU</p>
                  <p className="font-mono bg-muted px-2 py-1 rounded text-sm">
                    {product.sku}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Unit of Measure
                  </p>
                  <p>{product.unitOfMeasure}</p>
                </div>
                {product.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-sm">{product.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Stock Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Available Stock
                  </p>
                  <p className="text-2xl font-bold">
                    {product.totalQuantity || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Reserved Stock
                  </p>
                  <p className="text-lg">{product.totalReserved || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total in Stock
                  </p>
                  <p className="text-lg font-medium">
                    {product.totalInStock || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reorder Level</p>
                  <p className="text-lg">{product.reorderLevel}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category and Brand */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Folder className="h-5 w-5" />
                  Category & Brand
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    {product.category.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Brand</p>
                  <p className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    {product.brand?.name || "No Brand"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Selling Price</p>
                  <p className="font-semibold text-lg">
                    {formatCurrency(product.sellingPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Subscription Fee
                  </p>
                  <p className="font-medium">
                    {formatCurrency(product.subscriptionFee)}
                  </p>
                </div>
                {product.wholesalePrice && product.wholesalePrice > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Wholesale Price
                    </p>
                    <p className="font-medium">
                      {formatCurrency(product.wholesalePrice)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Stock Value
                  </p>
                  <p className="font-semibold text-green-600">
                    {formatCurrency(
                      product.sellingPrice * (product.totalQuantity || 0)
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Physical Properties */}
          {(product.weight ||
            product.dimensions ||
            product.warrantyPeriodMonths > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Physical Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {product.weight && product.weight > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Weight</p>
                      <p>{product.weight} KG</p>
                    </div>
                  )}
                  {product.dimensions && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Dimensions
                      </p>
                      <p>{product.dimensions}</p>
                    </div>
                  )}
                  {product.warrantyPeriodMonths > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Warranty Period
                      </p>
                      <p>{product.warrantyPeriodMonths} months</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Inventory Locations */}
          {product.inventory && product.inventory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Inventory Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {product.inventory.map((inventory, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{inventory.location}</p>
                        <p className="text-sm text-muted-foreground">
                          Storage location
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Available
                            </p>
                            <p className="font-medium">
                              {inventory.quantityAvailable}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Reserved
                            </p>
                            <p className="font-medium">
                              {inventory.quantityReserved}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Batches</p>
                  <p className="font-medium">{product._count?.batches || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Inventory Records
                  </p>
                  <p className="font-medium">
                    {product._count?.inventory || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Invoice Items</p>
                  <p className="font-medium">
                    {product._count?.invoiceItems || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Quotation Items
                  </p>
                  <p className="font-medium">
                    {product._count?.quotationItems || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p>{formatDate(product.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p>{formatDate(product.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            {hasPermission(PERMISSIONS.PRODUCTS_UPDATE) && (
              <>
                <Button variant="outline" onClick={onToggleStatus}>
                  <Power className="mr-2 h-4 w-4" />
                  {product.isActive ? "Deactivate" : "Activate"}
                </Button>
                <Button onClick={onEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Product
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductViewDialog;
