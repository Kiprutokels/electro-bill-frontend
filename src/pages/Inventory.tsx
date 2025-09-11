import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Package,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Package2,
  Plus,
} from 'lucide-react';
import { 
  inventoryService, 
  InventoryItem, 
  InventoryFilters, 
  InventorySummary 
} from '@/api/services/inventory.service';
import { formatCurrency, formatDate } from '@/utils/format.utils';
import { toast } from 'sonner';
import { PERMISSIONS } from '@/lib/permissions';
import { useAuth } from '@/contexts/AuthContext';
import { InventoryViewDialog } from '@/components/inventory/InventoryViewDialog';
import { InventoryAdjustmentDialog } from '@/components/inventory/InventoryAdjustmentDialog';

export function Inventory() {
  const { hasPermission } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<InventoryFilters>({});

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const [inventoryData, summaryData] = await Promise.all([
        inventoryService.getInventory(page, limit, search, filters),
        inventoryService.getInventorySummary(),
      ]);

      setInventory(inventoryData.data);
      setTotal(inventoryData.meta.total);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to fetch inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [page, search, filters]);

  const handleRefresh = () => {
    fetchInventory();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchInventory();
  };

  const handleView = (item: InventoryItem) => {
    setSelectedItem(item);
    setViewDialogOpen(true);
  };

  const handleAdjust = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustmentDialogOpen(true);
  };

  const handleDelete = async (item: InventoryItem) => {
    if (!confirm(`Are you sure you want to delete inventory for ${item.product.name}?`)) {
      return;
    }

    try {
      await inventoryService.delete(item.id);
      toast.success('Inventory item deleted successfully');
      handleRefresh();
    } catch (error) {
      console.error('Error deleting inventory:', error);
      toast.error('Failed to delete inventory item');
    }
  };

  const getStockStatus = (available: number, minStock: number) => {
    if (available === 0) {
      return { status: 'Out of Stock', color: 'bg-red-500', textColor: 'text-red-700' };
    }
    if (available <= minStock) {
      return { status: 'Low Stock', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    }
    return { status: 'In Stock', color: 'bg-green-500', textColor: 'text-green-700' };
  };

  const totalPages = Math.ceil(total / limit);

  if (loading && !inventory.length) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Package className="h-8 w-8 mx-auto mb-2 animate-spin" />
          <p>Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage your product inventory
          </p>
        </div>
        {hasPermission(PERMISSIONS.INVENTORY.CREATE) && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                Products in inventory
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Stock</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {summary.productsInStock}
              </div>
              <p className="text-xs text-muted-foreground">
                Products available
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {summary.productsOutOfStock}
              </div>
              <p className="text-xs text-muted-foreground">
                Products unavailable
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {summary.lowStockCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Products need restock
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Products</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by product name, SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Location</Label>
              <Select
                value={filters.location || 'all'}
                onValueChange={(value) =>
                  setFilters(prev => ({ 
                    ...prev, 
                    location: value === 'all' ? undefined : value 
                  }))
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="warehouse-a">Warehouse A</SelectItem>
                  <SelectItem value="warehouse-b">Warehouse B</SelectItem>
                  <SelectItem value="store">Store</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Stock Status</Label>
              <Select
                value={filters.lowStock ? 'low' : 'all'}
                onValueChange={(value) =>
                  setFilters(prev => ({ 
                    ...prev, 
                    lowStock: value === 'low' ? true : undefined 
                  }))
                }
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="low">Low Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button type="submit">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Reserved</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((item) => {
                const available = item.quantityAvailable ?? item.quantity;
                const reserved = item.quantityReserved ?? 0;
                const status = getStockStatus(available, item.minStock);
                
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.product.category?.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {item.product.sku}
                    </TableCell>
                    <TableCell className="font-medium">
                      {available}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {reserved}
                    </TableCell>
                    <TableCell>{item.location || 'Not set'}</TableCell>
                    <TableCell>{formatCurrency(item.unitCost)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(available * item.unitCost)}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${status.color} text-white`}>
                        {status.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(item.lastStockUpdate || item.lastUpdated)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(item)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {hasPermission(PERMISSIONS.INVENTORY.UPDATE) && (
                            <DropdownMenuItem onClick={() => handleAdjust(item)}>
                              <Package className="h-4 w-4 mr-2" />
                              Adjust Stock
                            </DropdownMenuItem>
                          )}
                          {hasPermission(PERMISSIONS.INVENTORY.DELETE) && (
                            <DropdownMenuItem 
                              onClick={() => handleDelete(item)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} items
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
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
        item={selectedItem}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        onEdit={handleAdjust}
        onDelete={handleDelete}
        onAdjust={handleAdjust}
      />

      <InventoryAdjustmentDialog
        item={selectedItem}
        open={adjustmentDialogOpen}
        onOpenChange={setAdjustmentDialogOpen}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
