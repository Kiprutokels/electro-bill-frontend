import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CustomerSearchCombobox from "@/components/jobs/CustomerSearchCombobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

const CATEGORIES = ["TECHNICAL", "BILLING", "SUPPORT", "TRAINING", "OTHER"] as const;
const PRIORITIES = ["LOW", "NORMAL", "HIGH", "CRITICAL"] as const;

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
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Customer</div>
            <CustomerSearchCombobox
              value={form.customerId}
              onValueChange={(v) => setForm({ ...form, customerId: v })}
              placeholder="Search customer..."
            />
          </div>

          <Input
            placeholder="Subscription ID (optional)"
            value={form.subscriptionId}
            onChange={(e) => setForm({ ...form, subscriptionId: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Category</div>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Priority</div>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm({ ...form, priority: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Input
            placeholder="Subject"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
          <Input
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-2 pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={loading || !form.customerId || !form.subject || !form.description}
            onClick={() => onSubmit({ ...form, subscriptionId: form.subscriptionId || undefined })}
          >
            {loading ? "Creating..." : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTicketDialog;