import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Eye,
  Edit,
  XCircle,
  Calendar,
  User,
  Package,
  Receipt,
  Mail,
  CheckCircle,
  AlertTriangle,
  Clock,
  FilePlus2,
  Loader2,
  DollarSign,
  Cpu,
  Car,
  MapPin,
  Wrench,
  Users2,
  SlidersHorizontal,
} from "lucide-react";
import {
  Subscription,
  SubscriptionStatus,
  subscriptionsService,
} from "@/api/services/subscriptions.service";
import { formatCurrency, formatDate } from "@/utils/format.utils";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS } from "@/utils/constants";
import { toast } from "sonner";
import AssignOwnerDialog from "@/components/subscriptions/AssignOwnerDialog";
import CrmConfigDialog from "@/components/subscriptions/CrmConfigDialog";

interface SubscriptionViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: Subscription | null;
  onEdit: () => void;
  onCancel: (subscription: Subscription) => void;
}

const SubscriptionViewDialog: React.FC<SubscriptionViewDialogProps> = ({
  open,
  onOpenChange,
  subscription,
  onEdit,
  onCancel,
}) => {
  const { hasPermission } = useAuth();
  const [renewLoading, setRenewLoading] = useState(false);

  const [detailsLoading, setDetailsLoading] = useState(false);
  const [details, setDetails] = useState<Subscription | null>(null);

  const [assignOwnerOpen, setAssignOwnerOpen] = useState(false);
  const [crmConfigOpen, setCrmConfigOpen] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!open || !subscription?.id) return;
      setDetailsLoading(true);
      try {
        const full = await subscriptionsService.getById(subscription.id);
        setDetails(full);
      } catch (err: any) {
        toast.error(
          err.response?.data?.message || "Failed to load subscription details",
        );
        setDetails(subscription);
      } finally {
        setDetailsLoading(false);
      }
    };
    run();
  }, [open, subscription?.id]);

  const s = details || subscription;
  if (!s) return null;

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

  const daysLeft = getDaysUntilExpiry(s.expiryDate);
  const canEdit = s.status !== SubscriptionStatus.CANCELLED;
  const canCancel = s.status === SubscriptionStatus.ACTIVE;

  const canGenerateRenewalInvoice =
    s.status === SubscriptionStatus.EXPIRED &&
    hasPermission(PERMISSIONS.SUBSCRIPTIONS_UPDATE);

  const handleGenerateRenewalInvoice = async () => {
    setRenewLoading(true);
    try {
      const invoice = await subscriptionsService.generateRenewalInvoice(s.id);
      toast.success(
        `Renewal invoice ${invoice.invoiceNumber} created successfully!`,
        {
          description:
            "Invoice has been sent. Subscription will renew when invoice is paid.",
        },
      );
      onOpenChange(false);
      window.location.reload();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to generate renewal invoice",
      );
    } finally {
      setRenewLoading(false);
    }
  };

  const subscriptionFee = useMemo(() => {
    const pFee = s.product?.subscriptionFee ? Number(s.product.subscriptionFee) : 0;
    if (pFee > 0) return pFee;
    return s.renewalPrice ? Number(s.renewalPrice) : 0;
  }, [s.product?.subscriptionFee, s.renewalPrice]);

  const ownerName =
    s.accountOwner ? `${s.accountOwner.firstName} ${s.accountOwner.lastName}` : "Unassigned";

  const crmTags = useMemo(() => {
    try {
      const parsed = s.tags ? JSON.parse(s.tags) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [s.tags]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Subscription Details
            </DialogTitle>
            {getStatusBadge(s.status)}
          </div>
          <DialogDescription>
            Subscription + device + installation + CRM ownership/workflow
          </DialogDescription>
        </DialogHeader>

        {detailsLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading full details...
          </div>
        )}

        <div className="space-y-4">
          {/* CRM Summary */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users2 className="h-5 w-5" />
                CRM Ownership & Follow-up
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground">Owner</div>
                <div className="font-medium">{ownerName}</div>
              </div>
              <div>
                <div className="text-muted-foreground">CRM Status</div>
                <div className="font-medium">{s.crmStatus ?? "ACTIVE"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Priority</div>
                <div className="font-medium">{s.priority ?? "NORMAL"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Next Follow-up</div>
                <div className="font-medium">
                  {s.nextFollowUpDate ? formatDate(s.nextFollowUpDate) : "—"}
                </div>
              </div>

              <div className="md:col-span-4">
                <div className="text-muted-foreground">Tags</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {crmTags.length ? crmTags.map((t: string) => (
                    <Badge key={t} variant="outline">{t}</Badge>
                  )) : <span className="text-muted-foreground">—</span>}
                </div>
              </div>

              <div className="md:col-span-4 flex gap-2 pt-2">
                {hasPermission(PERMISSIONS.SUBSCRIPTIONS_UPDATE) && (
                  <>
                    <Button variant="outline" onClick={() => setAssignOwnerOpen(true)}>
                      <Users2 className="h-4 w-4 mr-2" />
                      Assign Owner
                    </Button>
                    <Button variant="outline" onClick={() => setCrmConfigOpen(true)}>
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      CRM Config
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Existing sections unchanged */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Subscription Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Subscription Number</p>
                  <p className="font-mono font-medium">{s.subscriptionNumber}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p>{formatDate(s.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expiry Date</p>
                    <p>{formatDate(s.expiryDate)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Days Until Expiry</p>
                  <Badge
                    variant={daysLeft < 0 ? "destructive" : daysLeft <= 7 ? "default" : "outline"}
                    className={daysLeft < 0 ? "bg-red-500 text-white" : daysLeft <= 7 ? "bg-yellow-500 text-white" : ""}
                  >
                    {daysLeft < 0 ? `Expired ${Math.abs(daysLeft)} days ago` : `${daysLeft} days`}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Subscription Fee</p>
                  <p className="font-medium text-lg flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {formatCurrency(subscriptionFee)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Auto-Renew</p>
                  <Badge variant={s.autoRenew ? "default" : "secondary"}>
                    {s.autoRenew ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer Code</p>
                  <p className="font-medium">{s.customer?.customerCode || "N/A"}</p>
                </div>

                {s.customer?.businessName && (
                  <div>
                    <p className="text-sm text-muted-foreground">Business Name</p>
                    <p className="font-medium">{s.customer.businessName}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground">Contact Person</p>
                  <p>{s.customer?.contactPerson || "N/A"}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {s.customer?.email || "N/A"}
                  </p>
                </div>

                {s.customer?.phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p>{s.customer.phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Product */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Product Name</p>
                  <p className="font-medium">{s.product?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">SKU</p>
                  <p className="font-mono">{s.product?.sku || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Product Price</p>
                  <p className="font-medium">
                    {s.product?.sellingPrice ? formatCurrency(Number(s.product.sellingPrice)) : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Device + Installation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  Device Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Linked IMEI</p>
                  <p className="font-mono">{s.deviceImei || "—"}</p>
                </div>

                {s.device ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="font-medium">{s.device.status}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Activated</p>
                        <p>{s.device.activatedDate ? formatDate(s.device.activatedDate) : "—"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">SIM ICCID</p>
                        <p className="font-mono text-sm">{s.device.simCardIccid || "—"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">MAC Address</p>
                        <p className="font-mono text-sm">{s.device.macAddress || "—"}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Device Product</p>
                      <p className="font-medium">
                        {s.device.product ? `${s.device.product.name} (${s.device.product.sku})` : "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Batch</p>
                      <p className="font-mono text-sm">{s.device.batch?.batchNumber || "—"}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No device details available (IMEI not linked or device not found).
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Latest Installation / Vehicle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {s.latestInstallation ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Install Date</p>
                        <p>{formatDate(s.latestInstallation.installationDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="font-medium">{s.latestInstallation.status}</p>
                      </div>
                    </div>

                    {s.latestInstallation.vehicle ? (
                      <div>
                        <p className="text-sm text-muted-foreground">Vehicle</p>
                        <p className="font-medium">
                          {s.latestInstallation.vehicle.vehicleReg} — {s.latestInstallation.vehicle.make}{" "}
                          {s.latestInstallation.vehicle.model}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          Chassis: {s.latestInstallation.vehicle.chassisNo}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No vehicle linked for latest installation.</p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          GPS
                        </p>
                        <p className="font-mono text-sm">{s.latestInstallation.gpsCoordinates || "—"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p>{s.latestInstallation.installationLocation || "—"}</p>
                      </div>
                    </div>

                    {s.latestInstallation.job && (
                      <div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Wrench className="h-4 w-4" />
                          Job
                        </p>
                        <p className="font-medium font-mono">{s.latestInstallation.job.jobNumber}</p>
                        <p className="text-xs text-muted-foreground">{s.latestInstallation.job.status}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No installation history found for this device.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {s.invoice && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Related Invoice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Invoice Number</p>
                    <p className="font-mono font-medium">{s.invoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-medium">{formatCurrency(Number(s.invoice.totalAmount))}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footer buttons */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {hasPermission(PERMISSIONS.SUBSCRIPTIONS_UPDATE) && canEdit && (
              <Button onClick={onEdit} variant="default">
                <Edit className="mr-2 h-4 w-4" />
                Edit Subscription
              </Button>
            )}

            {hasPermission(PERMISSIONS.SUBSCRIPTIONS_UPDATE) && canCancel && (
              <Button
                variant="outline"
                className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                onClick={() => onCancel(s)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Subscription
              </Button>
            )}

            {canGenerateRenewalInvoice && (
              <Button
                variant="default"
                onClick={handleGenerateRenewalInvoice}
                disabled={renewLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {renewLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Invoice...
                  </>
                ) : (
                  <>
                    <FilePlus2 className="mr-2 h-4 w-4" />
                    Generate Renewal Invoice
                  </>
                )}
              </Button>
            )}

            <Button variant="outline" onClick={() => onOpenChange(false)} className="ml-auto">
              Close
            </Button>
          </div>
        </div>

        {/* CRM dialogs */}
        <AssignOwnerDialog
          open={assignOwnerOpen}
          onOpenChange={setAssignOwnerOpen}
          subscription={s}
          onSuccess={(updated) => setDetails(updated)}
        />
        <CrmConfigDialog
          open={crmConfigOpen}
          onOpenChange={setCrmConfigOpen}
          subscription={s}
          onSuccess={(updated) => setDetails(updated)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionViewDialog;