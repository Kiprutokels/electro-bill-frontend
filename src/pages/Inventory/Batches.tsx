import { useState, useMemo } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  RefreshCw,
  Loader2,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Package,
  Calendar,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS } from "@/utils/constants";
import { ProductBatch, productBatchesService } from "@/api/services/productBatches.service";
import { formatCurrency, formatDate } from "@/utils/format.utils";
import { useProductBatches } from "@/hooks/useProductBatches";
import AddProductBatchDialog from "@/components/inventory/AddProductBatchDialog";
import EditProductBatchDialog from "@/components/inventory/EditProductBatchDialog";
import ProductBatchViewDialog from "@/components/inventory/ProductBatchViewDialog";
import { toast } from "sonner";

const PAGE_SIZE_OPTIONS = [
  { label: "10", value: 10 },
  { label: "25", value: 25 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
];

const ProductBatches = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const {
    batches,
    loading,
    error,
    refreshing,
    currentPage,
    totalPages,
    totalItems,
    searchTerm,
    pageSize,
    fetchBatches,
    refresh,
    updateSearch,
    updatePageSize,
    addBatchToList,
    updateBatchInList,
    removeBatchFromList,
  } = useProductBatches();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<ProductBatch | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<ProductBatch | null>(null);

  const handleView = (batch: ProductBatch) => {
    setSelectedBatch(batch);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (batch: ProductBatch) => {
    setSelectedBatch(batch);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (batch: ProductBatch) => {
    setBatchToDelete(batch);
  };

  const handleDeleteConfirm = async () => {
    if (!batchToDelete) return;

    try {
      await productBatchesService.delete(batchToDelete.id);
      removeBatchFromList(batchToDelete.id);
      setBatchToDelete(null);
      toast.success("Product batch deleted successfully");
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to delete batch";
      toast.error(errorMessage);
    }
  };

  const handleBatchAdded = (newBatch: ProductBatch) => addBatchToList(newBatch);
  const handleBatchUpdated = (updatedBatch: ProductBatch) => updateBatchInList(updatedBatch);

  const getBatchStatusBadge = (batch: ProductBatch) => {
    const now = new Date();
    const expiryDate = batch.expiryDate ? new Date(batch.expiryDate) : null;
    const totalAvailable = batch.inventory.reduce((sum, inv) => sum + inv.quantityAvailable, 0);

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
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilExpiry <= 30) {
        return (
          <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
            <Calendar className="w-3 h-3 mr-1" />
            Expires Soon
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

  // Calculate stats
  const stats = useMemo(() => {
    const totalBatches = totalItems;
    const activeBatches = batches.filter(batch =>
      batch.inventory.some(inv => inv.quantityAvailable > 0)
    ).length;

    const expiredBatches = batches.filter(batch => {
      const expiryDate = batch.expiryDate ? new Date(batch.expiryDate) : null;
      return expiryDate && expiryDate < new Date();
    }).length;

    const totalValue = batches.reduce((sum, batch) => {
      const totalQuantity = batch.inventory.reduce((invSum, inv) => invSum + inv.quantityAvailable, 0);
      return sum + (totalQuantity * Number(batch.buyingPrice));
    }, 0);

    return { totalBatches, activeBatches, expiredBatches, totalValue };
  }, [batches, totalItems]);

  const pageLimitForDisplay = pageSize < 0 ? totalItems : pageSize;
  const from = totalItems === 0 ? 0 : (pageSize < 0 ? 1 : (currentPage - 1) * pageLimitForDisplay + 1);
  const to = totalItems === 0 ? 0 : (pageSize < 0 ? totalItems : Math.min(currentPage * pageLimitForDisplay, totalItems));

  if (loading && batches.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading batches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/inventory")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Inventory
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Product Batches
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage product batch information and stock levels
            </p>
          </div>
        </div>
        {hasPermission(PERMISSIONS.INVENTORY_CREATE) && (
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Batch
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Batches
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.totalBatches}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Batches
            </CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.activeBatches}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expired Batches
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.expiredBatches}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(stats.totalValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Product Batches</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search batches..."
                  value={searchTerm}
                  onChange={(e) => updateSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select
                value={String(pageSize)}
                onValueChange={(v) => updatePageSize(Number(v))}
              >
                <SelectTrigger className="w-full sm:w-28">
                  <SelectValue placeholder="Page size" />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
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
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 sm:p-6">
          {error && (
            <div className="mb-4 mx-4 sm:mx-0 p-4 border border-destructive/20 rounded-lg bg-destructive/5">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={refresh} className="mt-2">
                Try Again
              </Button>
            </div>
          )}

          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Batch #</TableHead>
                    <TableHead className="min-w-[200px]">Product</TableHead>
                    <TableHead className="hidden sm:table-cell">Received</TableHead>
                    <TableHead className="hidden md:table-cell">Expiry</TableHead>
                    <TableHead className="text-right min-w-[100px]">Available</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">Unit Cost</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="text-right min-w-[60px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {batches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {searchTerm
                            ? "No batches found matching your search."
                            : "No product batches found."}
                        </div>
                        {hasPermission(PERMISSIONS.INVENTORY_CREATE) && !searchTerm && (
                          <Button
                            variant="outline"
                            onClick={() => setIsAddDialogOpen(true)}
                            className="mt-2"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Create Your First Batch
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    batches.map((batch) => {
                      const totalAvailable = batch.inventory.reduce(
                        (sum, inv) => sum + inv.quantityAvailable,
                        0
                      );

                      return (
                        <TableRow key={batch.id}>
                          <TableCell className="font-medium font-mono">
                            {batch.batchNumber}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {batch.product?.name || "Unknown Product"}
                              </div>
                              <div className="text-sm text-muted-foreground font-mono">
                                SKU: {batch.product?.sku || "N/A"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {formatDate(batch.receivedDate)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {batch.expiryDate ? formatDate(batch.expiryDate) : "No expiry"}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {totalAvailable} / {batch.quantityReceived}
                          </TableCell>
                          <TableCell className="text-right hidden lg:table-cell">
                            {formatCurrency(Number(batch.buyingPrice))}
                          </TableCell>
                          <TableCell>{getBatchStatusBadge(batch)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleView(batch)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>

                                {hasPermission(PERMISSIONS.INVENTORY_UPDATE) && (
                                  <DropdownMenuItem onClick={() => handleEdit(batch)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Batch
                                  </DropdownMenuItem>
                                )}

                                {hasPermission(PERMISSIONS.INVENTORY_DELETE) &&
                                  totalAvailable === 0 && (
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteClick(batch)}
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
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 px-4 sm:px-0 gap-4">
              <p className="text-sm text-muted-foreground">
                Showing {from} to {to} of {totalItems} entries
              </p>

              {pageSize >= 0 && totalPages > 1 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchBatches(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchBatches(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AddProductBatchDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onBatchAdded={handleBatchAdded}
      />

      {selectedBatch && (
        <>
          <EditProductBatchDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            batch={selectedBatch}
            onBatchUpdated={handleBatchUpdated}
          />

          <ProductBatchViewDialog
            open={isViewDialogOpen}
            onOpenChange={setIsViewDialogOpen}
            batch={selectedBatch}
            onEdit={() => {
              setIsViewDialogOpen(false);
              setIsEditDialogOpen(true);
            }}
          />
        </>
      )}

      <AlertDialog open={!!batchToDelete} onOpenChange={() => setBatchToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product Batch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete batch "{batchToDelete?.batchNumber}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Batch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductBatches;