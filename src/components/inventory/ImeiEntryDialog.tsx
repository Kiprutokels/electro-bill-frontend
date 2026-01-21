import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, Smartphone } from "lucide-react";
import { ImeiNumberInput } from "@/api/types/imei.types";
import { toast } from "sonner";

interface ImeiEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredCount: number;
  onConfirm: (imeiNumbers: ImeiNumberInput[]) => void;
  productName: string;


  allowSkip?: boolean;

  resetOnOpen?: boolean;

  autoGenerateRows?: boolean;
}

const ImeiEntryDialog: React.FC<ImeiEntryDialogProps> = ({
  open,
  onOpenChange,
  requiredCount,
  onConfirm,
  productName,
  allowSkip = true,
  resetOnOpen = true,
  autoGenerateRows = true,
}) => {
  const [imeiEntries, setImeiEntries] = useState<ImeiNumberInput[]>([]);

  // Create exactly N rows
  const buildRows = (count: number): ImeiNumberInput[] =>
    Array.from({ length: Math.max(0, count) }, () => ({
      imeiNumber: "",
      notes: "",
    }));

  /**
   * ✅ Auto-generate rows when dialog opens:
   * - If resetOnOpen: always rebuild
   * - Also rebuild if requiredCount changes while open (rare but safe)
   */
  useEffect(() => {
    if (!open) return;

    if (!autoGenerateRows) {
      if (resetOnOpen) setImeiEntries([]);
      return;
    }

    // Always ensure we have exactly requiredCount rows
    setImeiEntries((prev) => {
      if (!resetOnOpen && prev.length === requiredCount) return prev;
      return buildRows(requiredCount);
    });
  }, [open, requiredCount, resetOnOpen, autoGenerateRows]);

  const filledCount = useMemo(
    () => imeiEntries.filter((e) => e.imeiNumber.trim().length > 0).length,
    [imeiEntries]
  );

  const handleRemoveImei = (index: number) => {
    // If autoGenerateRows is ON, we shouldn't allow removing rows,
    // because we must keep exactly requiredCount rows.
    if (autoGenerateRows) return;

    setImeiEntries(imeiEntries.filter((_, i) => i !== index));
  };

  const handleImeiChange = (
    index: number,
    field: keyof ImeiNumberInput,
    value: string
  ) => {
    setImeiEntries((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const validateBeforeConfirm = (): boolean => {
    if (imeiEntries.length !== requiredCount) {
      toast.error(`Expected ${requiredCount} rows but got ${imeiEntries.length}`);
      return false;
    }

    // Must fill all IMEIs (if requiredCount > 0 and user is confirming)
    const emptyImeis = imeiEntries.filter((entry) => !entry.imeiNumber.trim());
    if (emptyImeis.length > 0) {
      toast.error("Please fill all IMEI numbers");
      return false;
    }

    // Validate 15 digits
    const invalidImeis = imeiEntries.filter(
      (entry) => !/^\d{15}$/.test(entry.imeiNumber.trim())
    );
    if (invalidImeis.length > 0) {
      toast.error("IMEI numbers must be exactly 15 digits");
      return false;
    }

    // Check duplicates
    const imeiNumbers = imeiEntries.map((e) => e.imeiNumber.trim());
    const uniqueImeis = new Set(imeiNumbers);
    if (uniqueImeis.size !== imeiNumbers.length) {
      toast.error("Duplicate IMEI numbers found");
      return false;
    }

    return true;
  };

  const handleConfirm = () => {
    if (!validateBeforeConfirm()) return;

    onConfirm(
      imeiEntries.map((e) => ({
        imeiNumber: e.imeiNumber.trim(),
        notes: e.notes?.trim() || undefined,
      }))
    );

    onOpenChange(false);

    // Clear after closing (optional)
    setImeiEntries([]);
  };

  const handleSkip = () => {
    if (!allowSkip) {
      toast.error("IMEI entry is required for this batch");
      return;
    }
    onConfirm([]);
    onOpenChange(false);
    setImeiEntries([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Add IMEI Numbers
          </DialogTitle>
          <DialogDescription>
            Enter IMEI numbers for <strong>{requiredCount}</strong> unit(s) of{" "}
            <strong>{productName}</strong>.
            <br />
            <span className="text-xs text-muted-foreground">
              IMEI must be 15 digits.
              {!allowSkip && " This is required for this batch."}
              {autoGenerateRows && " Rows are auto-generated for you."}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline">
              {filledCount} / {requiredCount} filled
            </Badge>

            <Badge variant={filledCount === requiredCount ? "default" : "secondary"}>
              {autoGenerateRows ? "Auto Rows" : "Manual Rows"}
            </Badge>
          </div>

          <div className="border rounded-lg p-4 space-y-3 max-h-96 overflow-y-auto">
            {requiredCount === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                No IMEIs required (quantity is 0).
              </div>
            ) : (
              imeiEntries.map((entry, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      IMEI #{index + 1}
                    </Label>

                    {/* Only show remove if manual mode */}
                    {!autoGenerateRows && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveImei(index)}
                        className="text-destructive h-6 w-6 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <Input
                    placeholder="Enter 15-digit IMEI number"
                    value={entry.imeiNumber}
                    onChange={(e) =>
                      handleImeiChange(
                        index,
                        "imeiNumber",
                        e.target.value.replace(/\D/g, "").slice(0, 15)
                      )
                    }
                    maxLength={15}
                    className="font-mono"
                  />

                  <Textarea
                    placeholder="Optional notes about this device"
                    value={entry.notes || ""}
                    onChange={(e) =>
                      handleImeiChange(index, "notes", e.target.value)
                    }
                    rows={2}
                    className="text-sm"
                  />
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          {allowSkip && (
            <Button type="button" variant="outline" onClick={handleSkip}>
              Skip (No IMEI)
            </Button>
          )}
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={requiredCount > 0 && filledCount === 0}
          >
            Confirm ({filledCount}/{requiredCount})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImeiEntryDialog;
