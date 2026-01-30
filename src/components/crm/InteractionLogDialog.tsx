import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const InteractionLogDialog = ({
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
    interactionType: "CALL",
    channel: "PHONE",
    notes: "",
    outcome: "SUCCESSFUL",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Log Interaction</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Subscription ID" value={form.subscriptionId} onChange={(e) => setForm({ ...form, subscriptionId: e.target.value })} />
          <Input placeholder="Customer ID" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} />
          <Input placeholder="Type (CALL/EMAIL/...)" value={form.interactionType} onChange={(e) => setForm({ ...form, interactionType: e.target.value })} />
          <Input placeholder="Channel" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} />
          <Input placeholder="Outcome" value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })} />
          <Input placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2 pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={loading || !form.subscriptionId || !form.customerId || !form.notes.trim()} onClick={() => onSubmit(form)}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InteractionLogDialog;
