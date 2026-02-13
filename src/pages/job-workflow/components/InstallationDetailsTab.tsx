import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, Info, CheckCircle } from "lucide-react";
import { Label } from "@/components/ui/label";

const safeJsonArray = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const InstallationDetailsTab = ({ job }: { job: any }) => {
  const imeis = useMemo(() => {
    const arr = Array.isArray(job?.jobDevices) ? job.jobDevices : [];
    return arr
      .map((jd: any) => jd?.deviceImei || jd?.device?.imeiNumber)
      .filter(Boolean);
  }, [job?.jobDevices]);

  const latestInstallation = useMemo(() => {
    const arr = Array.isArray(job?.installations) ? job.installations : [];
    return arr.length > 0 ? arr[0] : null;
  }, [job?.installations]);

  const installationPhotos = useMemo(() => {
    // Prefer job.photoUrls (already parsed by backend formatter), fallback to installation.installationPhotos if needed
    const jobPhotos = Array.isArray(job?.photoUrls) ? job.photoUrls : safeJsonArray(job?.photoUrls);
    if (jobPhotos.length > 0) return jobPhotos;

    const instPhotos = latestInstallation?.installationPhotos;
    return safeJsonArray(instPhotos);
  }, [job?.photoUrls, latestInstallation?.installationPhotos]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">Installation Details</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* IMEIs */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm md:text-base">Installed / Confirmed IMEI Numbers</h3>

            {imeis.length > 0 ? (
              <div className="space-y-1">
                {imeis.map((imei: string, idx: number) => {
                  const status = job?.jobDevices?.[idx]?.device?.status;
                  return (
                    <div
                      key={`${imei}-${idx}`}
                      className="flex items-center gap-2 font-mono text-xs md:text-sm bg-muted p-2 rounded"
                    >
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="truncate">{imei}</span>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {status || "—"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
                <Info className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <AlertDescription className="text-xs text-orange-700 dark:text-orange-300 ml-2">
                  No IMEI captured yet.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* SIM */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm md:text-base">SIM Card</h3>
            <p className="font-mono text-xs md:text-sm bg-muted p-2 rounded">
              {job.simCardIccid || "Not provided"}
            </p>
          </div>

          {/* MAC */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm md:text-base">MAC Address</h3>
            <p className="font-mono text-xs md:text-sm bg-muted p-2 rounded">
              {job.macAddress || "Not provided"}
            </p>
          </div>

          {/* GPS */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm md:text-base">GPS Coordinates</h3>
            <p className="text-xs md:text-sm bg-muted p-2 rounded">
              {job.gpsCoordinates || "Not captured"}
            </p>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Installation Location</Label>
            <p className="text-xs md:text-sm bg-muted p-2 rounded">
              {latestInstallation?.installationLocation || (job as any).installationLocation || "Not provided"}
            </p>
          </div>

          {/* Notes */}
          <div className="col-span-1 md:col-span-2 space-y-2">
            <h3 className="font-semibold text-sm md:text-base">Installation Notes</h3>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs md:text-sm whitespace-pre-wrap">
                {job.installationNotes || "No notes provided"}
              </p>
            </div>
          </div>

          {/* Photos */}
          <div className="col-span-1 md:col-span-2 space-y-2">
            <h3 className="font-semibold text-sm md:text-base">Installation Photos</h3>

            {installationPhotos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {installationPhotos.map((url: string, idx: number) => (
                  <a
                    key={`${url}-${idx}`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative aspect-video overflow-hidden rounded-lg border hover:border-primary transition-colors"
                  >
                    <img
                      src={url}
                      alt={`Installation photo ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No photos uploaded</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InstallationDetailsTab;