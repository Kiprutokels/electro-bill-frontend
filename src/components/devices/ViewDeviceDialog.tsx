import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Device, DeviceStatus } from "@/api/types/device.types";
import { formatDate } from "@/utils/format.utils";
import { Calendar, FileText, History, MapPin, Package, User } from "lucide-react";

interface ViewDeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: Device | null;
  onEdit?: () => void;
  onViewHistory?: () => void;
  onIssue?: () => void;
  onActivate?: () => void;
  onDamaged?: () => void;
  onReturned?: () => void;
  onDeactivate?: () => void;
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

const ViewDeviceDialog = ({
  open,
  onOpenChange,
  device,
  onEdit,
  onViewHistory,
  onIssue,
  onActivate,
  onDamaged,
  onReturned,
  onDeactivate,
}: ViewDeviceDialogProps) => {
  if (!device) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle>Device Details</DialogTitle>
            <Badge className={statusColor(device.status)} variant="default">
              {device.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Device Identification */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Device Identification
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">IMEI Number</p>
                <p className="font-mono font-medium">{device.imeiNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Serial Number</p>
                <p className="font-mono">{device.serialNumber || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">MAC Address</p>
                <p className="font-mono">{device.macAddress || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">SIM Card ICCID</p>
                <p className="font-mono">{device.simCardIccid || "—"}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Product Information */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Product Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Product Name</p>
                <p className="font-medium">{device.product?.name || device.productId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">SKU</p>
                <p className="font-mono">{device.product?.sku || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Batch Number</p>
                <p className="font-mono">{device.batch?.batchNumber || "—"}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Installation Details */}
          {(device.installationAddress ||
            device.installationDate ||
            device.installationCompany ||
            device.installationPerson) && (
            <>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Installation Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Installation Address</p>
                    <p>{device.installationAddress || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Installation Date</p>
                    <p>{device.installationDate ? formatDate(device.installationDate) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Installed By</p>
                    <p>{device.installationPerson || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Company</p>
                    <p>{device.installationCompany || "—"}</p>
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Status Dates */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Status Dates
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p>{formatDate(device.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Updated</p>
                <p>{formatDate(device.updatedAt)}</p>
              </div>

              {device.issuedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Issued At</p>
                  <p>{formatDate(device.issuedAt)}</p>
                </div>
              )}

              {device.activatedDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Activated</p>
                  <p>{formatDate(device.activatedDate)}</p>
                </div>
              )}

              {device.lastBatteryReplacement && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Battery Replacement</p>
                  <p>{formatDate(device.lastBatteryReplacement)}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Requisition Details */}
          {(device.requisitionItem || device.issuedBy || device.requisitionItemId) && (
            <>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Requisition Details
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Requisition Item ID</p>
                    <p className="font-mono">{device.requisitionItemId || "—"}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Issued By (User ID)</p>
                    <p className="font-mono">{device.issuedBy || "—"}</p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Requisition Number</p>
                    <p className="font-mono">
                      {device.requisitionItem?.requisition?.requisitionNumber || "—"}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Job Number</p>
                    <p className="font-mono">
                      {device.requisitionItem?.requisition?.job?.jobNumber || "—"}
                    </p>
                  </div>

                  {device.issuer && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Issuer (User)</p>
                      <p>
                        {device.issuer.firstName} {device.issuer.lastName}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Notes */}
          {device.notes && (
            <>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </h3>
                <p className="text-sm whitespace-pre-wrap">{device.notes}</p>
              </div>
              <Separator />
            </>
          )}

          {/* Actions */}
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            {onViewHistory && (
              <Button variant="outline" onClick={onViewHistory}>
                <History className="mr-2 h-4 w-4" />
                History
              </Button>
            )}

            {onEdit && (
              <Button variant="outline" onClick={onEdit}>
                Edit
              </Button>
            )}

            {onIssue && device.status === DeviceStatus.AVAILABLE && (
              <Button variant="outline" onClick={onIssue}>
                Issue
              </Button>
            )}

            {onActivate &&
              (device.status === DeviceStatus.AVAILABLE ||
                device.status === DeviceStatus.ISSUED) && (
                <Button variant="outline" onClick={onActivate}>
                  Activate
                </Button>
              )}

            {onDamaged && (
              <Button variant="outline" onClick={onDamaged}>
                Mark Damaged
              </Button>
            )}

            {onReturned && (
              <Button variant="outline" onClick={onReturned}>
                Mark Returned
              </Button>
            )}

            {onDeactivate && device.status === DeviceStatus.ACTIVE && (
              <Button variant="outline" onClick={onDeactivate}>
                Deactivate
              </Button>
            )}

            <Button variant="default" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewDeviceDialog;
