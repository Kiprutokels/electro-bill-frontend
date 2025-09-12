import React, { useState, useMemo } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  MoreHorizontal,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS } from "@/utils/constants";
import { Product, productsService } from "@/api/services/products.service";
import {
  ProductCategory,
  categoriesService,
} from "@/api/services/categories.service";
import { Brand, brandsService } from "@/api/services/brands.service";
import { useDebounce } from "@/hooks/useDebounce";
import { useProducts } from "@/hooks/useProducts";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/format.utils";
import AddProductDialog from "@/components/products/AddProductDialog";
import EditProductDialog from "@/components/products/EditProductDialog";
import ProductViewDialog from "@/components/products/ProductViewDialog";
import RestockDialog from "@/components/products/RestockDialog";

const Products = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterBrand, setFilterBrand] = useState("all");
  const [includeInactive] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const {
    products,
    loading,
    error,
    refreshing,
    refresh,
    updateFilters,
    addProductToList,
    updateProductInList,
    removeProductFromList,
  } = useProducts({
    initialFilters: {
      includeInactive,
      categoryId: filterCategory !== "all" ? filterCategory : undefined,
      brandId: filterBrand !== "all" ? filterBrand : undefined,
    },
  });

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isRestockDialogOpen, setIsRestockDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Fetch categories and brands
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesData, brandsData] = await Promise.all([
          categoriesService.getCategories(),
          brandsService.getBrands(),
        ]);
        setCategories(categoriesData);
        setBrands(brandsData);
      } catch (error) {
        console.error("Failed to fetch categories and brands:", error);
      }
    };
    fetchData();
  }, []);

  // Update filters when dropdowns change
  React.useEffect(() => {
    updateFilters({
      includeInactive,
      categoryId: filterCategory !== "all" ? filterCategory : undefined,
      brandId: filterBrand !== "all" ? filterBrand : undefined,
    });
  }, [filterCategory, filterBrand, includeInactive, updateFilters]);

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
      await productsService.delete(productToDelete.id);
      removeProductFromList(productToDelete.id);
      setProductToDelete(null);
      toast.success("Product deleted successfully");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to delete product";
      toast.error(errorMessage);
    }
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      const updatedProduct = await productsService.toggleStatus(product.id);
      updateProductInList(updatedProduct);
      toast.success(
        `Product ${product.isActive ? "deactivated" : "activated"} successfully`
      );
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to update product status";
      toast.error(errorMessage);
    }
  };

  const handleProductAdded = (newProduct: Product) => {
    addProductToList(newProduct);
  };

  const handleProductUpdated = (updatedProduct: Product) => {
    updateProductInList(updatedProduct);
  };

  const handleRestockComplete = () => {
    refresh();
  };

  const getStatusBadge = (product: Product) => {
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
    <div className="space-responsive">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-responsive">
        <div>
          <h1 className="text-responsive-3xl font-bold text-foreground">
            Product Management
          </h1>
          <p className="text-responsive-sm text-muted-foreground">
            Manage your inventory and product catalog
          </p>
        </div>
        <div className="flex flex-col sm:flex-row space-responsive w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => navigate("/categories")}
            className="flex-1 sm:flex-none"
            size="sm"
          >
            <Folder className="mr-2 h-4 w-4" />
            <span className="hidden xs:inline">Manage Categories</span>
            <span className="xs:hidden">Categories</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/brands")}
            className="flex-1 sm:flex-none"
            size="sm"
          >
            <Tag className="mr-2 h-4 w-4" />
            <span className="hidden xs:inline">Manage Brands</span>
            <span className="xs:hidden">Brands</span>
          </Button>
          {hasPermission(PERMISSIONS.PRODUCTS_CREATE) && (
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="flex-1 sm:flex-none"
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid-responsive grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Products
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
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
            <div className="text-2xl font-bold text-foreground">
              {stats.lowStockProducts}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inventory Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(stats.totalValue)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
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
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
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
                <SelectTrigger className="w-full sm:w-40">
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
                <SelectTrigger className="w-full sm:w-32">
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
                onClick={refresh}
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
        <CardContent className="p-0 sm:p-6">
          {error && (
            <div className="mb-4 mx-4 sm:mx-0 p-4 border border-destructive/20 rounded-lg bg-destructive/5">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          )}

          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[100px]">SKU</TableHead>
                    <TableHead className="min-w-[200px]">
                      Product Name
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Category
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Brand
                    </TableHead>
                    <TableHead className="text-right min-w-[80px]">
                      Stock
                    </TableHead>
                    <TableHead className="text-right hidden lg:table-cell min-w-[100px]">
                      Price
                    </TableHead>
                    <TableHead className="min-w-[80px]">Status</TableHead>
                    <TableHead className="text-right min-w-[60px]">
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
                        <TableCell className="font-mono text-sm">
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleView(product)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>

                              {hasPermission(PERMISSIONS.PRODUCTS_UPDATE) && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleRestock(product)}
                                  >
                                    <Settings className="mr-2 h-4 w-4" />
                                    Restock
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleEdit(product)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                </>
                              )}

                              {hasPermission(PERMISSIONS.PRODUCTS_DELETE) && (
                                <DropdownMenuItem
                                  onClick={() => handleDeleteClick(product)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
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
