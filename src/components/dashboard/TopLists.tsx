import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TopProduct, TopCustomer } from "@/api/types/dashboard.types";
import { formatCurrency, formatNumber } from "@/utils/format.utils";
import { TrendingUp, Users } from "lucide-react";

interface TopListsProps {
  topProducts: TopProduct[];
  topCustomers: TopCustomer[];
}

export const TopLists = ({ topProducts, topCustomers }: TopListsProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Products */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Top Selling Products
          </CardTitle>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty Sold</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8">
                      <div className="text-muted-foreground">
                        No sales data available.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  topProducts.slice(0, 5).map((item, index) => (
                    <TableRow key={item.product?.sku || index}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {item.product?.name || "Unknown Product"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            SKU: {item.product?.sku || "N/A"}
                          </div>
                          {item.product?.category && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {item.product.category.name}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">
                          {formatNumber(item.totalQuantitySold)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.totalOrders} orders
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.revenue)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Top Customers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Top Customers
          </CardTitle>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Invoices</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8">
                      <div className="text-muted-foreground">
                        No customer data available.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  topCustomers.slice(0, 5).map((item, index) => (
                    <TableRow key={item.customer?.customerCode || index}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {item.customer?.businessName || 
                             item.customer?.contactPerson || 
                             "Unknown Customer"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Code: {item.customer?.customerCode || "N/A"}
                          </div>
                          {item.customer?.currentBalance && (
                            <div className={`text-xs ${
                              Number(item.customer.currentBalance) > 0 
                                ? 'text-red-500' 
                                : 'text-green-500'
                            }`}>
                              Balance: {formatCurrency(Number(item.customer.currentBalance))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.totalInvoices}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.totalRevenue)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
