import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Eye, 
  Package, 
  Tag, 
  DollarSign, 
  Warehouse, 
  AlertTriangle, 
  Calendar, 
  Edit,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Product } from '@/api/services/products.service';
import { formatCurrency } from '@/utils/currency.utils';
import { formatDate } from '@/utils/format.utils';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/utils/constants';

interface ProductViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  onEdit: () => void;
  onToggleStatus: (product: Product) => void;
}

const ProductViewDialog: React.FC<ProductViewDialogProps> = ({
  open,
  onOpenChange,
  product,
  onEdit,
  onToggleStatus,
}) => {
  const { hasPermission } = useAuth();

  const getStockStatus = () => {
    const totalQuantity = product.totalQuantity || 0;
    if (totalQuantity === 0) {
      return { label: 'Out of Stock', variant: 'destructive' as const, color: 'text-red-600' };
    } else if (totalQuantity <= product.reorderLevel) {
      return { label: 'Low Stock', variant: 'secondary' as const, color: 'text-yellow-600' };
    }
    return { label: 'In Stock', variant: 'default' as const, color: 'text-green-600' };
  };

  const stockStatus = getStockStatus();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Product Details
            </DialogTitle>
            <Badge variant={product.isActive ? 'default' : 'secondary'}>
              {product.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {product.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">SKU:</span>
                  <p className="font-medium font-mono">{product.sku}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Category:</span>
                  <p className="font-medium flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {product.category.name}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Brand:</span>
                  <p className="font-medium">{product.brand?.name || 'No Brand'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Unit of Measure:</span>
                  <p className="font-medium">{product.unitOfMeasure}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {product.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{product.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Pricing Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <DollarSign className="h-5 w-5" />
                  Selling Price
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(product.sellingPrice)}
                </p>
              </CardContent>
            </Card>

            {product.wholesalePrice && (
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <DollarSign className="h-5 w-5" />
                    Wholesale Price
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(product.wholesalePrice)}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Inventory Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-gray-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-700">
                  <Warehouse className="h-5 w-5" />
                  Stock Quantity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-gray-900">{product.totalQuantity || 0}</p>
                  <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="h-5 w-5" />
                  Reorder Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-900">{product.reorderLevel}</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <DollarSign className="h-5 w-5" />
                  Total Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-purple-900">
                  {formatCurrency(product.sellingPrice * (product.totalQuantity || 0))}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {product.weight && (
                  <div>
                    <span className="text-muted-foreground">Weight:</span>
                    <p className="font-medium">{product.weight} kg</p>
                  </div>
                )}
                {product.dimensions && (
                  <div>
                    <span className="text-muted-foreground">Dimensions:</span>
                    <p className="font-medium">{product.dimensions}</p>
                  </div>
                )}
                {product.warrantyPeriodMonths && (
                  <div>
                    <span className="text-muted-foreground">Warranty:</span>
                    <p className="font-medium">{product.warrantyPeriodMonths} months</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Created:
                  </span>
                  <p className="font-medium">{formatDate(product.createdAt)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Last Updated:
                  </span>
                  <p className="font-medium">{formatDate(product.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stock Alert */}
          {(product.totalQuantity || 0) <= product.reorderLevel && (
            <Card className="border-l-4 border-l-yellow-500 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Stock Alert</span>
                </div>
                <p className="text-yellow-700 mt-1">
                  {(product.totalQuantity || 0) === 0 
                    ? 'This product is out of stock and needs immediate restocking.'
                    : 'Stock quantity is below reorder level. Consider restocking soon.'
                  }
                </p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {hasPermission(PERMISSIONS.PRODUCTS_UPDATE) && (
            <div className="flex gap-2 pt-4">
              <Button onClick={onEdit} className="flex-1">
                <Edit className="mr-2 h-4 w-4" />
                Edit Product
              </Button>
              
              <Button
                variant="outline"
                onClick={() => onToggleStatus(product)}
                className="flex-1"
              >
                {product.isActive ? (
                  <>
                    <ToggleLeft className="mr-2 h-4 w-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <ToggleRight className="mr-2 h-4 w-4" />
                    Activate
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductViewDialog;
