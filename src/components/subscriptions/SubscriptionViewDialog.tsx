import React, { useState } from "react";
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
} from "lucide-react";
import {
  Subscription,
  SubscriptionStatus,
} from "@/api/services/subscriptions.service";
import { formatCurrency, formatDate } from "@/utils/format.utils";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS } from "@/utils/constants";
import { subscriptionsService } from "@/api/services/subscriptions.service";
import { toast } from "sonner";

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

  if (!subscription) return null;

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
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysLeft = getDaysUntilExpiry(subscription.expiryDate);
  const canEdit = subscription.status !== SubscriptionStatus.CANCELLED;
  const canCancel = subscription.status === SubscriptionStatus.ACTIVE;

  const canGenerateRenewalInvoice =
    subscription.status === SubscriptionStatus.EXPIRED &&
    hasPermission(PERMISSIONS.SUBSCRIPTIONS_UPDATE);

  const handleGenerateRenewalInvoice = async () => {
    if (!subscription) return;
    setRenewLoading(true);
    try {
      const invoice = await subscriptionsService.generateRenewalInvoice(
        subscription.id
      );
      toast.success(
        `Renewal invoice ${invoice.invoiceNumber} created successfully!`,
        {
          description:
            "Invoice has been sent. Subscription will renew when invoice is paid.",
        }
      );
      onOpenChange(false);
      window.location.reload();
    } catch (err: any) {
      const msg =
        err.response?.data?.message || "Failed to generate renewal invoice";
      toast.error(msg);
    } finally {
      setRenewLoading(false);
    }
  };

  const subscriptionFee = subscription.product?.subscriptionFee
    ? Number(subscription.product.subscriptionFee)
    : subscription.renewalPrice
    ? Number(subscription.renewalPrice)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Subscription Details
            </DialogTitle>
            {getStatusBadge(subscription.status)}
          </div>
          <DialogDescription>
            View subscription information and history
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Subscription Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Subscription Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Subscription Number
                  </p>
                  <p className="font-mono font-medium">
                    {subscription.subscriptionNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p>{formatDate(subscription.startDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expiry Date</p>
                  <p>{formatDate(subscription.expiryDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Days Until Expiry
                  </p>
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
                        ? "bg-red-500 text-white"
                        : daysLeft <= 7
                        ? "bg-yellow-500 text-white"
                        : ""
                    }
                  >
                    {daysLeft < 0
                      ? `Expired ${Math.abs(daysLeft)} days ago`
                      : `${daysLeft} days`}
                  </Badge>
                </div>
                {/* Subscription Fee Display */}
                <div>
                  <p className="text-sm text-muted-foreground">
                    Subscription Fee
                  </p>
                  <p className="font-medium text-lg flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {formatCurrency(subscriptionFee)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Auto-Renew</p>
                  <Badge
                    variant={subscription.autoRenew ? "default" : "secondary"}
                  >
                    {subscription.autoRenew ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
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
                  <p className="font-medium">
                    {subscription.customer?.customerCode || "N/A"}
                  </p>
                </div>
                {subscription.customer?.businessName && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Business Name
                    </p>
                    <p className="font-medium">
                      {subscription.customer.businessName}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">
                    Contact Person
                  </p>
                  <p>{subscription.customer?.contactPerson || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {subscription.customer?.email || "N/A"}
                  </p>
                </div>
                {subscription.customer?.phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p>{subscription.customer.phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Product Information */}
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
                  <p className="font-medium">
                    {subscription.product?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">SKU</p>
                  <p className="font-mono">
                    {subscription.product?.sku || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Product Price</p>
                  <p className="font-medium">
                    {subscription.product?.sellingPrice
                      ? formatCurrency(
                          Number(subscription.product.sellingPrice)
                        )
                      : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Reference */}
          {subscription.invoice && (
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
                    <p className="text-sm text-muted-foreground">
                      Invoice Number
                    </p>
                    <p className="font-mono font-medium">
                      {subscription.invoice.invoiceNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-medium">
                      {formatCurrency(Number(subscription.invoice.totalAmount))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Renewal History */}
          {subscription.renewals && subscription.renewals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Renewal History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {subscription.renewals.map((renewal, index) => (
                    <div
                      key={renewal.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          Renewal {subscription.renewals!.length - index}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(renewal.startDate)} -{" "}
                          {formatDate(renewal.expiryDate)}
                        </p>
                        {renewal.invoice && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Invoice: {renewal.invoice.invoiceNumber}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(Number(renewal.amount))}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Paid: {formatDate(renewal.paidAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notification History */}
          {subscription.notifications &&
            subscription.notifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Notification History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {subscription.notifications.map((notification, index) => (
                      <div
                        key={notification.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {notification.notificationType.replace(/_/g, " ")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Sent to: {notification.emailTo}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(notification.sentAt)}
                          </p>
                        </div>
                        <Badge
                          variant={
                            notification.success ? "default" : "destructive"
                          }
                        >
                          {notification.success ? "Sent" : "Failed"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Notes */}
          {subscription.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {subscription.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Cancellation Info */}
          {subscription.status === SubscriptionStatus.CANCELLED &&
            subscription.cancelledAt && (
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">
                    Cancellation Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Cancelled At
                      </p>
                      <p>{formatDate(subscription.cancelledAt)}</p>
                    </div>
                    {subscription.cancelledByUser && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Cancelled By
                        </p>
                        <p>
                          {subscription.cancelledByUser.firstName}{" "}
                          {subscription.cancelledByUser.lastName}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Action Buttons */}
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
                onClick={() => onCancel(subscription)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Subscription
              </Button>
            )}

            {/* Generate Renewal Invoice Button - ONLY for EXPIRED */}
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

            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="ml-auto"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionViewDialog;
