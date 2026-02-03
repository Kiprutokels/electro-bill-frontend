import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
  Smartphone,
  Package,
} from "lucide-react";
import apiClient from "@/api/client/axios";
import { Device, DeviceStatus } from "@/api/types/device.types";
import { formatDate } from "@/utils/format.utils";
import { toast } from "sonner";

interface BatchDevicesResponse {
  batch: {
    id: string;
    batchNumber: string;
    productId: string;
    quantityReceived: number;
    product: {
      id: string;
      name: string;
      sku: string;
      isImeiTracked: boolean;
    };
  };
  message?: string;
  devices: Device[];
  totalDevices: number;
  statusSummary: Record<DeviceStatus, number>;
}

const statusColor = (s: DeviceStatus) => {
  switch (s) {
    case DeviceStatus.AVAILABLE:
      return "bg-green-500 hover:bg-green-600";
    case DeviceStatus.ISSUED:
      return "bg-yellow-500 hover:bg-yellow-600";
    case DeviceStatus.ACTIVE:
      return "bg-blue-500 hover:bg-blue-600";
    case DeviceStatus.DAMAGED:
      return "bg-red-500 hover:bg-red-600";
    case DeviceStatus.RETURNED:
      return "bg-purple-500 hover:bg-purple-600";
    case DeviceStatus.INACTIVE:
      return "bg-gray-500 hover:bg-gray-600";
    default:
      return "";
  }
};

const BatchDevices = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<BatchDevicesResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchBatchDevices = async (refresh = false) => {
    if (!batchId) return;

    console.log(
      "[BatchDevices] Fetching devices for batch:",
      batchId,
      "status:",
      statusFilter,
    );

    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const res = await apiClient.get<BatchDevicesResponse>(
        `/product-batches/${batchId}/devices`,
        { params: { status: statusFilter } },
      );

      console.log("[BatchDevices] Fetched", res.data.totalDevices, "devices");
      setData(res.data);
    } catch (err: any) {
      console.error("[BatchDevices] Fetch error:", err);
      toast.error(
        err?.response?.data?.message || "Failed to load batch devices",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBatchDevices();
  }, [batchId, statusFilter]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading batch devices...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate("/inventory/batches")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Batches
        </Button>
        <div className="text-center py-10 text-muted-foreground">
          Batch not found
        </div>
      </div>
    );
  }

  const { batch, devices, totalDevices, statusSummary, message } = data;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/inventory/batches")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
          <Smartphone className="h-6 w-6" />
          Batch Devices: {batch.batchNumber}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {batch.product.name} ({batch.product.sku})
        </p>
      </div>

      {/* Batch Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Devices
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDevices}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statusSummary?.AVAILABLE || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Issued
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statusSummary?.ISSUED || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statusSummary?.ACTIVE || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <CardTitle>Device List</CardTitle>

            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.values(DeviceStatus).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => fetchBatchDevices(true)}
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
          {message && !batch.product.isImeiTracked && (
            <div className="p-4 mb-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">{message}</p>
            </div>
          )}

          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[170px]">IMEI</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Serial Number
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      MAC Address
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Issued At
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Created
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">
                        <div className="text-muted-foreground">
                          No devices found.
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    devices.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-mono font-medium">
                          {d.imeiNumber}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={statusColor(d.status)}
                            variant="default"
                          >
                            {d.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell font-mono">
                          {d.serialNumber || "—"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell font-mono">
                          {d.macAddress || "—"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {d.issuedAt ? formatDate(d.issuedAt) : "—"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {formatDate(d.createdAt)}
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
    </div>
  );
};

export default BatchDevices;
