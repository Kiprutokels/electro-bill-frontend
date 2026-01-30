import { useState } from "react";
import { useFeedback } from "@/hooks/useFeedback";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import FeedbackFormDialog from "@/components/feedback/FeedbackFormDialog";

const Feedback = () => {
  const [open, setOpen] = useState(false);
  const { list, create } = useFeedback({ page: 1, limit: 50 });

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Feedback</h1>
          <p className="text-sm text-muted-foreground mt-1">Satisfaction + recommendation tracking</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Feedback
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Feedback Records</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {items.map((f: any) => (
            <div key={f.id} className="border rounded-md p-3">
              <div className="text-xs text-muted-foreground">
                {f.category} • Sat {f.satisfactionScore}/5 • NPS {f.recommendationScore}/10 • {new Date(f.createdAt).toLocaleString()}
              </div>
              <div className="text-sm font-mono">{f.subscription?.subscriptionNumber}</div>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">{f.negativeComments || f.improvements || "—"}</div>
            </div>
          ))}
          {items.length === 0 && <div className="text-sm text-muted-foreground">No feedback yet.</div>}
        </CardContent>
      </Card>

      <FeedbackFormDialog
        open={open}
        onOpenChange={setOpen}
        loading={create.isPending}
        onSubmit={async (payload) => {
          try {
            await create.mutateAsync(payload);
            toast.success("Feedback submitted");
            setOpen(false);
          } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to submit feedback");
          }
        }}
      />
    </div>
  );
};

export default Feedback;
