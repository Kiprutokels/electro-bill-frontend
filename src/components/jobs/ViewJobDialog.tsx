import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  MapPin,
  User,
  Users,
  Phone,
  Mail,
  Star,
  AlertCircle,
  Smartphone,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Job, JobStatus } from "@/api/services/jobs.service";
import { Alert, AlertDescription } from "../ui/alert";

interface ViewJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
  onManageTechnicians: () => void;
  onCancel: () => void;
}

const safeDate = (value: any) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const ViewJobDialog = ({
  open,
  onOpenChange,
  job,
  onManageTechnicians,
  onCancel,
}: ViewJobDialogProps) => {
  if (!job) return null;

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-gray-500",
      SCHEDULED: "bg-indigo-500",
      ASSIGNED: "bg-blue-500",
      IN_PROGRESS: "bg-purple-500",
      COMPLETED: "bg-green-500",
      VERIFIED: "bg-green-600",
      CANCELLED: "bg-red-500",
      REQUISITION_PENDING: "bg-yellow-500",
      REQUISITION_APPROVED: "bg-blue-500",
      PRE_INSPECTION_PENDING: "bg-orange-500",
      PRE_INSPECTION_APPROVED: "bg-green-500",
      POST_INSPECTION_PENDING: "bg-orange-500",
    };

    return (
      <Badge className={`${colors[status] || "bg-gray-500"} text-white`}>
        {status.replace(/_/g, " ")}
      </Badge>
    );
  };

  const getJobTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      NEW_INSTALLATION:
        "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-900",
      REPLACEMENT:
        "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-200 dark:border-orange-900",
      MAINTENANCE:
        "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/40 dark:text-green-200 dark:border-green-900",
      REPAIR:
        "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-200 dark:border-red-900",
      UPGRADE:
        "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-200 dark:border-purple-900",
    };

    return (
      <Badge variant="outline" className={colors[type] || ""}>
        {type.replace(/_/g, " ")}
      </Badge>
    );
  };

  const canManageTechnicians = ![
    JobStatus.COMPLETED,
    JobStatus.VERIFIED,
    JobStatus.CANCELLED,
  ].includes(job.status);

  const canCancel = ![
    JobStatus.COMPLETED,
    JobStatus.VERIFIED,
    JobStatus.CANCELLED,
  ].includes(job.status);

  const installedDevices = useMemo(() => {
    const arr = Array.isArray((job as any).jobDevices)
      ? (job as any).jobDevices
      : [];

    return arr
      .map((jd: any) => {
        const imei = jd?.deviceImei || jd?.device?.imeiNumber;
        if (!imei) return null;

        return {
          imei: String(imei),
          status: jd?.device?.status as string | undefined,
          serialNumber: jd?.device?.serialNumber as string | undefined,
          productId: jd?.device?.productId as string | undefined,
        };
      })
      .filter(Boolean) as Array<{
      imei: string;
      status?: string;
      serialNumber?: string;
      productId?: string;
    }>;
  }, [job]);

  const hasJobDevicesField = Array.isArray((job as any).jobDevices);

  const scheduled = safeDate(job.scheduledDate);
  const createdAt = safeDate(job.createdAt);
  const startTime = safeDate(job.startTime);
  const endTime = safeDate(job.endTime);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span>Job Details</span>
            <div className="flex gap-2 flex-wrap">
              {getStatusBadge(job.status)}
              {getJobTypeBadge(job.jobType)}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">
                Job Number
              </Label>
              <p className="font-mono font-semibold text-lg">{job.jobNumber}</p>
            </div>

            <div>
              <Label className="text-muted-foreground text-xs">
                Scheduled Date
              </Label>
              <p className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {scheduled ? scheduled.toLocaleDateString() : "—"}
              </p>
            </div>
          </div>

          <Separator />

          {/* Installed Devices */}
          <div>
            <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Installed / Confirmed Devices ({installedDevices.length})
              </Label>

              {installedDevices.length > 0 && (
                <Badge variant="secondary" className="font-mono text-xs">
                  {installedDevices.length} IMEI(s)
                </Badge>
              )}
            </div>

            {/* If API didn’t include jobDevices */}
            {!hasJobDevicesField && (
              <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
                <Info className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                <AlertDescription className="text-xs text-amber-800 dark:text-amber-200 ml-2">
                  This job response did not include <strong>jobDevices</strong>.

                </AlertDescription>
              </Alert>
            )}

            {installedDevices.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {installedDevices.map((d) => (
                  <div
                    key={d.imei}
                    className={[
                      "rounded-lg border p-3",
                      "bg-background dark:bg-muted/20",
                      "flex items-start justify-between gap-3",
                    ].join(" ")}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <p className="font-mono font-semibold text-sm truncate">
                          {d.imei}
                        </p>
                      </div>

                      <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
                        {d.serialNumber && (
                          <div className="truncate">
                            <span className="font-medium">SN:</span>{" "}
                            {d.serialNumber}
                          </div>
                        )}
                        {d.productId && (
                          <div className="truncate">
                            <span className="font-medium">Product:</span>{" "}
                            {d.productId}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <Badge
                        variant="outline"
                        className="text-xs"
                        title="Device status"
                      >
                        {d.status || "N/A"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Alert className="bg-muted/40">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No installed device recorded yet (no IMEI captured).
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Separator />

          {/* Customer Information */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">
              Customer Information
            </Label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/50 dark:bg-muted/30 p-4 rounded-lg border border-border">
              <div>
                <Label className="text-muted-foreground text-xs">Name</Label>
                <p className="font-medium">
                  {job.customer.businessName || job.customer.contactPerson}
                </p>
              </div>

              <div>
                <Label className="text-muted-foreground text-xs">
                  Customer Code
                </Label>
                <p className="font-mono text-sm">{job.customer.customerCode}</p>
              </div>

              {job.customer.phone && (
                <div>
                  <Label className="text-muted-foreground text-xs">Phone</Label>
                  <p className="flex items-center gap-2 text-sm">
                    <Phone className="h-3 w-3" />
                    {job.customer.phone}
                  </p>
                </div>
              )}

              {job.customer.email && (
                <div>
                  <Label className="text-muted-foreground text-xs">Email</Label>
                  <p className="flex items-center gap-2 text-sm">
                    <Mail className="h-3 w-3" />
                    {job.customer.email}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Information */}
          {job.vehicle ? (
            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Vehicle Information
              </Label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/50 dark:bg-muted/30 p-4 rounded-lg border border-border">
                <div>
                  <Label className="text-muted-foreground text-xs">
                    Registration
                  </Label>
                  <p className="font-semibold">{job.vehicle.vehicleReg}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">
                    Make & Model
                  </Label>
                  <p className="font-medium">
                    {job.vehicle.make} {job.vehicle.model}
                  </p>
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">Color</Label>
                  <p>{job.vehicle.color || "N/A"}</p>
                </div>
              </div>
            </div>
          ) : (
            <Alert className="bg-muted/40">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No vehicle assigned yet</AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Assigned Technicians */}
          <div>
            <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Assigned Technicians ({job.technicians?.length || 0})
              </Label>

              {canManageTechnicians && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onManageTechnicians}
                >
                  Manage Team
                </Button>
              )}
            </div>

            {job.technicians && job.technicians.length > 0 ? (
              <div className="space-y-2">
                {job.technicians.map((tech) => (
                  <div
                    key={tech.id}
                    className={[
                      "p-3 rounded-lg border",
                      "bg-background dark:bg-muted/20",
                      tech.isPrimary ? "border-blue-500/70" : "border-border",
                    ].join(" ")}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold truncate">
                              {tech.firstName} {tech.lastName}
                            </p>

                            {tech.isPrimary && (
                              <Badge variant="default" className="text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Primary
                              </Badge>
                            )}
                          </div>

                          <p className="text-xs text-muted-foreground font-mono truncate">
                            {tech.technicianCode}
                          </p>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-sm flex items-center gap-1 sm:justify-end">
                          <MapPin className="h-3 w-3" />
                          {tech.location}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tech.phone || "—"}
                        </p>
                      </div>
                    </div>

                    {tech.notes && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Note: {tech.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-muted/40 rounded-lg border border-border">
                <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No technicians assigned yet
                </p>
                {job.status === JobStatus.PENDING && (
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={onManageTechnicians}
                  >
                    Assign Technicians
                  </Button>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Service Description */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">
              Service Description
            </Label>
            <p className="text-sm bg-muted/50 dark:bg-muted/30 p-4 rounded-lg border border-border">
              {job.serviceDescription}
            </p>
          </div>

          {/* Installation Notes */}
          {job.installationNotes && (
            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Installation Notes
              </Label>
              <p className="text-sm bg-muted/50 dark:bg-muted/30 p-4 rounded-lg border border-border">
                {job.installationNotes}
              </p>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div>
              <Label className="text-xs">Created</Label>
              <p>{createdAt ? createdAt.toLocaleString() : "—"}</p>
            </div>

            {startTime && (
              <div>
                <Label className="text-xs">Started</Label>
                <p>{startTime.toLocaleString()}</p>
              </div>
            )}

            {endTime && (
              <div>
                <Label className="text-xs">Completed</Label>
                <p>{endTime.toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
          {canCancel ? (
            <Button variant="destructive" onClick={onCancel}>
              Cancel Job
            </Button>
          ) : (
            <div />
          )}

          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewJobDialog;
