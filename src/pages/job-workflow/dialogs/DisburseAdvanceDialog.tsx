import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import {
  DisbursementMethod,
} from "@/api/services/advance-requests.service";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  advance: any | null;
  data: { method: DisbursementMethod; reference: string };
  setData: React.Dispatch<
    React.SetStateAction<{ method: DisbursementMethod; reference: string }>
  >;
  onConfirm: () => void;
  submitting: boolean;
};

const DisburseAdvanceDialog = ({
  open,
  onOpenChange,
  advance,
  data,
  setData,
  onConfirm,
  submitting,
}: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Disburse Advance</DialogTitle>
          <DialogDescription>
            Record disbursement details for {advance?.requestNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Method</Label>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={data.method}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  method: e.target.value as DisbursementMethod,
                }))
              }
            >
              <option value={DisbursementMethod.CASH}>Cash</option>
              <option value={DisbursementMethod.MPESA}>M-Pesa</option>
              <option value={DisbursementMethod.BANK_TRANSFER}>
                Bank Transfer
              </option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Reference (optional)</Label>
            <Input
              value={data.reference}
              onChange={(e) =>
                setData((prev) => ({ ...prev, reference: e.target.value }))
              }
              placeholder="Transaction reference"
            />
          </div>

          {advance && (
            <div className="bg-muted p-4 rounded-lg flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Amount:</span>
              <span className="text-xl font-bold text-primary">
                KES {parseFloat(String(advance.amount)).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() =>
              setData({ method: DisbursementMethod.MPESA, reference: "" })
            }
          >
            Reset
          </Button>

          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Disbursement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DisburseAdvanceDialog;
