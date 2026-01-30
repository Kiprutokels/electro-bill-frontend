import { useState } from "react";
import { useCrmInteractions } from "@/hooks/useCrmInteractions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import InteractionLogDialog from "@/components/crm/InteractionLogDialog";
import { formatDate } from "@/utils/format.utils";

const CrmInteractions = () => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const { list, create } = useCrmInteractions({ page: 1, limit: 50, search });

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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Interactions</h1>
          <p className="text-sm text-muted-foreground mt-1">Immutable interaction history</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Log Interaction
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle>Interaction Log</CardTitle>
          <Input className="sm:w-72" placeholder="Search notes/channel..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((i: any) => (
            <div key={i.id} className="border rounded-md p-3">
              <div className="text-xs text-muted-foreground">
                {formatDate(i.interactionDate)} • {i.interactionType} • {i.channel} • {i.user?.firstName} {i.user?.lastName}
              </div>
              <div className="text-sm font-mono">{i.subscription?.subscriptionNumber}</div>
              <div className="text-sm whitespace-pre-wrap mt-1">{i.notes}</div>
            </div>
          ))}
          {items.length === 0 && <div className="text-sm text-muted-foreground">No interactions found.</div>}
        </CardContent>
      </Card>

      <InteractionLogDialog
        open={open}
        onOpenChange={setOpen}
        loading={create.isPending}
        onSubmit={async (payload) => {
          try {
            await create.mutateAsync(payload);
            toast.success("Interaction logged");
            setOpen(false);
          } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to log interaction");
          }
        }}
      />
    </div>
  );
};

export default CrmInteractions;
