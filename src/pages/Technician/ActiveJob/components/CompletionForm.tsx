import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { technicianJobsService } from "@/api/services/technician-jobs.service";

const CompletionForm = ({ job }: { job: any }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [confirmationChecks, setConfirmationChecks] = useState({
    allComponentsWorking: false,
    areaCleanedUp: false,
  });
  const [completionNotes, setCompletionNotes] = useState("");
  const [customerSignature, setCustomerSignature] = useState("");

  const completeMutation = useMutation({
    mutationFn: () =>
      technicianJobsService.completeJob(job.id, {
        photoUrls: job.photoUrls || [],
        imeiNumbers: job.imeiNumbers || [],
        gpsCoordinates: job.gpsCoordinates,
        installationNotes: completionNotes,
        simCardIccid: job.simCardIccid,
        macAddress: job.macAddress,
      }),
    onSuccess: async () => {
      // Remove old cache entries immediately
      queryClient.removeQueries({ queryKey: ["active-job"] });
      queryClient.removeQueries({ queryKey: ["job-by-id", job.id] });

      // Invalidate and refetch all related queries
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["technician-jobs"],
          refetchType: "active",
        }),
        queryClient.invalidateQueries({
          queryKey: ["technician-stats"],
          refetchType: "active",
        }),
      ]);

      toast.success("Job completed successfully!");

      // Navigate with replace to prevent back navigation to completed job
      navigate("/technician/jobs", { replace: true });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to complete job");
    },
  });

  const allChecksCompleted = Object.values(confirmationChecks).every(Boolean);

  const handleComplete = () => {
    if (!allChecksCompleted) {
      toast.error("Please complete all confirmation checks");
      return;
    }

    if (!customerSignature.trim()) {
      toast.error("Customer signature is required");
      return;
    }

    if (!completionNotes.trim()) {
      toast.error("Please add completion notes");
      return;
    }

    completeMutation.mutate();
  };

  // Prerequisite checks
  const hasVehicle = !!job.vehicleId;

  const hasPreInspection = [
    "REQUISITION_PENDING",
    "REQUISITION_APPROVED",
    "PRE_INSPECTION_PENDING",
    "PRE_INSPECTION_APPROVED",
    "IN_PROGRESS",
    "POST_INSPECTION_PENDING",
    "COMPLETED",
    "VERIFIED",
  ].includes(job.status);

  const hasInstallationData =
    job.imeiNumbers &&
    job.imeiNumbers.length > 0 &&
    job.photoUrls &&
    job.photoUrls.length > 0;

  const hasPostInspection = [
    "POST_INSPECTION_PENDING",
    "COMPLETED",
    "VERIFIED",
  ].includes(job.status);

  const canComplete =
    hasVehicle && hasPreInspection && hasInstallationData && hasPostInspection;

  return (
    <div className="space-y-6">
      {/* Prerequisites Check */}
      <Card>
        <CardHeader>
          <CardTitle>Completion Prerequisites</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {hasVehicle ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-600" />
              )}
              <span
                className={hasVehicle ? "text-green-800" : "text-orange-800"}
              >
                Vehicle information added
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasPreInspection ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-600" />
              )}
              <span
                className={
                  hasPreInspection ? "text-green-800" : "text-orange-800"
                }
              >
                Pre-installation inspection completed
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasInstallationData ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-600" />
              )}
              <span
                className={
                  hasInstallationData ? "text-green-800" : "text-orange-800"
                }
              >
                Installation details and photos added (IMEI:{" "}
                {job.imeiNumbers?.length || 0}, Photos:{" "}
                {job.photoUrls?.length || 0})
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasPostInspection ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-600" />
              )}
              <span
                className={
                  hasPostInspection ? "text-green-800" : "text-orange-800"
                }
              >
                Post-installation inspection completed
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completion Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Completion Checklist</CardTitle>
          <p className="text-sm text-muted-foreground">
            Confirm all items before completing the job
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Checkbox
                id="allComponentsWorking"
                checked={confirmationChecks.allComponentsWorking}
                onCheckedChange={(checked) =>
                  setConfirmationChecks({
                    ...confirmationChecks,
                    allComponentsWorking: checked as boolean,
                  })
                }
              />
              <Label
                htmlFor="allComponentsWorking"
                className="font-medium cursor-pointer"
              >
                All components are working correctly
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="areaCleanedUp"
                checked={confirmationChecks.areaCleanedUp}
                onCheckedChange={(checked) =>
                  setConfirmationChecks({
                    ...confirmationChecks,
                    areaCleanedUp: checked as boolean,
                  })
                }
              />
              <Label
                htmlFor="areaCleanedUp"
                className="font-medium cursor-pointer"
              >
                Work area has been cleaned and materials removed
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completion Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Completion Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="completionNotes">
              Final Notes <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="completionNotes"
              placeholder="Add any final notes about the installation, customer feedback, or recommendations..."
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerSignature">
              Customer Name (Signature){" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="customerSignature"
              placeholder="Customer full name"
              value={customerSignature}
              onChange={(e) => setCustomerSignature(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Please confirm customer name to acknowledge installation
              completion
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Job Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Job Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground">Job Number</Label>
              <p className="font-mono font-medium">{job.jobNumber}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Customer</Label>
              <p className="font-medium">
                {job.customer.businessName || job.customer.contactPerson}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Vehicle</Label>
              <p className="font-medium">{job.vehicle?.vehicleReg || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">IMEI Numbers</Label>
              <p className="font-mono text-xs">
                {job.imeiNumbers?.join(", ") || "N/A"}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">SIM Card ICCID</Label>
              <p className="font-mono text-xs">{job.simCardIccid || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">MAC Address</Label>
              <p className="font-mono text-xs">{job.macAddress || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Photos Uploaded</Label>
              <p className="font-medium">
                {job.photoUrls?.length || 0} photo(s)
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">GPS Location</Label>
              <p className="text-xs">{job.gpsCoordinates || "Not captured"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complete Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate("/technician/jobs")}>
          Back to Jobs
        </Button>
        <Button
          onClick={handleComplete}
          disabled={
            !canComplete ||
            !allChecksCompleted ||
            !completionNotes.trim() ||
            !customerSignature.trim() ||
            completeMutation.isPending
          }
          size="lg"
          className="bg-green-600 hover:bg-green-700"
        >
          {completeMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Completing Job...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Complete Job
            </>
          )}
        </Button>
      </div>

      {(!canComplete ||
        !allChecksCompleted ||
        !completionNotes.trim() ||
        !customerSignature.trim()) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-900">
                  Cannot complete job yet
                </p>
                <div className="text-sm text-orange-700 mt-2 space-y-1">
                  {!hasVehicle && <p>• Vehicle information not added</p>}
                  {!hasPreInspection && (
                    <p>• Pre-installation inspection not completed</p>
                  )}
                  {!hasInstallationData && (
                    <p>
                      • Installation details missing (IMEI:{" "}
                      {job.imeiNumbers?.length || 0}, Photos:{" "}
                      {job.photoUrls?.length || 0})
                    </p>
                  )}
                  {!hasPostInspection && (
                    <p>• Post-installation inspection not completed</p>
                  )}
                  {!allChecksCompleted && (
                    <p>• All completion checklist items must be confirmed</p>
                  )}
                  {!completionNotes.trim() && (
                    <p>• Completion notes are required</p>
                  )}
                  {!customerSignature.trim() && (
                    <p>• Customer signature is required</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CompletionForm;
