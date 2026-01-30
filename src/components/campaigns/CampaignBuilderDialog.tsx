import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CampaignBuilderDialog = ({
  open,
  onOpenChange,
  onSubmit,
  onPreview,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (payload: any) => Promise<void>;
  onPreview: (criteria: any) => Promise<any>;
  loading?: boolean;
}) => {
  const [form, setForm] = useState<any>({
    name: "",
    description: "",
    channel: "SMS",
    subject: "",
    message: "",
    targetCriteria: { crmStatus: "ACTIVE", limit: 200 },
  });

  const [preview, setPreview] = useState<any>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Create Campaign</DialogTitle></DialogHeader>

        <div className="space-y-3">
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input placeholder="Channel (SMS/EMAIL/WHATSAPP/MULTI_CHANNEL)" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} />
          <Input placeholder="Subject (email optional)" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <Input placeholder="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <Input
            placeholder='Target criteria JSON (e.g. {"crmStatus":"ACTIVE","inactiveDays":90})'
            value={JSON.stringify(form.targetCriteria)}
            onChange={(e) => {
              try {
                setForm({ ...form, targetCriteria: JSON.parse(e.target.value) });
              } catch {
                // ignore invalid JSON while typing
              }
            }}
          />
        </div>

        <div className="flex gap-2 pt-3">
          <Button
            variant="outline"
            onClick={async () => {
              const p = await onPreview(form.targetCriteria);
              setPreview(p);
            }}
          >
            Preview recipients
          </Button>
          <Button
            disabled={loading || !form.name || !form.message}
            onClick={() => onSubmit(form)}
          >
            {loading ? "Creating..." : "Create"}
          </Button>
        </div>

        {preview && (
          <div className="pt-3 text-sm text-muted-foreground">
            Preview: {preview.count} recipients
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CampaignBuilderDialog;
