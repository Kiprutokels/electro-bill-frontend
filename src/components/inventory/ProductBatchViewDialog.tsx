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
  Calendar,
  User,
  Edit,
  MapPin,
  Hash,
  Building,
  AlertTriangle,
} from "lucide-react";
import { ProductBatch } from "@/api/services/productBatches.service";
import { formatCurrency, formatDate } from "@/utils/format.utils";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS } from "@/utils/constants";

interface ProductBatchViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: ProductBatch | null;
  onEdit: () => void;
}

const ProductBatchViewDialog: React.FC<ProductBatchViewDialogProps> = ({
  open,
  onOpenChange,
  batch,
  onEdit,
}) => {
  const { hasPermission } = useAuth();

  if (!batch) return null;

  const totalAvailable = batch.inventory.reduce((sum, inv) => sum + inv.quantityAvailable, 0);
  const totalReserved = batch.inventory.reduce((sum, inv) => sum + inv.quantityReserved, 0);
  const totalUsed = batch.quantityReceived - totalAvailable - totalReserved;

  const getBatchStatusBadge = () => {
    const now = new Date();
    const expiryDate = batch.expiryDate ? new Date(batch.expiryDate) : null;

    if (totalAvailable === 0) {
      return (
        <Badge variant="secondary">
          <Package className="w-3 h-3 mr-1" />
          Empty
        </Badge>
      );
    }

    if (expiryDate && expiryDate < now) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Expired
        </Badge>
      );
    }

    if (expiryDate) {
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry <= 30) {
        return (
          <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
            <Calendar className="w-3 h-3 mr-1" />
            Expires in {daysUntilExpiry} days
          </Badge>
        );
      }
    }

    return (
      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
        <Package className="w-3 h-3 mr-1" />
        Active
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Batch Details
            </DialogTitle>
            {getBatchStatusBadge()}
          </div>
        </DialogHeader>

        <div className="space-y-4 md:space-y-6">
          {/* Header Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Batch Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Batch Number</p>
                  <p className="font-mono font-medium text-lg">{batch.batchNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Received Date</p>
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(batch.receivedDate)}
                  </p>
                </div>
                {batch.expiryDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Expiry Date</p>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(batch.expiryDate)}
                    </p>
                  </div>
                )}
                {batch.supplierBatchRef && (
                  <div>
                    <p className="text-sm text-muted-foreground">Supplier Reference</p>
                    <p className="font-mono bg-muted px-2 py-1 rounded text-sm">
                      {batch.supplierBatchRef}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Created By</p>
                  <p className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {batch.createdByUser
                      ? `${batch.createdByUser.firstName} ${batch.createdByUser.lastName}`
                      : "Unknown"}
                  </p>
                </div>
              </CardContent>
            </Card>

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
                    {batch.product?.name || "Unknown Product"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">SKU</p>
                  <p className="font-mono bg-muted px-2 py-1 rounded text-sm">
                    {batch.product?.sku || "N/A"}
                  </p>
                </div>
                {batch.product?.sellingPrice && (
                  <div>
                    <p className="text-sm text-muted-foreground">Selling Price</p>
                    <p className="font-semibold">
                      {formatCurrency(Number(batch.product.sellingPrice))}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Buying Price</p>
                  <p className="font-semibold">{formatCurrency(Number(batch.buyingPrice))}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quantity Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Quantity Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Quantity Received</p>
                  <p className="text-2xl font-bold">{batch.quantityReceived}</p>
                  <p className="text-xs text-muted-foreground">Initial quantity</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Available</p>
                  <p className="text-2xl font-bold text-green-600">{totalAvailable}</p>
                  <p className="text-xs text-muted-foreground">Ready to use</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reserved</p>
                  <p className="text-2xl font-bold text-yellow-600">{totalReserved}</p>
                  <p className="text-xs text-muted-foreground">Allocated</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Used/Sold</p>
                  <p className="text-2xl font-bold text-blue-600">{totalUsed}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          {batch.inventory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Storage Locations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {batch.inventory.map((inventory, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{inventory.location}</p>
                          <p className="text-sm text-muted-foreground">Storage location</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Available</p>
                            <p className="font-medium">{inventory.quantityAvailable}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Reserved</p>
                            <p className="font-medium">{inventory.quantityReserved}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Investment</p>
                  <p className="font-semibold text-lg">
                    {formatCurrency(Number(batch.buyingPrice) * batch.quantityReceived)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Value (Available)</p>
                  <p className="font-semibold text-lg">
                    {formatCurrency(Number(batch.buyingPrice) * totalAvailable)}
                  </p>
                </div>
                {batch.product?.sellingPrice && (
                  <div>
                    <p className="text-sm text-muted-foreground">Potential Value (Selling)</p>
                    <p className="font-semibold text-lg text-green-600">
                      {formatCurrency(Number(batch.product.sellingPrice) * totalAvailable)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {batch.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{batch.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            {hasPermission(PERMISSIONS.INVENTORY_UPDATE) && (
              <Button onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Batch
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductBatchViewDialog;