import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FollowUpCompleteDialog = ({
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
  const [payload, setPayload] = useState<any>({
    interactionType: "CALL",
    channel: "PHONE",
    notes: "",
    outcome: "SUCCESSFUL",
    nextFollowUpDateOverride: "",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Complete Follow-up (logs interaction)</DialogTitle></DialogHeader>

        <div className="space-y-3">
          <Input placeholder="Interaction Type (CALL/EMAIL/WHATSAPP/...)" value={payload.interactionType} onChange={(e) => setPayload({ ...payload, interactionType: e.target.value })} />
          <Input placeholder="Channel (PHONE/EMAIL/WHATSAPP/...)" value={payload.channel} onChange={(e) => setPayload({ ...payload, channel: e.target.value })} />
          <Input placeholder="Outcome (SUCCESSFUL/NO_RESPONSE/...)" value={payload.outcome} onChange={(e) => setPayload({ ...payload, outcome: e.target.value })} />
          <Input placeholder="Notes (required)" value={payload.notes} onChange={(e) => setPayload({ ...payload, notes: e.target.value })} />
          <Input placeholder="Next follow-up date override (ISO, optional)" value={payload.nextFollowUpDateOverride} onChange={(e) => setPayload({ ...payload, nextFollowUpDateOverride: e.target.value })} />
        </div>

        <div className="flex justify-end gap-2 pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={loading || !payload.notes.trim()} onClick={() => onSubmit(payload)}>
            {loading ? "Completing..." : "Complete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FollowUpCompleteDialog;
