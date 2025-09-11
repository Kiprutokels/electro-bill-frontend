import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Package,
  AlertTriangle,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Loader2,
  Folder,
  Tag,
  Settings,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS } from "@/utils/constants";
import { productsService, Product } from "@/api/services/products.service";
import {
  categoriesService,
  ProductCategory,
} from "@/api/services/categories.service";
import { brandsService, Brand } from "@/api/services/brands.service";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/currency.utils";
import AddProductDialog from "@/components/products/AddProductDialog";
import EditProductDialog from "@/components/products/EditProductDialog";
import ProductViewDialog from "@/components/products/ProductViewDialog";
import RestockDialog from "@/components/products/RestockDialog";

const Products = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterBrand, setFilterBrand] = useState("all");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isRestockDialogOpen, setIsRestockDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const fetchData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const [productsData, categoriesData, brandsData] = await Promise.all([
        productsService.getProducts({
          includeInactive,
          categoryId: filterCategory !== "all" ? filterCategory : undefined,
          brandId: filterBrand !== "all" ? filterBrand : undefined,
        }),
        categoriesService.getCategories(true),
        brandsService.getBrands(true),
      ]);

      setProducts(productsData);
      setCategories(categoriesData);
      setBrands(brandsData);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to fetch data";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchData();
  }, [filterCategory, filterBrand, includeInactive]);

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    return products.filter(
      (product) =>
        product.name
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        product.category.name
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase()) ||
        (product.brand?.name || "")
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase())
    );
  }, [products, debouncedSearchTerm]);

  // Handlers
  const handleRefresh = () => {
    fetchData(true);
  };

  const handleView = (product: Product) => {
    setSelectedProduct(product);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleRestock = (product: Product) => {
    setSelectedProduct(product);
    setIsRestockDialogOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      await productsService.deleteProduct(productToDelete.id);
      toast.success("Product deleted successfully");
      fetchData();
      setProductToDelete(null);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to delete product";
      toast.error(errorMessage);
    }
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      await productsService.toggleProductStatus(product.id);
      toast.success(
        `Product ${product.isActive ? "deactivated" : "activated"} successfully`
      );
      fetchData();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to update product status";
      toast.error(errorMessage);
    }
  };

  const handleProductAdded = (newProduct: Product) => {
    setProducts((prev) => [newProduct, ...prev]);
    toast.success("Product created successfully");
  };

  const handleProductUpdated = (updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    toast.success("Product updated successfully");
  };

  const handleRestockComplete = () => {
    fetchData();
    toast.success("Stock updated successfully");
  };

  const getStatusBadge = (product: Product) => {
    if (!product.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }

    const totalQuantity = product.totalQuantity || 0;
    const reorderLevel = product.reorderLevel;

    if (totalQuantity <= reorderLevel / 2 && reorderLevel > 0) {
      return <Badge variant="destructive">Critical</Badge>;
    } else if (totalQuantity <= reorderLevel && reorderLevel > 0) {
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-600">Low Stock</Badge>
      );
    } else {
      return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const activeProducts = products.filter((p) => p.isActive);
    const lowStockProducts = products.filter((p) => {
      const totalQuantity = p.totalQuantity || 0;
      return totalQuantity <= p.reorderLevel && p.reorderLevel > 0;
    });
    const totalValue = products.reduce(
      (sum, p) => sum + p.sellingPrice * (p.totalQuantity || 0),
      0
    );

    return {
      totalProducts: products.length,
      activeProducts: activeProducts.length,
      lowStockProducts: lowStockProducts.length,
      totalValue,
    };
  }, [products]);

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Product Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your inventory and product catalog
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => navigate("/categories")}
            className="flex-1 sm:flex-none"
          >
            <Folder className="mr-2 h-4 w-4" />
            Manage Categories
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/brands")}
            className="flex-1 sm:flex-none"
          >
            <Tag className="mr-2 h-4 w-4" />
            Manage Brands
          </Button>
          {hasPermission(PERMISSIONS.PRODUCTS_CREATE) && (
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="flex-1 sm:flex-none"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Products
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {stats.totalProducts}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.activeProducts} active
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Stock Items
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {stats.lowStockProducts}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inventory Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {formatCurrency(stats.totalValue)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {categories.filter((c) => c.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {brands.filter((b) => b.isActive).length} brands
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Product Inventory</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories
                    .filter((c) => c.isActive)
                    .map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Select value={filterBrand} onValueChange={setFilterBrand}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands
                    .filter((b) => b.isActive)
                    .map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
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
                  <TableHead className="min-w-[100px]">SKU</TableHead>
                  <TableHead className="min-w-[200px]">Product Name</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Category
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Brand</TableHead>
                  <TableHead className="text-right min-w-[80px]">
                    Stock
                  </TableHead>
                  <TableHead className="text-right hidden lg:table-cell min-w-[100px]">
                    Price
                  </TableHead>
                  <TableHead className="min-w-[80px]">Status</TableHead>
                  <TableHead className="text-right min-w-[140px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm
                          ? "No products found matching your search."
                          : "No products found."}
                      </div>
                      {hasPermission(PERMISSIONS.PRODUCTS_CREATE) &&
                        !searchTerm && (
                          <Button
                            variant="outline"
                            onClick={() => setIsAddDialogOpen(true)}
                            className="mt-2"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Your First Product
                          </Button>
                        )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        {product.sku}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground sm:hidden">
                            {product.category.name} •{" "}
                            {product.brand?.name || "No Brand"}
                          </div>
                          <div className="text-sm text-muted-foreground lg:hidden">
                            {formatCurrency(product.sellingPrice)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {product.category.name}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {product.brand?.name || "No Brand"}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            (product.totalQuantity || 0) <=
                              product.reorderLevel && product.reorderLevel > 0
                              ? "text-red-600 font-medium"
                              : ""
                          }
                        >
                          {product.totalQuantity || 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-right hidden lg:table-cell">
                        {formatCurrency(product.sellingPrice)}
                      </TableCell>
                      <TableCell>{getStatusBadge(product)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(product)}
                            className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-2"
                            title="View"
                          >
                            <Eye className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">View</span>
                          </Button>

                          {hasPermission(PERMISSIONS.PRODUCTS_UPDATE) && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRestock(product)}
                                className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-2"
                                title="Restock"
                              >
                                <Settings className="h-4 w-4 sm:mr-1" />
                                <span className="hidden sm:inline">Restock</span>
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(product)}
                                className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-2"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4 sm:mr-1" />
                                <span className="hidden sm:inline">Edit</span>
                              </Button>
                            </>
                          )}

                          {hasPermission(PERMISSIONS.PRODUCTS_DELETE) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(product)}
                              className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-2 text-destructive hover:text-destructive"
                              title="Delete"
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
      <AddProductDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onProductAdded={handleProductAdded}
        categories={categories}
        brands={brands}
      />

      {selectedProduct && (
        <>
          <EditProductDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            product={selectedProduct}
            onProductUpdated={handleProductUpdated}
            categories={categories}
            brands={brands}
          />

          <ProductViewDialog
            open={isViewDialogOpen}
            onOpenChange={setIsViewDialogOpen}
            product={selectedProduct}
            onEdit={() => {
              setIsViewDialogOpen(false);
              setIsEditDialogOpen(true);
            }}
            onToggleStatus={() => handleToggleStatus(selectedProduct)}
          />

          <RestockDialog
            open={isRestockDialogOpen}
            onOpenChange={setIsRestockDialogOpen}
            product={selectedProduct}
            onRestockComplete={handleRestockComplete}
          />
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!productToDelete}
        onOpenChange={() => setProductToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{productToDelete?.name}"? This
              action cannot be undone and will fail if the product has related
              records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Products;
