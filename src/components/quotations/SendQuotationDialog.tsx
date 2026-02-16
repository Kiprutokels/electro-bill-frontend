import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { quotationsService } from "@/api/services/quotations.service";
import { Quotation, QuotationStatus } from "@/api/services/quotations.service";

interface SendQuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: Quotation;
  onAfterSent?: () => void;
  onAfterStatusUpdated?: (updated: Quotation) => void;
}

const SendQuotationDialog: React.FC<SendQuotationDialogProps> = ({
  open,
  onOpenChange,
  quotation,
  onAfterSent,
  onAfterStatusUpdated,
}) => {
  const [sending, setSending] = useState(false);
  const [sendToEmail, setSendToEmail] = useState("");
  const [message, setMessage] = useState("");

  const canMarkSent = useMemo(
    () => quotation.status === QuotationStatus.DRAFT,
    [quotation.status],
  );

  const handleSend = async () => {
    setSending(true);
    try {
      await quotationsService.sendQuotation(quotation.id, {
        sendToEmail: sendToEmail.trim() ? sendToEmail.trim() : undefined,
        message: message.trim() ? message.trim() : undefined,
      });

      toast.success("Quotation email sent (PDF attached).");

      if (canMarkSent) {
        const updated = await quotationsService.updateStatus(
          quotation.id,
          QuotationStatus.SENT
        );
        toast.success("Quotation marked as SENT.");
        onAfterStatusUpdated?.(updated);
      }

      onAfterSent?.();
      onOpenChange(false);
      setSendToEmail("");
      setMessage("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send quotation");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !sending && onOpenChange(v)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Quotation - {quotation.quotationNumber}
          </DialogTitle>
          <DialogDescription>
            Sends quotation PDF as attachment to customer + admin emails. You can add an extra email below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="sendToEmail">Additional Email (optional)</Label>
            <Input
              id="sendToEmail"
              type="email"
              placeholder="e.g. finance@client.com"
              value={sendToEmail}
              onChange={(e) => setSendToEmail(e.target.value)}
              disabled={sending}
            />
          </div>

          <div>
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a short note to include in the email..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              disabled={sending}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button onClick={handleSend} disabled={sending} className="flex-1">
              {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {sending ? "Sending..." : canMarkSent ? "Send & Mark SENT" : "Send Quotation"}
            </Button>

            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={sending}
              className="flex-1 sm:flex-initial"
            >
              Cancel
            </Button>
          </div>

          {!canMarkSent && (
            <p className="text-xs text-muted-foreground">
              Note: Quotation is already {quotation.status}. We will send email only.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendQuotationDialog;