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
  Edit, 
  ExternalLink, 
  Package, 
  Calendar, 
  Globe,
  Image,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Brand } from '@/api/services/brands.service';
import { formatDate } from '@/utils/format.utils';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/utils/constants';

interface BrandViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand: Brand;
  onEdit: () => void;
  onToggleStatus: (brand: Brand) => void;
}

const BrandViewDialog: React.FC<BrandViewDialogProps> = ({
  open,
  onOpenChange,
  brand,
  onEdit,
  onToggleStatus,
}) => {
  const { hasPermission } = useAuth();

  const getStatusBadge = () => {
    return brand.isActive ? (
      <Badge className="bg-green-500 hover:bg-green-600">
        Active
      </Badge>
    ) : (
      <Badge variant="secondary">
        Inactive
      </Badge>
    );
  };

  const hasWebsite = brand.website && brand.website.trim() !== '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                {brand.logoUrl ? (
                  <img 
                    src={brand.logoUrl} 
                    alt={brand.name}
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextSibling!.style.display = 'block';
                    }}
                  />
                ) : null}
                <Image 
                  className="h-4 w-4 text-muted-foreground" 
                  style={{ display: brand.logoUrl ? 'none' : 'block' }}
                />
              </div>
              {brand.name}
            </DialogTitle>
            {getStatusBadge()}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Brand Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Products Count</h4>
                <p className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {brand._count?.products || 0} products
                </p>
              </div>

              {hasWebsite && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Website</h4>
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => window.open(brand.website, '_blank')}
                  >
                    <Globe className="h-4 w-4 mr-1" />
                    {brand.website}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              )}

              {brand.logoUrl && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Logo</h4>
                  <div className="flex items-center gap-2">
                    <img 
                      src={brand.logoUrl} 
                      alt={brand.name}
                      className="w-12 h-12 object-contain border rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <Button
                      variant="link"
                      className="p-0 h-auto text-sm"
                      onClick={() => window.open(brand.logoUrl, '_blank')}
                    >
                      View full size
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {brand.description && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Description</h4>
                  <p className="text-sm">{brand.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Created</h4>
                  <p className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    {formatDate(brand.createdAt)}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Last Updated</h4>
                  <p className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    {formatDate(brand.updatedAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            {hasPermission(PERMISSIONS.PRODUCTS_UPDATE) && (
              <>
                <Button onClick={onEdit} className="flex-1">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Brand
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => onToggleStatus(brand)}
                  className="flex-1"
                >
                  {brand.isActive ? (
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
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BrandViewDialog;
