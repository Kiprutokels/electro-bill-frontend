import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mail } from "lucide-react";
import { invoicesService, InvoiceStatus, Invoice } from "@/api/services/invoices.service";
import { toast } from "sonner";

interface SendInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
  onAfterSent?: () => void;
  onAfterStatusUpdated?: (updated: Invoice) => void;
}

const SendInvoiceDialog: React.FC<SendInvoiceDialogProps> = ({
  open,
  onOpenChange,
  invoice,
  onAfterSent,
  onAfterStatusUpdated,
}) => {
  const [sending, setSending] = useState(false);
  const [sendToEmail, setSendToEmail] = useState("");
  const [message, setMessage] = useState("");

  const canMarkSent = useMemo(() => invoice.status === InvoiceStatus.DRAFT, [invoice.status]);

  const handleSend = async () => {
    setSending(true);
    try {
      await invoicesService.sendInvoice(invoice.id, {
        sendToEmail: sendToEmail.trim() ? sendToEmail.trim() : undefined,
        message: message.trim() ? message.trim() : undefined,
      });

      toast.success("Invoice email sent (PDF attached).");

      if (canMarkSent) {
        const updated = await invoicesService.updateStatus(invoice.id, InvoiceStatus.SENT);
        toast.success("Invoice marked as SENT.");
        onAfterStatusUpdated?.(updated);
      }

      onAfterSent?.();
      onOpenChange(false);
      setSendToEmail("");
      setMessage("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send invoice");
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
            Send Invoice - {invoice.invoiceNumber}
          </DialogTitle>
          <DialogDescription>
            Sends invoice PDF as attachment to customer + admin emails. You can add an extra email below.
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
            <Button
              onClick={handleSend}
              disabled={sending}
              className="flex-1"
            >
              {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {sending ? "Sending..." : canMarkSent ? "Send & Mark SENT" : "Send Invoice"}
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
              Note: Invoice is already {invoice.status}. We will send email only.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendInvoiceDialog;