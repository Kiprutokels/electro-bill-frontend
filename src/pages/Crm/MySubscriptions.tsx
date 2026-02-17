import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { subscriptionsCrmService } from "@/api/services/subscriptions-crm.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  AlertTriangle,
  CalendarCheck,
  Clock,
  Eye,
  MessageSquare,
  Settings2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/format.utils";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import CrmConfigDialog from "@/components/crm/CrmConfigDialog";

function followUpBadge(nextFollowUpDate?: string | null) {
  if (!nextFollowUpDate) return <Badge variant="outline">No schedule</Badge>;
  const now = new Date();
  const d = new Date(nextFollowUpDate);
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  const endToday = new Date();
  endToday.setHours(23, 59, 59, 999);

  if (d < startToday)
    return <Badge className="bg-red-500 text-white">OVERDUE</Badge>;
  if (d >= startToday && d <= endToday)
    return <Badge className="bg-green-500 text-white">TODAY</Badge>;

  const diffDays = Math.ceil(
    (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays <= 7)
    return <Badge className="bg-yellow-500 text-white">IN {diffDays}d</Badge>;
  return <Badge variant="outline">IN {diffDays}d</Badge>;
}

export default function MySubscriptions() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [crmConfigOpen, setCrmConfigOpen] = useState(false);
  const [crmTarget, setCrmTarget] = useState<any | null>(null);

  const q = useQuery({
    queryKey: ["my-subscriptions", search],
    queryFn: () =>
      subscriptionsCrmService.mySubscriptions({ page: 1, limit: 50, search }),
  });

  if (q.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const rows = q.data?.data ?? [];

  const dueToday = rows.filter((r: any) => {
    if (!r.nextFollowUpDate) return false;
    const d = new Date(r.nextFollowUpDate);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return d >= start && d <= end;
  });

  const overdue = rows.filter(
    (r: any) =>
      r.nextFollowUpDate &&
      new Date(r.nextFollowUpDate) < new Date(new Date().setHours(0, 0, 0, 0)),
  );

  const upcoming = rows.filter((r: any) => {
    if (!r.nextFollowUpDate) return false;
    const d = new Date(r.nextFollowUpDate);
    const now = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 7);
    return d >= now && d <= end;
  });

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">
          My Customer Portfolio
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Subscriptions I manage (sorted by follow-up priority)
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Due Today
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dueToday.length}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Overdue
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdue.length}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Upcoming (7d)
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcoming.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle>My Subscriptions ({rows.length})</CardTitle>
          <Input
            className="sm:w-72"
            placeholder="Search customer/subscription/product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No assigned subscriptions.
            </div>
          ) : (
            rows.map((s: any) => (
              <div
                key={s.id}
                className="border rounded-md p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  {/* Left: Customer Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="flex-1">
                        <div className="font-mono font-semibold text-base">
                          {s.subscriptionNumber}
                        </div>
                        <div className="text-sm font-medium truncate">
                          {s.customer?.businessName ||
                            s.customer?.contactPerson}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {s.customer?.phone} • {s.product?.name}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline">{s.status}</Badge>
                        <Badge variant="outline">
                          {s.crmStatus || "ACTIVE"}
                        </Badge>
                        <Badge
                          variant={
                            s.priority === "CRITICAL"
                              ? "destructive"
                              : s.priority === "HIGH_VALUE"
                                ? "default"
                                : "outline"
                          }
                        >
                          {s.priority || "NORMAL"}
                        </Badge>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Billing Expiry: {formatDate(s.expiryDate)}</div>
                      <div>
                        Last Contact:{" "}
                        {s.lastContactDate
                          ? formatDate(s.lastContactDate)
                          : "Never"}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <div className="flex flex-col gap-1">
                      <div className="text-xs text-muted-foreground">
                        Next Follow-up:
                      </div>
                      <div className="flex items-center gap-2">
                        {followUpBadge(s.nextFollowUpDate)}
                        <span className="text-xs">
                          {formatDate(s.nextFollowUpDate) || "—"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/subscriptions/${s.id}`)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigate(`/crm/followups?subscriptionId=${s.id}`)
                        }
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Follow-up
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setCrmTarget(s);
                          setCrmConfigOpen(true);
                        }}
                      >
                        <Settings2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <CrmConfigDialog
        open={crmConfigOpen}
        onOpenChange={(v) => {
          setCrmConfigOpen(v);
          if (!v) setCrmTarget(null);
        }}
        subscription={crmTarget}
        onSubmit={async (payload) => {
          if (!crmTarget?.id) return;
          try {
            await subscriptionsCrmService.updateCrmConfig(
              crmTarget.id,
              payload,
            );
            toast.success("CRM config saved");
            qc.invalidateQueries({ queryKey: ["my-subscriptions"] });
            qc.invalidateQueries({ queryKey: ["crm-dashboard-my"] });
            setCrmConfigOpen(false);
            setCrmTarget(null);
          } catch (e: any) {
            toast.error(
              e?.response?.data?.message || "Failed to save CRM config",
            );
          }
        }}
      />
    </div>
  );
}
