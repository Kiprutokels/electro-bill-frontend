import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/ui/file-upload";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { MapPin, Save, Loader2, RotateCcw, Plus, X, Info } from "lucide-react";
import { technicianJobsService } from "@/api/services/technician-jobs.service";
import { JobType } from "@/api/services/jobs.service";

interface InstallationProgressProps {
  job: any;
  onComplete?: () => void;
}

const normalizeImei = (s: string) => s.trim();

const InstallationProgress = ({
  job,
  onComplete,
}: InstallationProgressProps) => {
  const queryClient = useQueryClient();

  // Issued IMEIs
  const issuedImeis: string[] = useMemo(() => {
    const arr = Array.isArray(job.imeiNumbers) ? job.imeiNumbers : [];
    const normalized = arr
      .filter((item): item is string => typeof item === "string")
      .map(normalizeImei)
      .filter(Boolean);
    return Array.from(new Set(normalized));
  }, [job.imeiNumbers]);

  // REPAIR/MAINTENANCE: ask technician "was device changed?"
  const isRepairOrMaintenance = [JobType.REPAIR, JobType.MAINTENANCE].includes(
    job.jobType,
  );

  const [deviceChanged, setDeviceChanged] = useState(
    job.deviceChanged ?? false,
  );
  const [imeiList, setImeiList] = useState<string[]>(issuedImeis);
  const [imeiDraft, setImeiDraft] = useState("");

  const [formData, setFormData] = useState({
    simCardIccid: job.simCardIccid || "",
    macAddress: job.macAddress || "",
    gpsCoordinates: job.gpsCoordinates || "",
    installationNotes: job.installationNotes || "",
    installationLocation: job.installationLocation || "",
    installationAddress: job.installationAddress || "",
  });

  const [photoUrls, setPhotoUrls] = useState<string[]>(job.photoUrls || []);

  const updateMutation = useMutation({
    mutationFn: async () => {
      return technicianJobsService.updateJobProgress(job.id, {
        imeiNumbers: imeiList,
        simCardIccid: formData.simCardIccid || undefined,
        macAddress: formData.macAddress || undefined,
        gpsCoordinates: formData.gpsCoordinates || undefined,
        installationNotes: formData.installationNotes || undefined,
        photoUrls: photoUrls,
        installationLocation: formData.installationLocation || undefined,
        installationAddress: formData.installationAddress || undefined,
        deviceChanged: deviceChanged,
      } as any);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["active-job"] });
      await queryClient.invalidateQueries({ queryKey: ["job-by-id", job.id] });
      toast.success("Installation progress saved");
      if (onComplete) onComplete();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update progress");
    },
  });

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = `${position.coords.latitude}, ${position.coords.longitude}`;
        setFormData((p) => ({ ...p, gpsCoordinates: coords }));
        toast.success("Location captured");
      },
      () => {
        toast.error("Unable to get your location");
      },
    );
  };

  const addImei = () => {
    const cleaned = normalizeImei(imeiDraft);

    if (!cleaned) {
      return;
    }

    if (imeiList.includes(cleaned)) {
      toast.error("IMEI already added");
      return;
    }

    setImeiList((p) => [...p, cleaned]);
    setImeiDraft("");
  };

  const removeImei = (imei: string) => {
    setImeiList((p) => p.filter((x) => x !== imei));
  };

  const resetToIssued = () => {
    setImeiList(issuedImeis);
    toast.success("Reset to issued IMEIs");
  };

  const prefillImei = (imei: string) => {
    setImeiDraft(imei);
  };

  const handleSave = () => {
    if (photoUrls.length === 0) {
      toast.error("Please upload at least one photo");
      return;
    }

    const imeiRequired = !isRepairOrMaintenance || deviceChanged;

    if (imeiRequired && imeiList.length === 0) {
      toast.error("Please add at least one IMEI");
      return;
    }

    updateMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Device Changed Toggle (for REPAIR/MAINTENANCE) */}
      {isRepairOrMaintenance && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Repair Assessment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
              <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-xs text-amber-700 dark:text-amber-300 ml-2">
                For <strong>REPAIR/MAINTENANCE</strong> jobs: if no device was
                replaced, you can skip IMEI details. Photos are always required.
              </AlertDescription>
            </Alert>

            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <input
                type="checkbox"
                id="deviceChanged"
                checked={deviceChanged}
                onChange={(e) => setDeviceChanged(e.target.checked)}
                className="h-5 w-5"
              />
              <Label
                htmlFor="deviceChanged"
                className="cursor-pointer text-base font-medium"
              >
                Device was replaced / changed
              </Label>
            </div>

            {!deviceChanged && (
              <div className="text-xs text-muted-foreground">
                IMEI and SIM/MAC fields are hidden. Photos + notes are required.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Installation Info */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-lg md:text-xl">
              Installation Details
            </CardTitle>
            <Badge className="bg-purple-500 w-fit">In Progress</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* IMEIs (conditionally hidden) */}
          {(!isRepairOrMaintenance || deviceChanged) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Label className="text-sm">
                  IMEI Numbers <span className="text-destructive">*</span>
                </Label>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="font-semibold">
                    {imeiList.length} IMEI{imeiList.length !== 1 ? "s" : ""}
                  </Badge>
                  {issuedImeis.length > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={resetToIssued}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reset
                    </Button>
                  )}
                </div>
              </div>

              {issuedImeis.length > 0 && (
                <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                  Preloaded from issued devices. Tap an IMEI below to confirm.
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  value={imeiDraft}
                  onChange={(e) => setImeiDraft(e.target.value)}
                  placeholder="Enter IMEI then tap Add"
                  className="font-mono text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addImei();
                    }
                  }}
                />
                <Button type="button" onClick={addImei} variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>

              {imeiList.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {imeiList.map((imei) => (
                    <span
                      key={imei}
                      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-mono bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                      onClick={() => prefillImei(imei)}
                      title="Click to edit this IMEI"
                    >
                      ✅ {imei}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImei(imei);
                        }}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={`Remove ${imei}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SIM / MAC (optional, conditionally hidden) */}
          {(!isRepairOrMaintenance || deviceChanged) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">SIM Card ICCID (optional)</Label>
                <Input
                  value={formData.simCardIccid}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, simCardIccid: e.target.value }))
                  }
                  className="font-mono text-sm"
                  placeholder="e.g., 8925402..."
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">MAC Address (optional)</Label>
                <Input
                  value={formData.macAddress}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, macAddress: e.target.value }))
                  }
                  className="font-mono text-sm"
                  placeholder="00:1A:2B:..."
                />
              </div>
            </div>
          )}

          {/* Location + GPS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Installation Location</Label>
              <Input
                value={formData.installationLocation}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    installationLocation: e.target.value,
                  }))
                }
                placeholder="e.g., THIKA"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">GPS Coordinates</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.gpsCoordinates}
                  readOnly
                  placeholder="Lat, Long"
                  className="text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={getCurrentLocation}
                >
                  <MapPin className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Capture</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Installation Address</Label>
            <Input
              value={formData.installationAddress}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  installationAddress: e.target.value,
                }))
              }
              placeholder="e.g., Client yard near gate"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Installation / Repair Notes</Label>
            <Textarea
              value={formData.installationNotes}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  installationNotes: e.target.value,
                }))
              }
              rows={4}
              placeholder="Describe work performed..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">
            Photos <span className="text-destructive">*</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload photos of the completed work (required)
          </p>
        </CardHeader>
        <CardContent>
          <FileUpload
            value={photoUrls}
            onChange={setPhotoUrls}
            maxFiles={10}
            accept="image/*"
            label="Photos"
            required
          />
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          size="lg"
          className="w-full sm:w-auto"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save & Continue
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default InstallationProgress;
