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
  Tag,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Loader2,
  ArrowLeft,
  Image,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS } from "@/utils/constants";
import { brandsService, Brand } from "@/api/services/brands.service";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import { formatDate } from "@/utils/format.utils";
import { useNavigate } from "react-router-dom";
import AddBrandDialog from "@/components/brands/AddBrandDialog";
import EditBrandDialog from "@/components/brands/EditBrandDialog";
import BrandViewDialog from "@/components/brands/BrandViewDialog";

const Brands = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const fetchBrands = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = await brandsService.getBrands(includeInactive);
      setBrands(data);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to fetch brands";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, [includeInactive]);

  // Filter brands based on search
  const filteredBrands = useMemo(() => {
    return brands.filter(
      (brand) =>
        brand.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (brand.description || "")
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase())
    );
  }, [brands, debouncedSearchTerm]);

  // Handlers
  const handleRefresh = () => {
    fetchBrands(true);
  };

  const handleView = (brand: Brand) => {
    setSelectedBrand(brand);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (brand: Brand) => {
    setSelectedBrand(brand);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (brand: Brand) => {
    setBrandToDelete(brand);
  };

  const handleDeleteConfirm = async () => {
    if (!brandToDelete) return;

    try {
      await brandsService.deleteBrand(brandToDelete.id);
      toast.success("Brand deleted successfully");
      fetchBrands();
      setBrandToDelete(null);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to delete brand";
      toast.error(errorMessage);
    }
  };

  const handleToggleStatus = async (brand: Brand) => {
    try {
      await brandsService.toggleBrandStatus(brand.id);
      toast.success(
        `Brand ${brand.isActive ? "deactivated" : "activated"} successfully`
      );
      fetchBrands();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to update brand status";
      toast.error(errorMessage);
    }
  };

  const handleBrandAdded = (newBrand: Brand) => {
    setBrands((prev) => [newBrand, ...prev]);
    toast.success("Brand created successfully");
  };

  const handleBrandUpdated = (updatedBrand: Brand) => {
    setBrands((prev) =>
      prev.map((b) => (b.id === updatedBrand.id ? updatedBrand : b))
    );
    toast.success("Brand updated successfully");
  };

  const getStatusBadge = (brand: Brand) => {
    return brand.isActive ? (
      <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    );
  };

  // Calculate stats
  const stats = useMemo(() => {
    const activeBrands = brands.filter((b) => b.isActive);
    const totalProducts = brands.reduce((sum, b) => sum + b._count.products, 0);
    const brandsWithProducts = brands.filter((b) => b._count.products > 0);

    return {
      totalBrands: brands.length,
      activeBrands: activeBrands.length,
      totalProducts,
      brandsWithProducts: brandsWithProducts.length,
    };
  }, [brands]);

  if (loading && brands.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading brands...</p>
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
              Brands
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage product brands and manufacturers
            </p>
          </div>
        </div>
        {hasPermission(PERMISSIONS.PRODUCTS_CREATE) && (
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Brand
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Brands
            </CardTitle>
            <Tag className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {stats.totalBrands}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.activeBrands} active
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Brands
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {stats.activeBrands}
            </div>
            <p className="text-xs text-muted-foreground">
              {(
                (stats.activeBrands / Math.max(stats.totalBrands, 1)) *
                100
              ).toFixed(1)}
              % of total
            </p>
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
              Brands with Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {stats.brandsWithProducts}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Brand Management</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search brands..."
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
                  <TableHead className="min-w-[50px]">Logo</TableHead>
                  <TableHead className="min-w-[200px]">Brand Name</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[250px]">
                    Description
                  </TableHead>
                  <TableHead className="text-center min-w-[100px]">
                    Products
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
                {filteredBrands.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm
                          ? "No brands found matching your search."
                          : "No brands found."}
                      </div>
                      {hasPermission(PERMISSIONS.PRODUCTS_CREATE) &&
                        !searchTerm && (
                          <Button
                            variant="outline"
                            onClick={() => setIsAddDialogOpen(true)}
                            className="mt-2"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Create Your First Brand
                          </Button>
                        )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBrands.map((brand) => (
                    <TableRow key={brand.id}>
                      <TableCell>
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          {brand.logoUrl ? (
                            <img
                              src={brand.logoUrl}
                              alt={brand.name}
                              className="w-8 h-8 object-contain"
                              onError={(e) => {
                                const img = e.currentTarget;
                                const fallbackElement =
                                  img.nextElementSibling as HTMLElement;
                                if (fallbackElement) {
                                  img.style.display = "none";
                                  fallbackElement.style.display = "block";
                                }
                              }}
                            />
                          ) : null}
                          <Image
                            className="h-4 w-4 text-muted-foreground"
                            style={{
                              display: brand.logoUrl ? "none" : "block",
                            }}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{brand.name}</div>
                          <div className="text-sm text-muted-foreground md:hidden">
                            {brand.description}
                          </div>
                          <div className="text-sm text-muted-foreground lg:hidden">
                            Created {formatDate(brand.createdAt)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="max-w-xs truncate">
                          {brand.description || "No description"}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono">
                          {brand._count.products}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(brand)}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {formatDate(brand.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(brand)}
                            className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-2"
                          >
                            <Eye className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">View</span>
                          </Button>

                          {hasPermission(PERMISSIONS.PRODUCTS_UPDATE) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(brand)}
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
                              onClick={() => handleDeleteClick(brand)}
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
      <AddBrandDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onBrandAdded={handleBrandAdded}
      />

      {selectedBrand && (
        <>
          <EditBrandDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            brand={selectedBrand}
            onBrandUpdated={handleBrandUpdated}
          />

          <BrandViewDialog
            open={isViewDialogOpen}
            onOpenChange={setIsViewDialogOpen}
            brand={selectedBrand}
            onEdit={() => {
              setIsViewDialogOpen(false);
              setIsEditDialogOpen(true);
            }}
            onToggleStatus={() => handleToggleStatus(selectedBrand)}
          />
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!brandToDelete}
        onOpenChange={() => setBrandToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Brand</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{brandToDelete?.name}"? This
              action cannot be undone and will fail if the brand has associated
              products.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Brand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Brands;
