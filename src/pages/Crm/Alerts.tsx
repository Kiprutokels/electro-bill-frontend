import { useState } from "react";
import { useCrmAlerts } from "@/hooks/useCrmAlerts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const CrmAlerts = () => {
  const [search] = useState("");
  const { list, acknowledge, resolve } = useCrmAlerts({ page: 1, limit: 50, search });

  if (list.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const items = list.data?.data ?? [];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">CRM Alerts</h1>
        <p className="text-sm text-muted-foreground mt-1">Escalations and risk signals</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Alerts</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {items.map((a: any) => (
            <div key={a.id} className="border rounded-md p-3 space-y-2">
              <div className="text-xs text-muted-foreground">
                {a.severity} • {a.alertType} • {new Date(a.createdAt).toLocaleString()}
              </div>
              <div className="font-medium">{a.title}</div>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">{a.description}</div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={a.acknowledged || acknowledge.isPending}
                  onClick={async () => {
                    try {
                      await acknowledge.mutateAsync({ id: a.id, notes: "Acknowledged in UI" });
                      toast.success("Alert acknowledged");
                    } catch (e: any) {
                      toast.error(e?.response?.data?.message || "Failed to acknowledge");
                    }
                  }}
                >
                  {a.acknowledged ? "Acknowledged" : "Acknowledge"}
                </Button>

                <Button
                  size="sm"
                  disabled={a.resolved || resolve.isPending}
                  onClick={async () => {
                    try {
                      await resolve.mutateAsync({ id: a.id, resolutionNotes: "Resolved in UI" });
                      toast.success("Alert resolved");
                    } catch (e: any) {
                      toast.error(e?.response?.data?.message || "Failed to resolve");
                    }
                  }}
                >
                  {a.resolved ? "Resolved" : "Resolve"}
                </Button>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="text-sm text-muted-foreground">No alerts.</div>}
        </CardContent>
      </Card>
    </div>
  );
};

export default CrmAlerts;
