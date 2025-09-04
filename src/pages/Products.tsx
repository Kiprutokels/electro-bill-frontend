import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, Filter, Package, AlertTriangle } from 'lucide-react';

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock product data - replace with real API calls
  const products = [
    {
      id: 1,
      sku: 'TPL-AC1200',
      name: 'TP-Link Archer C6 AC1200 Wireless Router',
      category: 'Routers',
      brand: 'TP-Link',
      stock: 15,
      reorderLevel: 10,
      buyingPrice: 4500,
      sellingPrice: 6500,
      status: 'Active'
    },
    {
      id: 2,
      sku: 'CAT6-5M',
      name: 'Cat6 Ethernet Cable 5M',
      category: 'Cables',
      brand: 'Generic',
      stock: 5,
      reorderLevel: 25,
      buyingPrice: 150,
      sellingPrice: 250,
      status: 'Low Stock'
    },
    {
      id: 3,
      sku: 'PWR-EXT-5M',
      name: 'Power Extension Cable 5M',
      category: 'Accessories',
      brand: 'Generic',
      stock: 2,
      reorderLevel: 15,
      buyingPrice: 800,
      sellingPrice: 1200,
      status: 'Critical'
    },
    {
      id: 4,
      sku: 'ADPT-USB-C',
      name: 'USB-C to HDMI Adapter',
      category: 'Adapters',
      brand: 'Anker',
      stock: 25,
      reorderLevel: 10,
      buyingPrice: 1200,
      sellingPrice: 1800,
      status: 'Active'
    },
  ];

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string, stock: number, reorderLevel: number) => {
    if (stock <= reorderLevel / 2) {
      return <Badge variant="destructive">Critical</Badge>;
    } else if (stock <= reorderLevel) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Low Stock</Badge>;
    } else {
      return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
    }
  };

  const stats = {
    totalProducts: products.length,
    lowStock: products.filter(p => p.stock <= p.reorderLevel).length,
    totalValue: products.reduce((sum, p) => sum + (p.stock * p.buyingPrice), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Product Management</h1>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Stock Items
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.lowStock}
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
            <div className="text-2xl font-bold text-foreground">
              KES {stats.totalValue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
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
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Buying Price</TableHead>
                  <TableHead className="text-right">Selling Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.sku}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{product.brand}</TableCell>
                    <TableCell className="text-right">
                      <span className={product.stock <= product.reorderLevel ? 'text-red-600 font-medium' : ''}>
                        {product.stock}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">KES {product.buyingPrice.toLocaleString()}</TableCell>
                    <TableCell className="text-right">KES {product.sellingPrice.toLocaleString()}</TableCell>
                    <TableCell>
                      {getStatusBadge(product.status, product.stock, product.reorderLevel)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Products;