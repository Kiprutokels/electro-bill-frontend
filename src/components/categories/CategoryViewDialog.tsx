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
  FolderOpen, 
  Package, 
  Calendar, 
  Folder,
  Edit,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { ProductCategory } from '@/api/services/categories.service';
import { formatDate } from '@/utils/format.utils';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/utils/constants';

interface CategoryViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: ProductCategory;
  onEdit: () => void;
  onToggleStatus: (category: ProductCategory) => void;
}

const CategoryViewDialog: React.FC<CategoryViewDialogProps> = ({
  open,
  onOpenChange,
  category,
  onEdit,
  onToggleStatus,
}) => {
  const { hasPermission } = useAuth();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Category Details
            </DialogTitle>
            <Badge variant={category.isActive ? 'default' : 'secondary'}>
              {category.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {category.subCategories.length > 0 ? (
                  <FolderOpen className="h-5 w-5 text-blue-500" />
                ) : (
                  <Folder className="h-5 w-5 text-gray-500" />
                )}
                {category.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  {category.parentCategory ? (
                    <>
                      <span className="text-muted-foreground">{category.parentCategory.name}</span>
                      <span className="mx-2">›</span>
                      <span className="font-medium">{category.name}</span>
                    </>
                  ) : (
                    <span className="font-medium">Root Category</span>
                  )}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {category.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{category.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Package className="h-5 w-5" />
                  Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-900">
                  {category._count.products}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <Folder className="h-5 w-5" />
                  Subcategories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-900">
                  {category._count.subCategories}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Category Information */}
          <Card>
            <CardHeader>
              <CardTitle>Category Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Category Type</span>
                  <span className="font-medium">
                    {category.parentCategoryId ? 'Subcategory' : 'Root Category'}
                  </span>
                </div>

                {category.parentCategory && (
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Parent Category</span>
                    <span className="font-medium">{category.parentCategory.name}</span>
                  </div>
                )}

                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={category.isActive ? 'default' : 'secondary'}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Created</span>
                </div>
                <p className="font-medium">{formatDate(category.createdAt)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Last Updated</span>
                </div>
                <p className="font-medium">{formatDate(category.updatedAt)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          {hasPermission(PERMISSIONS.PRODUCTS_UPDATE) && (
            <div className="flex gap-2 pt-4">
              <Button onClick={onEdit} className="flex-1">
                <Edit className="mr-2 h-4 w-4" />
                Edit Category
              </Button>
              
              <Button
                variant="outline"
                onClick={() => onToggleStatus(category)}
                className="flex-1"
              >
                {category.isActive ? (
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

export default CategoryViewDialog;
