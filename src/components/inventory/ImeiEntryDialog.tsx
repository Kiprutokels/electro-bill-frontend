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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Smartphone } from "lucide-react";
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

  // Auto-generate exactly requiredCount rows on open
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
  const [bulkText, setBulkText] = useState("");
  const [entryMode, setEntryMode] = useState<"manual" | "paste">("manual");

  const buildRows = (count: number): ImeiNumberInput[] =>
    Array.from({ length: Math.max(0, count) }, () => ({
      imeiNumber: "",
      notes: "",
    }));

  //  Auto-generate rows when dialog opens
  useEffect(() => {
    if (!open) return;

    if (resetOnOpen) {
      setBulkText("");
      setEntryMode("manual");
    }

    if (!autoGenerateRows) {
      if (resetOnOpen) setImeiEntries([]);
      return;
    }

    setImeiEntries((prev) => {
      if (!resetOnOpen && prev.length === requiredCount) return prev;
      return buildRows(requiredCount);
    });
  }, [open, requiredCount, resetOnOpen, autoGenerateRows]);

  const filledCount = useMemo(
    () => imeiEntries.filter((e) => e.imeiNumber.trim().length > 0).length,
    [imeiEntries],
  );

  const extractImeisFromText = (text: string): string[] => {
    // Extract any 15-digit sequences from the text
    const matches = text.match(/\d{15}/g) || [];
    return matches.map((m) => m.trim());
  };

  const applyBulkImeis = () => {
    if (requiredCount <= 0) {
      toast.error("Quantity must be greater than 0 to add IMEIs");
      return;
    }

    const imeis = extractImeisFromText(bulkText);

    if (imeis.length === 0) {
      toast.error("No valid 15-digit IMEI numbers found in pasted text");
      return;
    }

    // Validate duplicates in pasted set
    const unique = new Set(imeis);
    if (unique.size !== imeis.length) {
      toast.error("Duplicate IMEI numbers found in pasted text");
      return;
    }

    // Enforce exact count
    if (imeis.length !== requiredCount) {
      toast.error(
        `You pasted ${imeis.length} IMEIs. Please paste exactly ${requiredCount}.`,
      );
      return;
    }

    // Fill rows
    setImeiEntries((prev) => {
      const rows =
        prev.length === requiredCount ? [...prev] : buildRows(requiredCount);
      for (let i = 0; i < requiredCount; i++) {
        rows[i] = { ...rows[i], imeiNumber: imeis[i] };
      }
      return rows;
    });

    toast.success(`Filled ${requiredCount} IMEI rows from paste`);
    setEntryMode("manual");
  };

  const handleImeiChange = (
    index: number,
    field: keyof ImeiNumberInput,
    value: string,
  ) => {
    setImeiEntries((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const validateBeforeConfirm = (): boolean => {
    if (imeiEntries.length !== requiredCount) {
      toast.error(
        `Expected ${requiredCount} rows but got ${imeiEntries.length}`,
      );
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
      (entry) => !/^\d{15}$/.test(entry.imeiNumber.trim()),
    );
    if (invalidImeis.length > 0) {
      toast.error("IMEI numbers must be exactly 15 digits");
      return false;
    }

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
      })),
    );

    onOpenChange(false);
    setImeiEntries([]);
    setBulkText("");
  };

  const handleSkip = () => {
    if (!allowSkip) {
      toast.error("IMEI entry is required for this batch");
      return;
    }
    onConfirm([]);
    onOpenChange(false);
    setImeiEntries([]);
    setBulkText("");
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
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline">
              {filledCount} / {requiredCount} filled
            </Badge>
            <Badge
              variant={filledCount === requiredCount ? "default" : "secondary"}
            >
              {filledCount === requiredCount ? "Ready" : "In Progress"}
            </Badge>
          </div>

          {/* Optional speed workflow */}
          <Tabs value={entryMode} onValueChange={(v) => setEntryMode(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="paste">Paste All</TabsTrigger>
            </TabsList>

            <TabsContent value="paste" className="space-y-3 pt-3">
              <div className="space-y-2">
                <Label>Paste IMEIs (exactly {requiredCount})</Label>
                <Textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={`Paste ${requiredCount} IMEIs here (new lines, spaces or commas supported).`}
                  rows={6}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Tip: you can paste from Excel/Sheets (one per line) or
                  comma-separated. We detect any 15-digit sequences
                  automatically.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBulkText("")}
                >
                  Clear
                </Button>
                <Button type="button" onClick={applyBulkImeis}>
                  Apply to Rows
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="manual" className="pt-3">
              <div className="border rounded-lg p-4 space-y-3 max-h-96 overflow-y-auto">
                {requiredCount === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    No IMEIs required (quantity is 0).
                  </div>
                ) : (
                  imeiEntries.map((entry, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-3 space-y-2"
                    >
                      <Label className="text-sm font-medium">
                        IMEI #{index + 1}
                      </Label>

                      <Input
                        placeholder="Enter 15-digit IMEI number"
                        value={entry.imeiNumber}
                        onChange={(e) =>
                          handleImeiChange(
                            index,
                            "imeiNumber",
                            e.target.value.replace(/\D/g, "").slice(0, 15),
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
            </TabsContent>
          </Tabs>
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
