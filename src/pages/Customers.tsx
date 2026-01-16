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
  Filter,
  Users,
  Phone,
  Mail,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Loader2,
  RefreshCw,
  MapPin,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS } from "@/utils/constants";
import { customersService, Customer } from "@/api/services/customers.service";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import AddCustomerDialog from "@/components/customers/AddCustomerDialog";
import EditCustomerDialog from "@/components/customers/EditCustomerDialog";
import CustomerViewDialog from "@/components/customers/CustomerViewDialog";

const Customers = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null
  );

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const limit = 10;

  const fetchCustomers = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await customersService.getCustomers({
        page: currentPage,
        limit,
        search: debouncedSearchTerm || undefined,
        includeInactive,
      });

      setCustomers(response.data);
      setTotalPages(response.meta.totalPages);
      setTotalCustomers(response.meta.total);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to fetch customers";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchCustomers();
  }, [currentPage, debouncedSearchTerm, includeInactive]);

  // Handlers
  const handleRefresh = () => {
    fetchCustomers(true);
  };

  // const handleView = (customer: Customer) => {
  //   setSelectedCustomer(customer);
  //   setIsViewDialogOpen(true);
  // };

  const handleView = (customer: Customer) => {
    navigate(`/customers/${customer.id}/detail`);
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;

    try {
      await customersService.deleteCustomer(customerToDelete.id);
      toast.success("Customer deleted successfully");
      fetchCustomers();
      setCustomerToDelete(null);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to delete customer";
      toast.error(errorMessage);
    }
  };

  const handleToggleStatus = async (customer: Customer) => {
    try {
      await customersService.toggleCustomerStatus(customer.id);
      toast.success(
        `Customer ${
          customer.isActive ? "deactivated" : "activated"
        } successfully`
      );
      fetchCustomers();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to update customer status";
      toast.error(errorMessage);
    }
  };

  const handleCustomerAdded = (newCustomer: Customer) => {
    setCustomers((prev) => [newCustomer, ...prev]);
    setTotalCustomers((prev) => prev + 1);
    toast.success("Customer added successfully");
  };

  const handleCustomerUpdated = (updatedCustomer: Customer) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c))
    );
    toast.success("Customer updated successfully");
  };

  const getStatusBadge = (customer: Customer) => {
    if (!customer.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }

    const balance = customer.currentBalance || 0;
    const creditLimit = customer.creditLimit || 0;

    if (balance > creditLimit && creditLimit > 0) {
      return <Badge variant="destructive">Credit Exceeded</Badge>;
    } else if (balance > creditLimit * 0.8 && creditLimit > 0) {
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-600">Near Limit</Badge>
      );
    } else {
      return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const activeCustomers = customers.filter((c) => c.isActive);
    const totalOutstanding = customers.reduce(
      (sum, c) => sum + (c.currentBalance || 0),
      0
    );

    return {
      totalCustomers,
      activeCustomers: activeCustomers.length,
      totalOutstanding,
    };
  }, [customers, totalCustomers]);

  if (loading && customers.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading customers...</p>
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
            Customer Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your customer database and relationships
          </p>
        </div>
        {hasPermission(PERMISSIONS.CUSTOMERS_CREATE) && (
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Customers
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {stats.totalCustomers}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.activeCustomers} active
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {stats.activeCustomers}
            </div>
            <p className="text-xs text-muted-foreground">
              {(
                (stats.activeCustomers / Math.max(stats.totalCustomers, 1)) *
                100
              ).toFixed(1)}
              % of total
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              KES {stats.totalOutstanding.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Customer Directory</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIncludeInactive(!includeInactive)}
                title={
                  includeInactive ? "Show active only" : "Show all customers"
                }
              >
                <Filter
                  className={`h-4 w-4 ${includeInactive ? "text-primary" : ""}`}
                />
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
                  <TableHead className="min-w-[200px]">Customer</TableHead>
                  <TableHead className="hidden sm:table-cell min-w-[150px]">
                    Contact Info
                  </TableHead>
                  <TableHead className="hidden lg:table-cell min-w-[100px]">
                    Location
                  </TableHead>
                  <TableHead className="text-right min-w-[100px]">
                    Credit Limit
                  </TableHead>
                  <TableHead className="text-right min-w-[100px]">
                    Balance
                  </TableHead>
                  <TableHead className="min-w-[80px]">Status</TableHead>
                  <TableHead className="text-right min-w-[100px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm
                          ? "No customers found matching your search."
                          : "No customers found."}
                      </div>
                      {hasPermission(PERMISSIONS.CUSTOMERS_CREATE) &&
                        !searchTerm && (
                          <Button
                            variant="outline"
                            onClick={() => setIsAddDialogOpen(true)}
                            className="mt-2"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Your First Customer
                          </Button>
                        )}
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {customer.businessName ||
                              customer.contactPerson ||
                              "No Name"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {customer.customerCode}
                          </div>
                          <div className="text-sm text-muted-foreground sm:hidden">
                            <div className="flex items-center mt-1">
                              <Phone className="mr-1 h-3 w-3" />
                              {customer.phone}
                            </div>
                            {customer.email && (
                              <div className="flex items-center">
                                <Mail className="mr-1 h-3 w-3" />
                                {customer.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Phone className="mr-1 h-3 w-3 text-muted-foreground" />
                            {customer.phone}
                          </div>
                          {customer.email && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Mail className="mr-1 h-3 w-3" />
                              {customer.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {customer.city && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="mr-1 h-3 w-3" />
                            {customer.city}, {customer.country}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        KES {customer.creditLimit.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            customer.currentBalance &&
                            customer.currentBalance > 0
                              ? "text-red-600 font-medium"
                              : "text-green-600"
                          }
                        >
                          KES {(customer.currentBalance || 0).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(customer)}</TableCell>
                      {/* <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleView(customer)}
                            className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3"
                          >
                            <Eye className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">View</span>
                          </Button>
                          
                          {hasPermission(PERMISSIONS.CUSTOMERS_UPDATE) && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEdit(customer)}
                              className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3"
                            >
                              <Edit className="h-4 w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Edit</span>
                            </Button>
                          )}

                          {hasPermission(PERMISSIONS.CUSTOMERS_DELETE) && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteClick(customer)}
                              className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Delete</span>
                            </Button>
                          )}
                        </div>
                      </TableCell> */}

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(customer)}
                            className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3"
                          >
                            <Eye className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">View</span>
                          </Button>

                          {hasPermission(PERMISSIONS.CUSTOMERS_UPDATE) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(customer)}
                              className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3"
                            >
                              <Edit className="h-4 w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Edit</span>
                            </Button>
                          )}

                          {hasPermission(PERMISSIONS.CUSTOMERS_DELETE) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(customer)}
                              className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3 text-destructive hover:text-destructive"
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} • {totalCustomers} total
                customers
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddCustomerDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onCustomerAdded={handleCustomerAdded}
      />

      {selectedCustomer && (
        <>
          <EditCustomerDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            customer={selectedCustomer}
            onCustomerUpdated={handleCustomerUpdated}
          />

          <CustomerViewDialog
            open={isViewDialogOpen}
            onOpenChange={setIsViewDialogOpen}
            customer={selectedCustomer}
            onEdit={() => {
              setIsViewDialogOpen(false);
              setIsEditDialogOpen(true);
            }}
            onToggleStatus={() => handleToggleStatus(selectedCustomer)}
          />
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!customerToDelete}
        onOpenChange={() => setCustomerToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "
              {customerToDelete?.businessName ||
                customerToDelete?.contactPerson}
              "? This action cannot be undone and will fail if the customer has
              related records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Customer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Customers;
