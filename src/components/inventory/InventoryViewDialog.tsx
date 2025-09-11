import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Eye, Package, Calendar, User, MapPin, FileText, Edit, Trash2 } from 'lucide-react';
import { InventoryItem } from '@/api/services/inventory.service';
import { formatCurrency, formatDate } from '@/utils/format.utils';
import { PERMISSIONS } from '@/lib/permissions';
import { useAuth } from '@/contexts/AuthContext';

interface InventoryViewDialogProps {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (item: InventoryItem) => void;
  onAdjust?: (item: InventoryItem) => void;
}

export function InventoryViewDialog({
  item,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onAdjust
}: InventoryViewDialogProps) {
  const { hasPermission } = useAuth();

  if (!item) return null;

  const getStockStatusColor = (quantity: number, minStock: number) => {
    if (quantity === 0) return 'bg-red-500';
    if (quantity <= minStock) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStockStatusText = (quantity: number, minStock: number) => {
    if (quantity === 0) return 'Out of Stock';
    if (quantity <= minStock) return 'Low Stock';
    return 'In Stock';
  };

  // Safe number conversion for unitCost
  const unitCost = isNaN(Number(item.unitCost)) ? 0 : Number(item.unitCost);
  const availableQuantity = item.quantityAvailable || item.quantity || 0;
  const reservedQuantity = item.quantityReserved || 0;
  const minStock = item.minStock || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Inventory Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Product Name</label>
                <p className="text-lg font-semibold">{item.product?.name || 'Unknown Product'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">SKU</label>
                <p className="font-mono text-sm bg-muted px-2 py-1 rounded">{item.product?.sku || 'N/A'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Category</label>
                <p>{item.product?.category?.name || 'Uncategorized'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Brand</label>
                <p>{item.product?.brand?.name || 'No Brand'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Available Stock</label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{availableQuantity}</span>
                  <Badge 
                    className={`${getStockStatusColor(availableQuantity, minStock)} text-white`}
                  >
                    {getStockStatusText(availableQuantity, minStock)}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Reserved Stock</label>
                <p className="text-lg">{reservedQuantity}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Minimum Stock</label>
                <p className="text-lg">{minStock}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Maximum Stock</label>
                <p className="text-lg">{item.maxStock || 'Not set'}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Location and Storage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Location
                </label>
                <p>{item.location || 'Not specified'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Bin/Shelf</label>
                <p>{item.bin || 'Not specified'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Unit Cost</label>
                <p className="text-lg font-semibold">{formatCurrency(unitCost)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Value</label>
                <p className="text-lg font-semibold text-green-600">
                  {formatCurrency(availableQuantity * unitCost)}
                </p>
              </div>
            </div>
          </div>

          {/* Batch Information */}
          {item.batch && (
            <>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Batch Number</label>
                    <p className="font-mono">{item.batch.batchNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Buying Price</label>
                    <p>{formatCurrency(Number(item.batch.buyingPrice) || 0)}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Received Date</label>
                    <p>{formatDate(item.batch.receivedDate)}</p>
                  </div>
                  {item.batch.expiryDate && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Expiry Date</label>
                      <p>{formatDate(item.batch.expiryDate)}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Dates and Tracking */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Last Updated
                </label>
                <p>{formatDate(item.lastUpdated || item.lastStockUpdate)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Counted</label>
                <p>{item.lastCounted ? formatDate(item.lastCounted) : 'Never'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Updated By
                </label>
                <p>{item.updatedBy || 'System'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Supplier</label>
                <p>{item.supplier || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {item.notes && (
            <>
              <Separator />
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  Notes
                </label>
                <p className="mt-1 p-3 bg-muted rounded-md text-sm">{item.notes}</p>
              </div>
            </>
          )}

          {/* Product Description */}
          {item.product?.description && (
            <>
              <Separator />
              <div>
                <label className="text-sm font-medium text-muted-foreground">Product Description</label>
                <p className="mt-1 text-sm text-muted-foreground">{item.product.description}</p>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <div className="flex gap-2">
            {hasPermission(PERMISSIONS.INVENTORY.UPDATE) && onEdit && (
              <Button variant="outline" onClick={() => onEdit(item)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {hasPermission(PERMISSIONS.INVENTORY.UPDATE) && onAdjust && (
              <Button variant="outline" onClick={() => onAdjust(item)}>
                <Package className="h-4 w-4 mr-2" />
                Adjust Stock
              </Button>
            )}
          </div>
          
          {hasPermission(PERMISSIONS.INVENTORY.DELETE) && onDelete && (
            <Button variant="destructive" onClick={() => onDelete(item)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
