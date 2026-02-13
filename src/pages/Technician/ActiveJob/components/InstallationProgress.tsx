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
import {
  MapPin,
  Save,
  Loader2,
  RotateCcw,
  Info,
  CheckCircle2,
} from "lucide-react";
import { technicianJobsService } from "@/api/services/technician-jobs.service";
import { JobType } from "@/api/services/jobs.service";

interface InstallationProgressProps {
  job: any;
  onComplete?: () => void;
}

const normalizeImei = (s: string) => String(s || "").trim();

const InstallationProgress = ({
  job,
  onComplete,
}: InstallationProgressProps) => {
  const queryClient = useQueryClient();

  // Issued IMEIs come from requisition-issued devices that backend mapped to jobDevices
  const issuedImeis: string[] = useMemo(() => {
    const arr = Array.isArray(job?.jobDevices) ? job.jobDevices : [];
    const normalized = arr
      .map((jd: any) => jd?.deviceImei || jd?.device?.imeiNumber)
      .map(normalizeImei)
      .filter(Boolean);
    return Array.from(new Set(normalized));
  }, [job?.jobDevices]);

  const isRepairOrMaintenance = [JobType.REPAIR, JobType.MAINTENANCE].includes(
    job.jobType,
  );

  const [deviceChanged, setDeviceChanged] = useState(
    job.deviceChanged ?? false,
  );

  // Default select all issued (you can change to none if you prefer)
  const [selectedImeis, setSelectedImeis] = useState<string[]>(issuedImeis);

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
        imeiNumbers: selectedImeis,
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
      onComplete?.();
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

  const imeiRequired = !isRepairOrMaintenance || deviceChanged;

  const toggleImei = (imei: string) => {
    setSelectedImeis((prev) =>
      prev.includes(imei) ? prev.filter((x) => x !== imei) : [...prev, imei],
    );
  };

  const resetToIssued = () => {
    setSelectedImeis(issuedImeis);
    toast.success("Reset to issued devices");
  };

  const handleSave = () => {
    if (photoUrls.length === 0) {
      toast.error("Please upload at least one photo");
      return;
    }

    if (imeiRequired && selectedImeis.length === 0) {
      toast.error("Please select at least one IMEI");
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
          {/* IMEI selection */}
          {imeiRequired && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Label className="text-sm">
                  Issued Devices (IMEIs){" "}
                  <span className="text-destructive">*</span>
                </Label>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="font-semibold">
                    {selectedImeis.length} selected
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

              <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-xs text-blue-700 dark:text-blue-300 ml-2">
                  You can only confirm devices that were issued to this job via
                  requisitions. If you need more devices, request them first.
                </AlertDescription>
              </Alert>

              {issuedImeis.length === 0 ? (
                <Alert className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
                  <AlertDescription className="text-sm text-orange-700 dark:text-orange-300">
                    No devices have been issued for this job yet. Ask
                    admin/store to issue devices against your requisition.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {issuedImeis.map((imei) => {
                    const active = selectedImeis.includes(imei);
                    return (
                      <button
                        key={imei}
                        type="button"
                        onClick={() => toggleImei(imei)}
                        className={[
                          "w-full text-left rounded-lg border p-3 transition-colors",
                          "flex items-center justify-between gap-3",
                          active
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                            : "border-border bg-background hover:bg-muted/40",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <CheckCircle2
                            className={[
                              "h-5 w-5 flex-shrink-0",
                              active
                                ? "text-green-600"
                                : "text-muted-foreground",
                            ].join(" ")}
                          />
                          <div className="min-w-0">
                            <div className="font-mono text-sm truncate">
                              {imei}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {active ? "Selected" : "Tap to select"}
                            </div>
                          </div>
                        </div>
                        <Badge variant={active ? "default" : "outline"}>
                          {active ? "Use" : "Skip"}
                        </Badge>
                      </button>
                    );
                  })}
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
