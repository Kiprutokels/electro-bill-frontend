import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FeedbackFormDialog = ({
  open,
  onOpenChange,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (payload: any) => Promise<void>;
  loading?: boolean;
}) => {
  const [form, setForm] = useState<any>({
    subscriptionId: "",
    customerId: "",
    satisfactionScore: 5,
    recommendationScore: 10,
    category: "GENERAL",
    negativeComments: "",
    submittedVia: "FORM",
    isAnonymous: false,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Submit Feedback</DialogTitle></DialogHeader>

        <div className="space-y-3">
          <Input placeholder="Subscription ID" value={form.subscriptionId} onChange={(e) => setForm({ ...form, subscriptionId: e.target.value })} />
          <Input placeholder="Customer ID" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} />
          <Input placeholder="Satisfaction (1-5)" value={form.satisfactionScore} onChange={(e) => setForm({ ...form, satisfactionScore: Number(e.target.value) })} />
          <Input placeholder="Recommendation (1-10)" value={form.recommendationScore} onChange={(e) => setForm({ ...form, recommendationScore: Number(e.target.value) })} />
          <Input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <Input placeholder="Negative comments" value={form.negativeComments} onChange={(e) => setForm({ ...form, negativeComments: e.target.value })} />
        </div>

        <div className="flex justify-end gap-2 pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={loading || !form.subscriptionId || !form.customerId}
            onClick={() => onSubmit(form)}
          >
            {loading ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackFormDialog;
