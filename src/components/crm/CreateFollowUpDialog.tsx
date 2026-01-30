import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CreateFollowUpDialog = ({
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
    assignedTo: "",
    title: "Follow-up",
    dueDate: new Date().toISOString(),
    priority: "NORMAL",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Create Follow-up</DialogTitle></DialogHeader>

        <div className="space-y-3">
          <Input placeholder="Subscription ID" value={form.subscriptionId} onChange={(e) => setForm({ ...form, subscriptionId: e.target.value })} />
          <Input placeholder="Customer ID" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} />
          <Input placeholder="Assigned To (User ID)" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} />
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input placeholder="Due Date (ISO)" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <Input placeholder="Priority (LOW/NORMAL/HIGH/CRITICAL)" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
        </div>

        <div className="flex justify-end gap-2 pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={loading} onClick={() => onSubmit(form)}>
            {loading ? "Creating..." : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFollowUpDialog;
