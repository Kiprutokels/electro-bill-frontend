import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Camera,
  MapPin,
  Package,
  ClipboardCheck,
  Car,
  Loader2,
  Briefcase,
} from "lucide-react";
import { technicianJobsService } from "@/api/services/technician-jobs.service";
import { jobsService, JobStatus } from "@/api/services/jobs.service";

import JobInfo from "./components/JobInfo";
import VehicleForm from "./components/VehicleForm";
import PreInspection from "./components/PreInspection";
import RequisitionForm from "./components/RequisitionForm";
import InstallationProgress from "./components/InstallationProgress";
import PostInspection from "./components/PostInspection";
import CompletionForm from "./components/CompletionForm";

const ActiveJob = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const jobId = searchParams.get("jobId");

  const [activeTab, setActiveTab] = useState("info");
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Location error:", error);
          toast.error("Unable to get your location");
        }
      );
    }
  }, []);

  // Fetch active job or specific job
  const { data: job, isLoading } = useQuery({
    queryKey: ["active-job", jobId],
    queryFn: async () => {
      if (jobId) {
        return await jobsService.getJobById(jobId);
      }
      return await technicianJobsService.getActiveJob();
    },
    enabled: !!jobId,
  });

  // Start job mutation
  const startMutation = useMutation({
    mutationFn: () =>
      technicianJobsService.startJob({
        jobId: job!.id,
        gpsCoordinates: currentLocation
          ? `${currentLocation.lat}, ${currentLocation.lng}`
          : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-job"] });
      queryClient.invalidateQueries({ queryKey: ["technician-jobs"] });
      toast.success("Job started successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to start job");
    },
  });

  const handleStartJob = () => {
    if (!currentLocation) {
      toast.error("Please enable location services");
      return;
    }
    startMutation.mutate();
  };

  // Determine which tab to show based on job status
  useEffect(() => {
    if (!job) return;

    switch (job.status) {
      case JobStatus.ASSIGNED:
        setActiveTab("info");
        break;
      case JobStatus.REQUISITION_PENDING:
      case JobStatus.REQUISITION_APPROVED:
        setActiveTab("requisition");
        break;
      case JobStatus.PRE_INSPECTION_PENDING:
        setActiveTab("pre-inspection");
        break;
      case JobStatus.IN_PROGRESS:
        setActiveTab("installation");
        break;
      case JobStatus.POST_INSPECTION_PENDING:
        setActiveTab("post-inspection");
        break;
      default:
        setActiveTab("info");
    }
  }, [job]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Active Job</h3>
          <p className="text-muted-foreground mb-4">
            You don't have an active job at the moment
          </p>
          <Button onClick={() => navigate("/technician/jobs")}>
            View My Jobs
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Job Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Active Job</h1>
          <p className="text-muted-foreground">Job #{job.jobNumber}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={getStatusColor(job.status)}>
            {job.status.replace(/_/g, " ")}
          </Badge>
          {job.status === JobStatus.ASSIGNED && (
            <Button
              onClick={handleStartJob}
              disabled={startMutation.isPending || !currentLocation}
            >
              {startMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Start Job
            </Button>
          )}
        </div>
      </div>

      {/* Job Progress Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {/* Progress steps visualization */}
            <JobProgressSteps currentStatus={job.status} />
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="info">
            <Briefcase className="h-4 w-4 mr-2" />
            Info
          </TabsTrigger>
          <TabsTrigger value="vehicle">
            <Car className="h-4 w-4 mr-2" />
            Vehicle
          </TabsTrigger>
          <TabsTrigger value="requisition">
            <Package className="h-4 w-4 mr-2" />
            Materials
          </TabsTrigger>
          <TabsTrigger value="pre-inspection">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Pre-Check
          </TabsTrigger>
          <TabsTrigger value="installation">
            <Play className="h-4 w-4 mr-2" />
            Install
          </TabsTrigger>
          <TabsTrigger value="post-inspection">
            <CheckCircle className="h-4 w-4 mr-2" />
            Final Check
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <JobInfo job={job} />
        </TabsContent>

        <TabsContent value="vehicle">
          <VehicleForm job={job} />
        </TabsContent>

        <TabsContent value="requisition">
          <RequisitionForm job={job} />
        </TabsContent>

        <TabsContent value="pre-inspection">
          <PreInspection job={job} />
        </TabsContent>

        <TabsContent value="installation">
          <InstallationProgress job={job} />
        </TabsContent>

        <TabsContent value="post-inspection">
          <PostInspection job={job} />
        </TabsContent>
        <TabsContent value="completion">
          <CompletionForm job={job} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper functions
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    ASSIGNED: "bg-blue-500",
    IN_PROGRESS: "bg-purple-500",
    PRE_INSPECTION_PENDING: "bg-orange-500",
    PRE_INSPECTION_APPROVED: "bg-blue-500",
    POST_INSPECTION_PENDING: "bg-orange-500",
    COMPLETED: "bg-green-500",
    REQUISITION_PENDING: "bg-yellow-500",
    REQUISITION_APPROVED: "bg-blue-500",
  };
  return colors[status] || "bg-gray-500";
};

// Progress Steps Component
const JobProgressSteps = ({ currentStatus }: { currentStatus: string }) => {
  const steps = [
    { key: "ASSIGNED", label: "Assigned", icon: Briefcase },
    {
      key: "PRE_INSPECTION_APPROVED",
      label: "Pre-Inspection",
      icon: ClipboardCheck,
    },
    { key: "IN_PROGRESS", label: "Installation", icon: Play },
    {
      key: "POST_INSPECTION_PENDING",
      label: "Post-Inspection",
      icon: CheckCircle,
    },
    { key: "COMPLETED", label: "Completed", icon: CheckCircle },
  ];

  const currentIndex = steps.findIndex((s) => s.key === currentStatus);

  return (
    <div className="flex items-center w-full">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center">
              <div
                className={`
                  rounded-full p-3 
                  ${
                    isComplete
                      ? "bg-green-500"
                      : isCurrent
                      ? "bg-blue-500"
                      : "bg-gray-300"
                  }
                  text-white
                `}
              >
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-xs mt-2 text-center">{step.label}</p>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`
                  flex-1 h-1 mx-2
                  ${isComplete ? "bg-green-500" : "bg-gray-300"}
                `}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ActiveJob;
