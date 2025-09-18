import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  Folder,
  FolderOpen,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS } from "@/utils/constants";
import {
  categoriesService,
  ProductCategory,
} from "@/api/services/categories.service";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import { formatDate } from "@/utils/format.utils";
import { useNavigate } from "react-router-dom";
import AddCategoryDialog from "@/components/categories/AddCategoryDialog";
import EditCategoryDialog from "@/components/categories/EditCategoryDialog";
import CategoryViewDialog from "@/components/categories/CategoryViewDialog";

const Categories = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<ProductCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] =
    useState<ProductCategory | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const fetchCategories = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = await categoriesService.getCategories(includeInactive);
      setCategories(data);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to fetch categories";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [includeInactive]);

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    return categories.filter(
      (category) =>
        category.name
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase()) ||
        (category.description || "")
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase())
    );
  }, [categories, debouncedSearchTerm]);

  // Handlers
  const handleRefresh = () => {
    fetchCategories(true);
  };

  const handleView = (category: ProductCategory) => {
    setSelectedCategory(category);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (category: ProductCategory) => {
    setSelectedCategory(category);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (category: ProductCategory) => {
    setCategoryToDelete(category);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    try {
      await categoriesService.deleteCategory(categoryToDelete.id);
      toast.success("Category deleted successfully");
      fetchCategories();
      setCategoryToDelete(null);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to delete category";
      toast.error(errorMessage);
    }
  };

  const handleToggleStatus = async (category: ProductCategory) => {
    try {
      await categoriesService.toggleCategoryStatus(category.id);
      toast.success(
        `Category ${
          category.isActive ? "deactivated" : "activated"
        } successfully`
      );
      fetchCategories();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to update category status";
      toast.error(errorMessage);
    }
  };

  const handleCategoryAdded = (newCategory: ProductCategory) => {
    // Ensure the new category has the required _count property
    const categoryWithCount = {
      ...newCategory,
      _count: newCategory._count || { products: 0, subCategories: 0 },
    };
    
    setCategories((prev) => [categoryWithCount, ...prev]);
    toast.success("Category created successfully");
  };

  const handleCategoryUpdated = (updatedCategory: ProductCategory) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === updatedCategory.id ? updatedCategory : c))
    );
    toast.success("Category updated successfully");
  };

  const getStatusBadge = (category: ProductCategory) => {
    return category.isActive ? (
      <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    );
  };

  // Calculate stats - using 0 as default values for production readiness
  const stats = useMemo(() => {
    const activeCategories = categories.filter((c) => c.isActive);
    const rootCategories = categories.filter((c) => !c.parentCategoryId);
    
    // Backend to hndle it 
    const totalProducts = 0;

    return {
      totalCategories: categories.length,
      activeCategories: activeCategories.length,
      rootCategories: rootCategories.length,
      totalProducts,
    };
  }, [categories]);

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/products")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Categories
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage product categories and hierarchy
            </p>
          </div>
        </div>
        {hasPermission(PERMISSIONS.PRODUCTS_CREATE) && (
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Categories
            </CardTitle>
            <Folder className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {stats.totalCategories}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.activeCategories} active
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Root Categories
            </CardTitle>
            <FolderOpen className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {stats.rootCategories}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {stats.totalProducts}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {stats.activeCategories}
            </div>
            <p className="text-xs text-muted-foreground">
              {(
                (stats.activeCategories / Math.max(stats.totalCategories, 1)) *
                100
              ).toFixed(1)}
              % of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Category Management</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setIncludeInactive(!includeInactive)}
                className={includeInactive ? "bg-accent" : ""}
              >
                {includeInactive ? "Show Active Only" : "Show All"}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={refreshing}
                title="Refresh"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 border border-destructive/20 rounded-lg bg-destructive/5">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          )}

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Category Name</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[200px]">
                    Description
                  </TableHead>
                  <TableHead className="hidden sm:table-cell min-w-[150px]">
                    Parent Category
                  </TableHead>
                  <TableHead className="text-center min-w-[80px]">
                    Products
                  </TableHead>
                  <TableHead className="text-center min-w-[100px]">
                    Subcategories
                  </TableHead>
                  <TableHead className="min-w-[80px]">Status</TableHead>
                  <TableHead className="hidden lg:table-cell min-w-[120px]">
                    Created
                  </TableHead>
                  <TableHead className="text-right min-w-[120px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm
                          ? "No categories found matching your search."
                          : "No categories found."}
                      </div>
                      {hasPermission(PERMISSIONS.PRODUCTS_CREATE) &&
                        !searchTerm && (
                          <Button
                            variant="outline"
                            onClick={() => setIsAddDialogOpen(true)}
                            className="mt-2"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Create Your First Category
                          </Button>
                        )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {category.subCategories && category.subCategories.length > 0 ? (
                            <FolderOpen className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Folder className="h-4 w-4 text-gray-500" />
                          )}
                          <div>
                            <div className="font-medium">{category.name}</div>
                            <div className="text-sm text-muted-foreground md:hidden">
                              {category.description}
                            </div>
                            <div className="text-sm text-muted-foreground lg:hidden">
                              Created {formatDate(category.createdAt)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="max-w-xs truncate">
                          {category.description || "No description"}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {category.parentCategory ? (
                          <Badge variant="outline">
                            {category.parentCategory.name}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Root</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono">
                          {category._count?.products || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono">
                          {category._count?.subCategories || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(category)}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {formatDate(category.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(category)}
                            className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-2"
                          >
                            <Eye className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">View</span>
                          </Button>

                          {hasPermission(PERMISSIONS.PRODUCTS_UPDATE) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(category)}
                              className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-2"
                            >
                              <Edit className="h-4 w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Edit</span>
                            </Button>
                          )}

                          {hasPermission(PERMISSIONS.PRODUCTS_DELETE) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(category)}
                              className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-2 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Delete</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddCategoryDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onCategoryAdded={handleCategoryAdded}
        categories={categories}
      />

      {selectedCategory && (
        <>
          <EditCategoryDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            category={selectedCategory}
            onCategoryUpdated={handleCategoryUpdated}
            categories={categories}
          />

          <CategoryViewDialog
            open={isViewDialogOpen}
            onOpenChange={setIsViewDialogOpen}
            category={selectedCategory}
            onEdit={() => {
              setIsViewDialogOpen(false);
              setIsEditDialogOpen(true);
            }}
            onToggleStatus={() => handleToggleStatus(selectedCategory)}
          />
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!categoryToDelete}
        onOpenChange={() => setCategoryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{categoryToDelete?.name}"? This
              action cannot be undone and will fail if the category has products
              or subcategories.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Categories;