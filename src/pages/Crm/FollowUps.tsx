import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, CheckCircle } from "lucide-react";
import { useCrmFollowUps } from "@/hooks/useCrmFollowUps";
import { formatDate } from "@/utils/format.utils";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import FollowUpCompleteDialog from "@/components/crm/FollowUpCompleteDialog";
import CreateFollowUpDialog from "@/components/crm/CreateFollowUpDialog";

const CrmFollowUps = () => {
  const [search, setSearch] = useState("");
  const [completeTaskId, setCompleteTaskId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { list, complete, create } = useCrmFollowUps({ page: 1, limit: 50, search });

  if (list.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const tasks = list.data?.data ?? [];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Follow-ups</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Task-driven CRM workflow (completion requires interaction logging)
          </p>
        </div>

        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Follow-up
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle>Follow-up Tasks</CardTitle>
          <Input
            className="sm:w-72"
            placeholder="Search task, customer, subscription..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        No follow-ups found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tasks.map((t: any) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.title}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {t.subscription?.subscriptionNumber ?? "—"}
                        </TableCell>
                        <TableCell>
                          {t.customer?.businessName || t.customer?.contactPerson || "—"}
                        </TableCell>
                        <TableCell>{formatDate(t.dueDate)}</TableCell>
                        <TableCell>{t.status}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={t.status === "COMPLETED"}
                            onClick={() => setCompleteTaskId(t.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Complete
                          </Button>
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

      <CreateFollowUpDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={async (payload) => {
          try {
            await create.mutateAsync(payload);
            toast.success("Follow-up created");
            setCreateOpen(false);
          } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to create follow-up");
          }
        }}
        loading={create.isPending}
      />

      <FollowUpCompleteDialog
        open={!!completeTaskId}
        onOpenChange={(v) => !v && setCompleteTaskId(null)}
        onSubmit={async (payload) => {
          if (!completeTaskId) return;
          try {
            await complete.mutateAsync({ id: completeTaskId, data: payload });
            toast.success("Follow-up completed (interaction logged)");
            setCompleteTaskId(null);
          } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to complete follow-up");
          }
        }}
        loading={complete.isPending}
      />
    </div>
  );
};

export default CrmFollowUps;
