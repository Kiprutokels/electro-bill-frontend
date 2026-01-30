import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, CalendarCheck, Clock } from "lucide-react";
import { useCrmDashboard } from "@/hooks/useCrmDashboard";
import { formatDate } from "@/utils/format.utils";

const CrmDashboard = () => {
  const { my, manager } = useCrmDashboard(14);

  if (my.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading CRM dashboard...</p>
        </div>
      </div>
    );
  }

  const data = my.data;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">CRM Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Follow-ups and relationship health overview
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Due Today</CardTitle>
            <CalendarCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.queues?.dueToday?.length ?? 0}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.queues?.overdue?.length ?? 0}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Upcoming (14d)</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.queues?.upcoming?.length ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Overdue Follow-ups</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data?.queues?.overdue ?? []).slice(0, 10).map((t: any) => (
              <div key={t.id} className="flex items-start justify-between gap-3 border rounded-md p-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{t.title}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {t.subscription?.subscriptionNumber} — {t.customer?.businessName || t.customer?.contactPerson}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Due: {formatDate(t.dueDate)}
                  </div>
                </div>
                <Badge className="bg-red-500 text-white">{t.status}</Badge>
              </div>
            ))}
            {(data?.queues?.overdue?.length ?? 0) === 0 && (
              <div className="text-sm text-muted-foreground">No overdue follow-ups.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inactive Subscriptions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data?.inactiveSubscriptions ?? []).slice(0, 10).map((s: any) => (
              <div key={s.id} className="flex items-start justify-between gap-3 border rounded-md p-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{s.subscriptionNumber}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {s.customer?.businessName || s.customer?.contactPerson}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Last contact: {s.lastContactDate ? formatDate(s.lastContactDate) : "Never"}
                  </div>
                </div>
                <Badge variant="outline">{s.crmStatus}</Badge>
              </div>
            ))}
            {(data?.inactiveSubscriptions?.length ?? 0) === 0 && (
              <div className="text-sm text-muted-foreground">No inactive subscriptions detected.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Manager quick section (safe even if permission lacks; endpoint will 403) */}
      {manager.data && (
        <Card>
          <CardHeader>
            <CardTitle>Manager Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Completion rate (today)</div>
              <div className="text-2xl font-bold">
                {Math.round((manager.data.followUps.completionRate ?? 0) * 100)}%
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Open tickets</div>
              <div className="text-2xl font-bold">{manager.data.tickets.openTickets}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">SLA breached</div>
              <div className="text-2xl font-bold">{manager.data.tickets.slaBreachedTickets}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Feedback attention (30d)</div>
              <div className="text-2xl font-bold">{manager.data.feedbackAttentionLast30Days}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CrmDashboard;
