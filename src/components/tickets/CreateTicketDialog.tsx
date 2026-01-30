import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CreateTicketDialog = ({
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
    customerId: "",
    subscriptionId: "",
    category: "SUPPORT",
    priority: "NORMAL",
    subject: "",
    description: "",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Create Ticket</DialogTitle></DialogHeader>

        <div className="space-y-3">
          <Input placeholder="Customer ID" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} />
          <Input placeholder="Subscription ID (optional)" value={form.subscriptionId} onChange={(e) => setForm({ ...form, subscriptionId: e.target.value })} />
          <Input placeholder="Category (TECHNICAL/BILLING/SUPPORT/...)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <Input placeholder="Priority (LOW/NORMAL/HIGH/CRITICAL)" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
          <Input placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        <div className="flex justify-end gap-2 pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={loading || !form.customerId || !form.subject || !form.description} onClick={() => onSubmit({ ...form, subscriptionId: form.subscriptionId || undefined })}>
            {loading ? "Creating..." : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTicketDialog;
