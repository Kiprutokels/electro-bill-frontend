import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { subscriptionsService } from "@/api/services/subscriptions.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle, CalendarCheck, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/utils/format.utils";

function followUpBadge(nextFollowUpDate?: string | null) {
  if (!nextFollowUpDate) return <Badge variant="outline">No schedule</Badge>;
  const now = new Date();
  const d = new Date(nextFollowUpDate);
  const startToday = new Date(); startToday.setHours(0,0,0,0);
  const endToday = new Date(); endToday.setHours(23,59,59,999);

  if (d < startToday) return <Badge className="bg-red-500 text-white">OVERDUE</Badge>;
  if (d >= startToday && d <= endToday) return <Badge className="bg-green-500 text-white">TODAY</Badge>;

  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000*60*60*24));
  if (diffDays <= 7) return <Badge className="bg-yellow-500 text-white">IN {diffDays}d</Badge>;
  return <Badge variant="outline">IN {diffDays}d</Badge>;
}

export default function MySubscriptions() {
  const [search, setSearch] = useState("");

  const q = useQuery({
    queryKey: ["my-subscriptions", search],
    queryFn: () => subscriptionsService.mySubscriptions({ page: 1, limit: 50, search }),
  });

  if (q.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const rows = q.data?.data ?? [];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">My Subscriptions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your portfolio (sorted by follow-up date)
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle>Portfolio</CardTitle>
          <Input
            className="sm:w-72"
            placeholder="Search customer/subscription/product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.length === 0 ? (
            <div className="text-sm text-muted-foreground">No assigned subscriptions.</div>
          ) : (
            rows.map((s: any) => (
              <div key={s.id} className="border rounded-md p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-mono font-semibold">{s.subscriptionNumber}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {s.customer?.businessName || s.customer?.contactPerson} • {s.product?.name} ({s.status})
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Expiry: {formatDate(s.expiryDate)} • CRM: {s.crmStatus || "ACTIVE"} • Priority: {s.priority || "NORMAL"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {followUpBadge(s.nextFollowUpDate)}
                  <Badge variant="outline">{formatDate(s.nextFollowUpDate) || "—"}</Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Due Today</CardTitle>
            <CalendarCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rows.filter((r: any) => {
                if (!r.nextFollowUpDate) return false;
                const d = new Date(r.nextFollowUpDate);
                const start = new Date(); start.setHours(0,0,0,0);
                const end = new Date(); end.setHours(23,59,59,999);
                return d >= start && d <= end;
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rows.filter((r: any) => r.nextFollowUpDate && new Date(r.nextFollowUpDate) < new Date(new Date().setHours(0,0,0,0))).length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Upcoming (7d)</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rows.filter((r: any) => {
                if (!r.nextFollowUpDate) return false;
                const d = new Date(r.nextFollowUpDate);
                const now = new Date();
                const end = new Date(); end.setDate(end.getDate()+7);
                return d >= now && d <= end;
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
