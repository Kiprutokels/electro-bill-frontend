import { useState } from "react";
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
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Loader2,
  PlayCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS } from "@/utils/constants";
import {
  Subscription,
  SubscriptionStatus,
} from "@/api/services/subscriptions.service";
import { formatDate } from "@/utils/format.utils";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useSubscriptionActions } from "@/hooks/useSubscriptionActions";
import AddSubscriptionDialog from "@/components/subscriptions/AddSubscriptionDialog";
import EditSubscriptionDialog from "@/components/subscriptions/EditSubscriptionDialog";
import SubscriptionViewDialog from "@/components/subscriptions/SubscriptionViewDialog";
import { toast } from "sonner";
import TableToolbar from "@/components/shared/TableToolbar";
import PaginationFooter from "@/components/shared/PaginationFooter";

const PAGE_SIZE_OPTIONS = [
  { label: "10", value: 10 },
  { label: "25", value: 25 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
];

const Subscriptions = () => {
  const { hasPermission } = useAuth();
  const {
    subscriptions,
    loading,
    error,
    refreshing,
    currentPage,
    totalPages,
    totalItems,
    searchTerm,
    filters,
    stats,
    pageSize,
    fetchSubscriptions,
    refresh,
    updateSearch,
    updateFilters,
    updatePageSize,
    updateSubscriptionInList,
    removeSubscriptionFromList,
  } = useSubscriptions();

  const {
    loading: actionLoading,
    cancelSubscription,
    deleteSubscription,
    checkExpiry,
  } = useSubscriptionActions();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const [subscriptionToDelete, setSubscriptionToDelete] =
    useState<Subscription | null>(null);
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);

  const [expiryCheckLoading, setExpiryCheckLoading] = useState(false);

  const handleView = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (subscription: Subscription) => {
    setSubscriptionToDelete(subscription);
  };

  const handleDeleteConfirm = async () => {
    if (!subscriptionToDelete) return;
    try {
      await deleteSubscription(subscriptionToDelete.id);
      removeSubscriptionFromList(subscriptionToDelete.id);
      setSubscriptionToDelete(null);
    } catch {
      // handled in hook
    }
  };

  const handleCancel = async (subscription: Subscription) => {
    try {
      const updated = await cancelSubscription(subscription.id);
      updateSubscriptionInList(updated);
    } catch {
      // handled in hook
    }
  };

  const handleSubscriptionAdded = () => {
    fetchSubscriptions(1);
  };

  const handleSubscriptionUpdated = (updated: Subscription) => {
    updateSubscriptionInList(updated);
  };

  const handleStatusFilterChange = (value: string) => {
    if (value === "all") {
      const { status, ...restFilters } = filters as any;
      updateFilters(restFilters);
    } else {
      updateFilters({ ...filters, status: value as SubscriptionStatus });
    }
  };

  const handleDeviceImeiFilterChange = (v: string) => {
    const t = v.trim();
    if (!t) {
      const { deviceImei, ...rest } = filters as any;
      updateFilters(rest);
      return;
    }
    updateFilters({ ...filters, deviceImei: t });
  };

  const handleManualExpiryCheck = async () => {
    setExpiryCheckLoading(true);
    try {
      await checkExpiry();
      toast.success("Expiry check completed successfully", {
        description: "All subscription statuses have been updated.",
      });
      refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to run expiry check");
    } finally {
      setExpiryCheckLoading(false);
    }
  };

  const getStatusBadge = (status: SubscriptionStatus) => {
    const configs = {
      [SubscriptionStatus.ACTIVE]: {
        variant: "default" as const,
        icon: CheckCircle,
        className: "bg-green-500 text-white hover:bg-green-600",
      },
      [SubscriptionStatus.EXPIRING_SOON]: {
        variant: "default" as const,
        icon: AlertTriangle,
        className: "bg-yellow-500 text-white hover:bg-yellow-600",
      },
      [SubscriptionStatus.EXPIRED]: {
        variant: "destructive" as const,
        icon: XCircle,
        className: "bg-red-500 text-white hover:bg-red-600",
      },
      [SubscriptionStatus.CANCELLED]: {
        variant: "secondary" as const,
        icon: XCircle,
        className: "bg-gray-500 text-white",
      },
      [SubscriptionStatus.SUSPENDED]: {
        variant: "secondary" as const,
        icon: Clock,
        className: "bg-orange-500 text-white",
      },
    };

    const config = configs[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace(/_/g, " ")}
      </Badge>
    );
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading && subscriptions.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading subscriptions...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Subscriptions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage customer subscriptions and renewals
          </p>
        </div>
        <div className="flex gap-2">
          {hasPermission(PERMISSIONS.SUBSCRIPTIONS_UPDATE) && (
            <Button
              onClick={handleManualExpiryCheck}
              variant="outline"
              disabled={expiryCheckLoading}
            >
              {expiryCheckLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Run Expiry Check
                </>
              )}
            </Button>
          )}
          {hasPermission(PERMISSIONS.SUBSCRIPTIONS_CREATE) && (
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Subscription
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Subscriptions
            </CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats?.total || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats?.active || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expiring Soon
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats?.expiringSoon || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expired
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats?.expired || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <TableToolbar
            title="Subscription Management"
            searchPlaceholder="Search subscriptions, customer, product, IMEI..."
            searchValue={searchTerm}
            onSearchChange={updateSearch}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageSizeChange={updatePageSize}
            refreshing={refreshing}
            onRefresh={refresh}
            rightSlot={
              <>
                <Select
                  value={filters.status || "all"}
                  onValueChange={handleStatusFilterChange}
                >
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {Object.values(SubscriptionStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="w-full sm:w-56">
                  <Input
                    placeholder="Filter by Device IMEI..."
                    defaultValue={(filters as any).deviceImei || ""}
                    onChange={(e) =>
                      handleDeviceImeiFilterChange(e.target.value)
                    }
                  />
                </div>
              </>
            }
          />
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
                    <TableHead className="min-w-[140px]">
                      Subscription #
                    </TableHead>
                    <TableHead className="min-w-[200px]">Customer</TableHead>
                    <TableHead className="min-w-[200px]">Product</TableHead>
                    <TableHead className="min-w-[160px]">Device IMEI</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Start Date
                    </TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead className="text-center">Days Left</TableHead>
                    <TableHead className="min-w-[110px]">Status</TableHead>
                    <TableHead className="text-right min-w-[60px]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {subscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {searchTerm
                            ? "No subscriptions found matching your search."
                            : "No subscriptions found."}
                        </div>
                        {hasPermission(PERMISSIONS.SUBSCRIPTIONS_CREATE) &&
                          !searchTerm && (
                            <Button
                              variant="outline"
                              onClick={() => setIsAddDialogOpen(true)}
                              className="mt-2"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add Your First Subscription
                            </Button>
                          )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    subscriptions.map((subscription) => {
                      const daysLeft = getDaysUntilExpiry(
                        subscription.expiryDate,
                      );
                      return (
                        <TableRow key={subscription.id}>
                          <TableCell className="font-medium font-mono">
                            {subscription.subscriptionNumber}
                          </TableCell>

                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {subscription.customer?.businessName ||
                                  subscription.customer?.contactPerson ||
                                  "N/A"}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {subscription.customer?.email || "N/A"}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {subscription.product?.name || "N/A"}
                              </div>
                              <div className="text-sm text-muted-foreground font-mono">
                                SKU: {subscription.product?.sku || "N/A"}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="font-mono text-sm">
                            {subscription.deviceImei
                              ? subscription.deviceImei
                              : "—"}
                          </TableCell>

                          <TableCell className="hidden sm:table-cell">
                            {formatDate(subscription.startDate)}
                          </TableCell>

                          <TableCell>
                            {formatDate(subscription.expiryDate)}
                          </TableCell>

                          <TableCell className="text-center">
                            <Badge
                              variant={
                                daysLeft < 0
                                  ? "destructive"
                                  : daysLeft <= 7
                                    ? "default"
                                    : "outline"
                              }
                              className={
                                daysLeft < 0
                                  ? "bg-red-500"
                                  : daysLeft <= 7
                                    ? "bg-yellow-500"
                                    : ""
                              }
                            >
                              {daysLeft < 0 ? "Expired" : `${daysLeft} days`}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            {getStatusBadge(subscription.status)}
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
                                <DropdownMenuItem
                                  onClick={() => handleView(subscription)}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>

                                {hasPermission(
                                  PERMISSIONS.SUBSCRIPTIONS_UPDATE,
                                ) &&
                                  subscription.status !==
                                    SubscriptionStatus.CANCELLED && (
                                    <DropdownMenuItem
                                      onClick={() => handleEdit(subscription)}
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                  )}

                                {hasPermission(
                                  PERMISSIONS.SUBSCRIPTIONS_UPDATE,
                                ) &&
                                  subscription.status ===
                                    SubscriptionStatus.ACTIVE && (
                                    <DropdownMenuItem
                                      onClick={() => handleCancel(subscription)}
                                      className="text-orange-600"
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Cancel
                                    </DropdownMenuItem>
                                  )}

                                {hasPermission(
                                  PERMISSIONS.SUBSCRIPTIONS_DELETE,
                                ) && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleDeleteClick(subscription)
                                    }
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

          <PaginationFooter
            totalItems={totalItems}
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            loading={loading}
            onPrev={() => fetchSubscriptions(currentPage - 1)}
            onNext={() => fetchSubscriptions(currentPage + 1)}
          />
        </CardContent>
      </Card>

      <AddSubscriptionDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubscriptionAdded={handleSubscriptionAdded}
      />

      {selectedSubscription && (
        <>
          <EditSubscriptionDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            subscription={selectedSubscription}
            onSubscriptionUpdated={handleSubscriptionUpdated}
          />

          <SubscriptionViewDialog
            open={isViewDialogOpen}
            onOpenChange={setIsViewDialogOpen}
            subscription={selectedSubscription}
            onEdit={() => {
              setIsViewDialogOpen(false);
              setIsEditDialogOpen(true);
            }}
            onCancel={handleCancel}
          />
        </>
      )}

      <AlertDialog
        open={!!subscriptionToDelete}
        onOpenChange={() => setSubscriptionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete subscription "
              {subscriptionToDelete?.subscriptionNumber}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Subscriptions;
