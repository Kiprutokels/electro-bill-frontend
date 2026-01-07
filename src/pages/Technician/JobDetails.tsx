import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  Eye,
  Play,
  CheckCircle2,
  ClipboardList,
  Package,
  Car,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { jobsService, JobStatus } from "@/api/services/jobs.service";

const TechnicianJobDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: jobWorkflow, isLoading } = useQuery({
    queryKey: ["technician-job-workflow", id],
    queryFn: () => jobsService.getJobWorkflow(id!),
    enabled: !!id,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">
            Loading job details...
          </p>
        </div>
      </div>
    );
  }

  if (!jobWorkflow) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Job not found</h3>
          <p className="text-muted-foreground mb-4">
            You may not have access to this job, or it does not exist.
          </p>
          <Button onClick={() => navigate("/technician/jobs")}>
            Back to My Jobs
          </Button>
        </CardContent>
      </Card>
    );
  }

  const job = jobWorkflow;
  const workflow = jobWorkflow.workflow;

  const isCompleted =
    job.status === JobStatus.COMPLETED || job.status === JobStatus.VERIFIED;

  const isInProgress = job.status === JobStatus.IN_PROGRESS;

  const showWorkButton =
    !isCompleted &&
    [
      JobStatus.SCHEDULED,
      JobStatus.ASSIGNED,
      JobStatus.REQUISITION_APPROVED,
      JobStatus.PRE_INSPECTION_APPROVED,
      JobStatus.IN_PROGRESS,
      JobStatus.POST_INSPECTION_PENDING,
      JobStatus.PRE_INSPECTION_PENDING,
      JobStatus.REQUISITION_PENDING,
    ].includes(job.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate("/technician/jobs")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div>
            <h1 className="text-2xl font-bold">Job Details</h1>
            <p className="text-sm text-muted-foreground">#{job.jobNumber}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={`${getStatusColor(job.status)} text-white`}>
            {job.status.replace(/_/g, " ")}
          </Badge>

          {showWorkButton && (
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link to={`/technician/jobs/${job.id}/work`}>
                <Play className="h-4 w-4 mr-2" />
                {isInProgress ? "Continue Work" : "Open Job"}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Scheduled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold">
              {job.scheduledDate
                ? new Date(job.scheduledDate).toLocaleDateString()
                : "N/A"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Car className="h-4 w-4" />
              Vehicle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold">
              {job.vehicle?.vehicleReg || "Not added"}
            </div>
            {job.vehicle && (
              <div className="text-xs text-muted-foreground">
                {job.vehicle.make} {job.vehicle.model}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold">
              {isCompleted ? "Completed" : "Not completed"}
            </div>
            {job.endTime && (
              <div className="text-xs text-muted-foreground">
                {new Date(job.endTime).toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customer + Service */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Customer & Service</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-xs text-muted-foreground">Customer</div>
            <div className="font-medium">
              {job.customer.businessName || job.customer.contactPerson}
            </div>
            <div className="text-sm text-muted-foreground">
              {job.customer.phone}
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-xs text-muted-foreground">
              Service Description
            </div>
            <div className="text-sm whitespace-pre-wrap">
              {job.serviceDescription}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {workflow.timeline?.length ? (
              workflow.timeline.map((t: any) => (
                <div key={t.id} className="border rounded p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-sm">{t.message}</div>
                    <Badge variant="outline" className="text-xs">
                      {t.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {t.user?.firstName} {t.user?.lastName} •{" "}
                    {new Date(t.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No timeline events yet.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Requisitions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Requisitions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {workflow.requisitions?.length ? (
              workflow.requisitions.map((r: any) => (
                <div key={r.id} className="border rounded p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-sm">
                      {r.requisitionNumber}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {r.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(r.requestedDate).toLocaleString()}
                  </div>
                  <div className="mt-2 space-y-1">
                    {r.items?.map((it: any) => (
                      <div key={it.id} className="text-sm flex justify-between">
                        <span className="truncate">{it.product?.name}</span>
                        <span className="text-muted-foreground">
                          {it.quantityIssued}/{it.quantityRequested}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No requisitions submitted.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Installation Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Installation Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-xs text-muted-foreground">IMEI Numbers</div>
            {job.imeiNumbers?.length ? (
              <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                {job.imeiNumbers.map((i: string, idx: number) => (
                  <div
                    key={idx}
                    className="font-mono text-xs bg-muted p-2 rounded"
                  >
                    {i}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No IMEI captured.</p>
            )}
          </div>

          <Separator />

          <div>
            <div className="text-xs text-muted-foreground">Photos</div>
            {job.photoUrls?.length ? (
              <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                {job.photoUrls.map((url: string, idx: number) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="border rounded overflow-hidden hover:opacity-90"
                    title="Open image"
                  >
                    <img
                      src={url}
                      alt={`photo-${idx}`}
                      className="w-full h-24 object-cover"
                    />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No photos uploaded.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

function getStatusColor(status: string) {
  const map: Record<string, string> = {
    PENDING: "bg-gray-500",
    SCHEDULED: "bg-indigo-500",
    ASSIGNED: "bg-blue-500",
    REQUISITION_PENDING: "bg-yellow-500",
    REQUISITION_APPROVED: "bg-blue-500",
    PRE_INSPECTION_PENDING: "bg-orange-500",
    PRE_INSPECTION_APPROVED: "bg-blue-500",
    IN_PROGRESS: "bg-purple-500",
    POST_INSPECTION_PENDING: "bg-orange-500",
    COMPLETED: "bg-green-500",
    VERIFIED: "bg-green-600",
    CANCELLED: "bg-red-500",
  };
  return map[status] || "bg-gray-500";
}

export default TechnicianJobDetails;
