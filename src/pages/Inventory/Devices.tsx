import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, RefreshCw, Search, Smartphone, Eye, Edit, Zap, Send, AlertTriangle, RotateCcw, Power, History } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/utils/format.utils";
import { Device, DeviceStatus } from "@/api/types/device.types";
import { devicesService } from "@/api/services/devices.service";
import ViewDeviceDialog from "@/components/devices/ViewDeviceDialog";
import EditDeviceDialog from "@/components/devices/EditDeviceDialog";
import IssueDeviceDialog from "@/components/devices/IssueDeviceDialog";
import ActivateDeviceDialog from "@/components/devices/ActivateDeviceDialog";
import DeviceNoteActionDialog from "@/components/devices/DeviceNoteActionDialog";
import DeviceHistoryDialog from "@/components/devices/DeviceHistoryDialog";
import { useAuth } from "@/contexts/AuthContext";

const PAGE_SIZE_OPTIONS = [
  { label: "10", value: 10 },
  { label: "25", value: 25 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
];

const statusColor = (s: DeviceStatus) => {
  switch (s) {
    case DeviceStatus.AVAILABLE: return "bg-green-500 hover:bg-green-600";
    case DeviceStatus.ISSUED: return "bg-yellow-500 hover:bg-yellow-600";
    case DeviceStatus.ACTIVE: return "bg-blue-500 hover:bg-blue-600";
    case DeviceStatus.DAMAGED: return "bg-red-500 hover:bg-red-600";
    case DeviceStatus.RETURNED: return "bg-purple-500 hover:bg-purple-600";
    case DeviceStatus.INACTIVE: return "bg-gray-500 hover:bg-gray-600";
    default: return "";
  }
};

const Devices = () => {
  const { user } = useAuth();
  const currentUserId = user?.id;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<DeviceStatus | "all">("all");

  const [pageSize, setPageSize] = useState<number>(25);
  const [page, setPage] = useState<number>(1);

  const [devices, setDevices] = useState<Device[]>([]);
  const [total, setTotal] = useState<number>(0);

  // dialogs
  const [selectedImei, setSelectedImei] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [isActivateOpen, setIsActivateOpen] = useState(false);
  const [isNoteActionOpen, setIsNoteActionOpen] = useState(false);
  const [noteAction, setNoteAction] = useState<"DAMAGED" | "RETURNED" | "DEACTIVATE">("DAMAGED");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const fetchDevices = async (opts?: { refresh?: boolean }) => {
    const isRefresh = !!opts?.refresh;
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const effectivePage = page;

      console.log("[Devices] Fetching list:", {
        page: effectivePage,
        limit: pageSize,
        search,
        status,
      });

      const res = await devicesService.list({
        page: effectivePage,
        limit: pageSize,
        search: search.trim() || undefined,
        status: status === "all" ? undefined : status,
      });

      setDevices(res.data || []);
      setTotal(res.meta?.total ?? (res.data?.length ?? 0));
      setPage(effectivePage);
    } catch (e: any) {
      console.error("[Devices] Fetch error:", e);
      toast.error(e?.response?.data?.message || "Failed to load devices");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadFullDeviceAndOpen = async (imei: string, mode: "view" | "edit" | "issue" | "activate" | "history") => {
    try {
      console.log("[Devices] Loading full device for action:", { imei, mode });
      setSelectedImei(imei);

      const full = await devicesService.getByImei(imei);
      console.log("[Devices] Full device loaded:", full?.imeiNumber);

      setSelectedDevice(full);

      if (mode === "view") setIsViewOpen(true);
      if (mode === "edit") setIsEditOpen(true);
      if (mode === "issue") setIsIssueOpen(true);
      if (mode === "activate") setIsActivateOpen(true);
      if (mode === "history") setIsHistoryOpen(true);
    } catch (err: any) {
      console.error("[Devices] Load full device error:", err);
      toast.error(err?.response?.data?.message || "Failed to load device details");
    }
  };

  const doRefreshAfterAction = async () => {
    console.log("[Devices] Refresh after action");
    await fetchDevices({ refresh: true });

    if (selectedImei) {
      try {
        const full = await devicesService.getByImei(selectedImei);
        setSelectedDevice(full);
      } catch (e) {
        console.warn("[Devices] Could not refresh selected device", e);
      }
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchDevices(), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, pageSize, page]);

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = total === 0 ? 0 : Math.min(page * pageSize, total);

  if (loading && devices.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading devices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
          <Smartphone className="h-6 w-6" />
          Devices
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Unit-level inventory (IMEIs) — status, activation, history
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <CardTitle>Device List</CardTitle>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => { setPage(1); setSearch(e.target.value); }}
                  placeholder="Search IMEI / Serial / MAC / product..."
                  className="pl-10"
                />
              </div>

              <Select
                value={status}
                onValueChange={(v) => { setPage(1); setStatus(v as any); }}
              >
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.values(DeviceStatus).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={String(pageSize)}
                onValueChange={(v) => { setPage(1); setPageSize(Number(v)); }}
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
                onClick={() => fetchDevices({ refresh: true })}
                disabled={refreshing}
                title="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 sm:p-6">
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[170px]">IMEI</TableHead>
                    <TableHead className="min-w-[220px]">Product</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Batch</TableHead>
                    <TableHead className="hidden md:table-cell">Created</TableHead>
                    <TableHead className="text-right min-w-[220px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {devices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">
                        <div className="text-muted-foreground">No devices found.</div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    devices.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-mono font-medium">{d.imeiNumber}</TableCell>

                        <TableCell>
                          <div>
                            <div className="font-medium">{d.product?.name || d.productId}</div>
                            <div className="text-sm text-muted-foreground font-mono">
                              SKU: {d.product?.sku || "N/A"}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge className={statusColor(d.status)} variant="default">
                            {d.status}
                          </Badge>
                        </TableCell>

                        <TableCell className="hidden md:table-cell font-mono">
                          {d.batch?.batchNumber || "—"}
                        </TableCell>

                        <TableCell className="hidden md:table-cell">
                          {formatDate(d.createdAt)}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex justify-end flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => loadFullDeviceAndOpen(d.imeiNumber, "view")}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => loadFullDeviceAndOpen(d.imeiNumber, "edit")}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => loadFullDeviceAndOpen(d.imeiNumber, "history")}
                            >
                              <History className="h-4 w-4 mr-1" />
                              History
                            </Button>

                            {d.status === DeviceStatus.AVAILABLE && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => loadFullDeviceAndOpen(d.imeiNumber, "issue")}
                                disabled={!currentUserId}
                                title={!currentUserId ? "No current user ID in auth context" : undefined}
                              >
                                <Send className="h-4 w-4 mr-1" />
                                Issue
                              </Button>
                            )}

                            {(d.status === DeviceStatus.AVAILABLE || d.status === DeviceStatus.ISSUED) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => loadFullDeviceAndOpen(d.imeiNumber, "activate")}
                              >
                                <Zap className="h-4 w-4 mr-1" />
                                Activate
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                await loadFullDeviceAndOpen(d.imeiNumber, "view");
                                setNoteAction("DAMAGED");
                                setIsNoteActionOpen(true);
                              }}
                            >
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              Damaged
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                await loadFullDeviceAndOpen(d.imeiNumber, "view");
                                setNoteAction("RETURNED");
                                setIsNoteActionOpen(true);
                              }}
                            >
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Returned
                            </Button>

                            {d.status === DeviceStatus.ACTIVE && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  await loadFullDeviceAndOpen(d.imeiNumber, "view");
                                  setNoteAction("DEACTIVATE");
                                  setIsNoteActionOpen(true);
                                }}
                              >
                                <Power className="h-4 w-4 mr-1" />
                                Deactivate
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
          </div>

          {total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 px-4 sm:px-0 gap-4">
              <p className="text-sm text-muted-foreground">
                Showing {from} to {to} of {total} entries
              </p>

              {totalPages > 1 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View */}
      <ViewDeviceDialog
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        device={selectedDevice}
        onEdit={() => setIsEditOpen(true)}
        onViewHistory={() => setIsHistoryOpen(true)}
        onIssue={() => setIsIssueOpen(true)}
        onActivate={() => setIsActivateOpen(true)}
        onDamaged={() => { setNoteAction("DAMAGED"); setIsNoteActionOpen(true); }}
        onReturned={() => { setNoteAction("RETURNED"); setIsNoteActionOpen(true); }}
        onDeactivate={() => { setNoteAction("DEACTIVATE"); setIsNoteActionOpen(true); }}
      />

      {/* Edit */}
      <EditDeviceDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        device={selectedDevice}
        onUpdated={async (d) => {
          setSelectedDevice(d);
          await doRefreshAfterAction();
        }}
      />

      {/* Issue */}
      <IssueDeviceDialog
        open={isIssueOpen}
        onOpenChange={setIsIssueOpen}
        device={selectedDevice}
        currentUserId={currentUserId || ""}
        onIssued={async (d) => {
          setSelectedDevice(d);
          await doRefreshAfterAction();
        }}
      />

      {/* Activate */}
      <ActivateDeviceDialog
        open={isActivateOpen}
        onOpenChange={setIsActivateOpen}
        device={selectedDevice}
        onActivated={async (d) => {
          setSelectedDevice(d);
          await doRefreshAfterAction();
        }}
      />

      {/* Status Note Actions */}
      <DeviceNoteActionDialog
        open={isNoteActionOpen}
        onOpenChange={setIsNoteActionOpen}
        device={selectedDevice}
        action={noteAction}
        onConfirm={async (notes?: string) => {
          if (!selectedDevice) return;

          if (noteAction === "DAMAGED") {
            await devicesService.damaged(selectedDevice.imeiNumber, notes);
          }
          if (noteAction === "RETURNED") {
            await devicesService.returned(selectedDevice.imeiNumber, notes);
          }
          if (noteAction === "DEACTIVATE") {
            await devicesService.deactivate(selectedDevice.imeiNumber, notes);
          }

          await doRefreshAfterAction();
        }}
      />

      {/* History */}
      <DeviceHistoryDialog
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        device={selectedDevice}
      />
    </div>
  );
};

export default Devices;