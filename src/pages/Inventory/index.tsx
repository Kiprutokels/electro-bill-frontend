import { useState, useMemo } from "react";
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
  Package,
  Search,
  RefreshCw,
  Loader2,
  Eye,
  Settings,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  MoreHorizontal,
  FileBarChart,
  PackageOpen,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS } from "@/utils/constants";
import { InventoryItem } from "@/api/services/inventory.service";
import { formatDate } from "@/utils/format.utils";
import { useInventory } from "@/hooks/useInventory";
import InventoryViewDialog from "@/components/inventory/InventoryViewDialog";
import InventoryAdjustmentDialog from "@/components/inventory/InventoryAdjustmentDialog";
import { toast } from "sonner";

const Inventory = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const {
    inventory,
    summary,
    loading,
    error,
    refreshing,
    currentPage,
    totalPages,
    totalItems,
    searchTerm,
    filters,
    fetchInventory,
    refresh,
    updateSearch,
    updateFilters,
    setCurrentPage,
  } = useInventory();

  // Dialog states
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const handleView = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsViewDialogOpen(true);
  };

  const handleAdjustment = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsAdjustmentDialogOpen(true);
  };

  const handleLocationFilterChange = (value: string) => {
    if (value === "all") {
      const { location, ...restFilters } = filters;
      updateFilters(restFilters);
    } else {
      updateFilters({ ...filters, location: value });
    }
  };

  const handleStockFilterChange = (value: string) => {
    const newFilters = { ...filters };
    
    if (value === "all") {
      delete newFilters.lowStock;
      delete newFilters.includeZeroStock;
    } else if (value === "low") {
      newFilters.lowStock = true;
      delete newFilters.includeZeroStock;
    } else if (value === "zero") {
      newFilters.includeZeroStock = true;
      delete newFilters.lowStock;
    }
    
    updateFilters(newFilters);
  };

  const getStockBadge = (available: number, reorderLevel: number) => {
    if (available === 0) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Out of Stock
        </Badge>
      );
    }
    if (available <= reorderLevel && reorderLevel > 0) {
      return (
        <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
          <TrendingDown className="w-3 h-3 mr-1" />
          Low Stock
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
        <TrendingUp className="w-3 h-3 mr-1" />
        In Stock
      </Badge>
    );
  };

  // Calculate stats from summary
  const stats = useMemo(() => {
    if (!summary) {
      return {
        totalProducts: 0,
        inStock: 0,
        outOfStock: 0,
        lowStock: 0,
        expiredBatches: 0,
      };
    }

    return {
      totalProducts: summary.totalProducts,
      inStock: summary.productsInStock,
      outOfStock: summary.productsOutOfStock,
      lowStock: summary.lowStockCount,
      expiredBatches: summary.expiredBatchesCount,
    };
  }, [summary]);

  if (loading && inventory.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Inventory Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor and manage your product inventory
          </p>
        </div>
        <div className="flex gap-2">
          {hasPermission(PERMISSIONS.INVENTORY_READ) && (
            <Button
              variant="outline"
              onClick={() => navigate("/inventory/batches")}
            >
              <PackageOpen className="mr-2 h-4 w-4" />
              View Batches
            </Button>
          )}
          {hasPermission(PERMISSIONS.INVENTORY_READ) && (
            <Button
              variant="outline"
              onClick={() => navigate("/inventory/reports")}
            >
              <FileBarChart className="mr-2 h-4 w-4" />
              Reports
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Stock
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.inStock}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Out of Stock
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.outOfStock}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Stock
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.lowStock}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expired Batches
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.expiredBatches}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Inventory Items</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products, SKU..."
                  value={searchTerm}
                  onChange={(e) => updateSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select
                value={filters.location || "all"}
                onValueChange={handleLocationFilterChange}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="MAIN_WAREHOUSE">Main Warehouse</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={
                  filters.lowStock ? "low" :
                  filters.includeZeroStock ? "zero" : "all"
                }
                onValueChange={handleStockFilterChange}
              >
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock</SelectItem>
                  <SelectItem value="low">Low Stock</SelectItem>
                  <SelectItem value="zero">Include Zero</SelectItem>
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
                    <TableHead className="min-w-[200px]">Product</TableHead>
                    <TableHead className="hidden sm:table-cell">SKU</TableHead>
                    <TableHead className="text-right min-w-[100px]">Available</TableHead>
                    <TableHead className="hidden md:table-cell text-right">Reserved</TableHead>
                    <TableHead className="hidden lg:table-cell">Location</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="hidden md:table-cell">Updated</TableHead>
                    <TableHead className="text-right min-w-[60px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {searchTerm
                            ? "No inventory found matching your search."
                            : "No inventory items found."}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    inventory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {item.product?.name || "Unknown Product"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {item.product?.category?.name || "No Category"}
                            </div>
                            <div className="text-xs text-muted-foreground sm:hidden">
                              SKU: {item.product?.sku || "N/A"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell font-mono text-sm">
                          {item.product?.sku || "N/A"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {item.quantityAvailable || 0}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-right text-muted-foreground">
                          {item.quantityReserved || 0}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {item.location || "N/A"}
                        </TableCell>
                        <TableCell>
                          {getStockBadge(
                            item.quantityAvailable || 0,
                            item.product?.reorderLevel || 0
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {formatDate(item.lastStockUpdate || item.updatedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleView(item)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>

                              {hasPermission(PERMISSIONS.INVENTORY_UPDATE) && (
                                <DropdownMenuItem onClick={() => handleAdjustment(item)}>
                                  <Settings className="mr-2 h-4 w-4" />
                                  Adjust Stock
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 px-4 sm:px-0 gap-4">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * 10 + 1} to{" "}
                {Math.min(currentPage * 10, totalItems)} of {totalItems} entries
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchInventory(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchInventory(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <InventoryViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        item={selectedItem}
        onAdjust={(item) => {
          setSelectedItem(item);
          setIsViewDialogOpen(false);
          setIsAdjustmentDialogOpen(true);
        }}
      />

      <InventoryAdjustmentDialog
        open={isAdjustmentDialogOpen}
        onOpenChange={setIsAdjustmentDialogOpen}
        item={selectedItem}
        onSuccess={() => {
          refresh();
          toast.success("Inventory adjusted successfully");
        }}
      />
    </div>
  );
};

export default Inventory;