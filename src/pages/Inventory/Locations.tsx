import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  RefreshCw,
  Loader2,
  MapPin,
  MoreHorizontal,
  Edit,
  Power,
  ArrowLeft,
  Building2,
  Package,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS } from "@/utils/constants";
import {
  locationsService,
  WarehouseLocation,
} from "@/api/services/locations.service";
import { toast } from "sonner";
import AddLocationDialog from "@/components/inventory/AddLocationDialog";
import EditLocationDialog from "@/components/inventory/EditLocationDialog";

const Locations = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] =
    useState<WarehouseLocation | null>(null);
  const [locationToToggle, setLocationToToggle] =
    useState<WarehouseLocation | null>(null);

  const fetchLocations = async (isRefresh = false) => {
    console.log("[Locations] Fetching locations, refresh:", isRefresh);
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await locationsService.getAll(true);
      console.log("[Locations] Fetched", data.length, "locations");
      setLocations(data);
    } catch (err: any) {
      console.error("[Locations] Fetch error:", err);
      toast.error(err.response?.data?.message || "Failed to load locations");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleEdit = (location: WarehouseLocation) => {
    console.log("[Locations] Edit location:", location.code);
    setSelectedLocation(location);
    setIsEditDialogOpen(true);
  };

  const handleToggleClick = (location: WarehouseLocation) => {
    console.log("[Locations] Toggle status clicked:", location.code);
    setLocationToToggle(location);
  };

  const handleToggleConfirm = async () => {
    if (!locationToToggle) return;

    console.log("[Locations] Confirming toggle for:", locationToToggle.code);
    try {
      const updated = await locationsService.toggleStatus(locationToToggle.id);
      console.log("[Locations] Status toggled successfully");

      setLocations((prev) =>
        prev.map((loc) => (loc.id === updated.id ? updated : loc)),
      );
      toast.success(
        `Location ${updated.isActive ? "activated" : "deactivated"} successfully`,
      );
    } catch (err: any) {
      console.error("[Locations] Toggle error:", err);
      toast.error(
        err.response?.data?.message || "Failed to toggle location status",
      );
    } finally {
      setLocationToToggle(null);
    }
  };

  const handleLocationAdded = (newLocation: WarehouseLocation) => {
    console.log("[Locations] Location added:", newLocation.code);
    setLocations((prev) => [newLocation, ...prev]);
  };

  const handleLocationUpdated = (updatedLocation: WarehouseLocation) => {
    console.log("[Locations] Location updated:", updatedLocation.code);
    setLocations((prev) =>
      prev.map((loc) =>
        loc.id === updatedLocation.id ? updatedLocation : loc,
      ),
    );
  };

  if (loading && locations.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/inventory")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Inventory
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
              <MapPin className="h-6 w-6" />
              Warehouse Locations
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage warehouse locations and inventory distribution
            </p>
          </div>
        </div>
        {hasPermission(PERMISSIONS.INVENTORY_CREATE) && (
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Location
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Location List</CardTitle>
            <Button
              variant="outline"
              size="icon"
              onClick={() => fetchLocations(true)}
              disabled={refreshing}
              title="Refresh"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0 sm:p-6">
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Code</TableHead>
                    <TableHead className="min-w-[200px]">Name</TableHead>
                    <TableHead className="hidden md:table-cell">City</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Country
                    </TableHead>
                    <TableHead className="text-right">Inventory</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">
                      Batches
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right min-w-[60px]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {locations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10">
                        <div className="text-muted-foreground">
                          No locations found.
                        </div>
                        {hasPermission(PERMISSIONS.INVENTORY_CREATE) && (
                          <Button
                            variant="outline"
                            onClick={() => setIsAddDialogOpen(true)}
                            className="mt-2"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Create Your First Location
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    locations.map((location) => (
                      <TableRow key={location.id}>
                        <TableCell className="font-mono font-medium">
                          {location.code}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{location.name}</div>
                            {location.description && (
                              <div className="text-sm text-muted-foreground">
                                {location.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {location.city || "—"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {location.country || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {location._count?.inventory || 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right hidden sm:table-cell">
                          <div className="flex items-center justify-end gap-1">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {location._count?.batches || 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              location.isActive ? "default" : "secondary"
                            }
                            className={
                              location.isActive
                                ? "bg-green-500 hover:bg-green-600"
                                : ""
                            }
                          >
                            {location.isActive ? "Active" : "Inactive"}
                          </Badge>
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
                              {hasPermission(PERMISSIONS.INVENTORY_UPDATE) && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleEdit(location)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Location
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleToggleClick(location)}
                                  >
                                    <Power className="mr-2 h-4 w-4" />
                                    {location.isActive
                                      ? "Deactivate"
                                      : "Activate"}
                                  </DropdownMenuItem>
                                </>
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

      <AddLocationDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onLocationAdded={handleLocationAdded}
      />

      {selectedLocation && (
        <EditLocationDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          location={selectedLocation}
          onLocationUpdated={handleLocationUpdated}
        />
      )}

      <AlertDialog
        open={!!locationToToggle}
        onOpenChange={() => setLocationToToggle(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {locationToToggle?.isActive ? "Deactivate" : "Activate"} Location
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to{" "}
              {locationToToggle?.isActive ? "deactivate" : "activate"}{" "}
              <strong>{locationToToggle?.name}</strong>?
              {locationToToggle?.isActive &&
                " This will prevent new inventory from being assigned to this location."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleConfirm}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Locations;
