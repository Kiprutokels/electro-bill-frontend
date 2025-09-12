import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  Package,
  Calendar,
  MapPin,
  Settings,
  Loader2,
  Building,
  Hash,
} from "lucide-react";
import {
  InventoryItem,
  ProductInventory,
  inventoryService,
} from "@/api/services/inventory.service";
import { formatCurrency, formatDate } from "@/utils/format.utils";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS } from "@/utils/constants";
import { toast } from "sonner";

interface InventoryViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  onAdjust: (item: InventoryItem) => void;
}

const InventoryViewDialog: React.FC<InventoryViewDialogProps> = ({
  open,
  onOpenChange,
  item,
  onAdjust,
}) => {
  const { hasPermission } = useAuth();
  const [productInventory, setProductInventory] = useState<ProductInventory | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProductInventory = async () => {
      if (item && open) {
        setLoading(true);
        try {
          const data = await inventoryService.getByProduct(item.productId);
          setProductInventory(data);
        } catch (error) {
          console.error("Failed to fetch product inventory:", error);
          toast.error("Failed to load detailed inventory information");
        } finally {
          setLoading(false);
        }
      }
    };

    if (open) {
      fetchProductInventory();
    } else {
      setProductInventory(null);
    }
  }, [item, open]);

  if (!item) return null;

  const getStockBadge = (available: number, reorderLevel: number) => {
    if (available === 0) {
      return (
        <Badge variant="destructive">
          Out of Stock
        </Badge>
      );
    }
    if (available <= reorderLevel && reorderLevel > 0) {
      return (
        <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
          Low Stock
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
        In Stock
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Inventory Details
          </DialogTitle>
          <DialogDescription>
            View detailed inventory information and batch details
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Loading inventory details...
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {/* Product Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Product Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Product Name</p>
                    <p className="font-semibold text-lg">
                      {item.product?.name || "Unknown Product"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">SKU</p>
                    <p className="font-mono bg-muted px-2 py-1 rounded text-sm">
                      {item.product?.sku || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p>{item.product?.category?.name || "Uncategorized"}</p>
                  </div>
                  {item.product?.brand && (
                    <div>
                      <p className="text-sm text-muted-foreground">Brand</p>
                      <p>{item.product.brand.name}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Selling Price</p>
                    <p className="font-semibold">
                      {formatCurrency(Number(item.product?.sellingPrice || 0))}
                    </p>
                  </div>
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
                    <p className="text-sm text-muted-foreground">Available Quantity</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">
                        {productInventory?.totalAvailable || item.quantityAvailable || 0}
                      </span>
                      {getStockBadge(
                        productInventory?.totalAvailable || item.quantityAvailable || 0,
                        item.product?.reorderLevel || 0
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Reserved Quantity</p>
                    <p className="text-lg">
                      {productInventory?.totalReserved || item.quantityReserved || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Quantity</p>
                    <p className="text-lg font-medium">
                      {productInventory?.totalQuantity || 
                        (item.quantityAvailable || 0) + (item.quantityReserved || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Reorder Level</p>
                    <p className="text-lg">{item.product?.reorderLevel || 0}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Location and Batch Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Storage Location</p>
                    <p className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      {item.location || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Stock Update</p>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(item.lastStockUpdate || item.updatedAt)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {item.batch && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Batch Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Batch Number</p>
                      <p className="font-mono bg-muted px-2 py-1 rounded text-sm">
                        {item.batch.batchNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Buying Price</p>
                      <p className="font-medium">
                        {formatCurrency(Number(item.batch.buyingPrice || 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Received Date</p>
                      <p>{formatDate(item.batch.receivedDate)}</p>
                    </div>
                    {item.batch.expiryDate && (
                      <div>
                        <p className="text-sm text-muted-foreground">Expiry Date</p>
                        <p>{formatDate(item.batch.expiryDate)}</p>
                      </div>
                    )}
                    {item.batch.supplierBatchRef && (
                      <div>
                        <p className="text-sm text-muted-foreground">Supplier Reference</p>
                        <p className="font-mono text-sm">{item.batch.supplierBatchRef}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* All Batches for this Product */}
            {productInventory && productInventory.batches.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>All Batches for this Product</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {productInventory.batches.map((batch) => (
                      <div
                        key={batch.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-mono text-sm font-medium">
                            {batch.batch?.batchNumber || "No batch number"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Location: {batch.location} •{" "}
                            Available: {batch.quantityAvailable} •{" "}
                            Reserved: {batch.quantityReserved}
                          </p>
                        </div>
                        {batch.batch?.expiryDate && (
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              Expires: {formatDate(batch.batch.expiryDate)}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Cost per Unit</p>
                    <p className="font-semibold">
                      {item.batch
                        ? formatCurrency(Number(item.batch.buyingPrice || 0))
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Stock Value (Cost)</p>
                    <p className="font-semibold">
                      {item.batch
                        ? formatCurrency(
                            (item.quantityAvailable || 0) * Number(item.batch.buyingPrice || 0)
                          )
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Stock Value (Selling)</p>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(
                        (item.quantityAvailable || 0) * Number(item.product?.sellingPrice || 0)
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              {hasPermission(PERMISSIONS.INVENTORY_UPDATE) && (
                <Button onClick={() => onAdjust(item)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Adjust Stock
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InventoryViewDialog;