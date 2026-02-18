import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { subscriptionsService } from "@/api/services/subscriptions.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/format.utils";
import { Badge } from "@/components/ui/badge";

export default function SubscriptionDetails() {
  const { id } = useParams<{ id: string }>();

  const q = useQuery({
    queryKey: ["subscription", id],
    queryFn: () => subscriptionsService.getById(id!),
    enabled: !!id,
  });

  if (q.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (q.isError || !q.data) {
    return (
      <div className="p-6">
        <div className="text-sm text-destructive">Failed to load subscription.</div>
        <Button asChild variant="outline" className="mt-3">
          <Link to="/subscriptions">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Link>
        </Button>
      </div>
    );
  }

  const s: any = q.data;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="outline">
          <Link to="/subscriptions">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Link>
        </Button>
        <div className="font-mono text-sm text-muted-foreground">{s.subscriptionNumber}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Status:</span> <Badge variant="outline">{s.status}</Badge></div>
            <div><span className="text-muted-foreground">Start:</span> {formatDate(s.startDate)}</div>
            <div><span className="text-muted-foreground">Expiry:</span> {formatDate(s.expiryDate)}</div>
            <div><span className="text-muted-foreground">Device IMEI:</span> {s.deviceImei || "—"}</div>
            {s.notes && <div className="pt-2 whitespace-pre-wrap">{s.notes}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="font-medium">{s.customer?.businessName || s.customer?.contactPerson || "—"}</div>
            <div className="text-muted-foreground">{s.customer?.email || "—"}</div>
            <div className="text-muted-foreground">{s.customer?.phone || "—"}</div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Latest Installation (if any)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground">Job</div>
              <div className="font-mono">{s.latestInstallation?.job?.jobNumber || "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Vehicle</div>
              <div>{s.latestInstallation?.vehicle?.vehicleReg || "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Technician</div>
              <div>
                {s.latestInstallation?.technician?.user
                  ? `${s.latestInstallation.technician.user.firstName} ${s.latestInstallation.technician.user.lastName}`
                  : "—"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}