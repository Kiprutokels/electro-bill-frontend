import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Play,
  CheckCircle,
  AlertCircle,
  Package,
  ClipboardCheck,
  Car,
  Loader2,
  Briefcase,
  Lock,
  CheckCircle2,
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

  // Fetch job data
  const { data: job, isLoading } = useQuery({
    queryKey: jobId ? ["job-by-id", jobId] : ["active-job"],
    queryFn: async () => {
      if (jobId) {
        return await jobsService.getJobById(jobId);
      }
      return await technicianJobsService.getActiveJob();
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
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
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["active-job"] }),
        queryClient.invalidateQueries({ queryKey: ["technician-jobs"] }),
        queryClient.invalidateQueries({ queryKey: ["job-by-id", job?.id] }),
        queryClient.invalidateQueries({ queryKey: ["technician-stats"] }),
      ]);
      toast.success("Job started successfully");
      // Auto-progress to next step
      setActiveTab(getNextAvailableTab(job!.status));
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

  // Determine active tab based on job status
  const getActiveTabFromStatus = (status: string): string => {
    const statusTabMap: Record<string, string> = {
      [JobStatus.ASSIGNED]: "info",
      [JobStatus.PENDING]: "info",
      [JobStatus.REQUISITION_PENDING]: "requisition",
      [JobStatus.REQUISITION_APPROVED]: "vehicle",
      [JobStatus.PRE_INSPECTION_PENDING]: "pre-inspection",
      [JobStatus.PRE_INSPECTION_APPROVED]: "installation",
      [JobStatus.IN_PROGRESS]: "installation",
      [JobStatus.POST_INSPECTION_PENDING]: "post-inspection",
      [JobStatus.COMPLETED]: "completion",
    };
    return statusTabMap[status] || "info";
  };

  const getNextAvailableTab = (status: string): string => {
    const currentTab = getActiveTabFromStatus(status);
    const tabOrder = ["info", "requisition", "vehicle", "pre-inspection", "installation", "post-inspection", "completion"];
    const currentIndex = tabOrder.indexOf(currentTab);
    return tabOrder[Math.min(currentIndex + 1, tabOrder.length - 1)];
  };

  // Auto-switch tab based on job status
  useEffect(() => {
    if (job) {
      const suggestedTab = getActiveTabFromStatus(job.status);
      setActiveTab(suggestedTab);
    }
  }, [job?.status]);

  // Tab accessibility logic
  const getTabAccessibility = (tabName: string) => {
    if (!job) return { enabled: false, completed: false, locked: true };

    const hasVehicle = !!job.vehicleId;
    const hasPreInspection = job.status && [
      JobStatus.PRE_INSPECTION_APPROVED,
      JobStatus.IN_PROGRESS,
      JobStatus.POST_INSPECTION_PENDING,
      JobStatus.COMPLETED,
    ].includes(job.status as JobStatus);
    
    const hasInstallationData = job.imeiNumbers?.length > 0 && job.photoUrls?.length > 0;
    const hasPostInspection = job.status && [
      JobStatus.POST_INSPECTION_PENDING,
      JobStatus.COMPLETED,
    ].includes(job.status as JobStatus);

    const isJobStarted = job.status !== JobStatus.ASSIGNED && job.status !== JobStatus.PENDING;

    switch (tabName) {
      case "info":
        return { enabled: true, completed: true, locked: false };
      
      case "requisition":
        return { 
          enabled: true, 
          completed: job.status !== JobStatus.REQUISITION_PENDING,
          locked: false 
        };
      
      case "vehicle":
        return { 
          enabled: isJobStarted, 
          completed: hasVehicle,
          locked: !isJobStarted 
        };
      
      case "pre-inspection":
        return { 
          enabled: hasVehicle, 
          completed: hasPreInspection,
          locked: !hasVehicle 
        };
      
      case "installation":
        return { 
          enabled: hasPreInspection, 
          completed: hasInstallationData,
          locked: !hasPreInspection 
        };
      
      case "post-inspection":
        return { 
          enabled: hasInstallationData, 
          completed: hasPostInspection,
          locked: !hasInstallationData 
        };
      
      case "completion":
        return { 
          enabled: hasPostInspection, 
          completed: job.status === JobStatus.COMPLETED,
          locked: !hasPostInspection 
        };
      
      default:
        return { enabled: false, completed: false, locked: true };
    }
  };

  const handleTabChange = (tabName: string) => {
    const { enabled, locked } = getTabAccessibility(tabName);
    if (locked) {
      toast.error("Complete previous steps first");
      return;
    }
    setActiveTab(tabName);
  };

  // Auto-progress callback for child components
  const handleStepComplete = (completedStep: string) => {
    queryClient.invalidateQueries({ queryKey: jobId ? ["job-by-id", jobId] : ["active-job"] });
    
    const tabOrder = ["info", "requisition", "vehicle", "pre-inspection", "installation", "post-inspection", "completion"];
    const currentIndex = tabOrder.indexOf(completedStep);
    const nextTab = tabOrder[currentIndex + 1];
    
    if (nextTab) {
      setTimeout(() => {
        setActiveTab(nextTab);
        toast.success(`Proceeding to ${nextTab.replace("-", " ")}`);
      }, 500);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading job...</p>
        </div>
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
            {jobId
              ? "Job not found or you don't have access to this job."
              : "You don't have an active job at the moment"}
          </p>
          <Button onClick={() => navigate("/technician/jobs")}>
            View My Jobs
          </Button>
        </CardContent>
      </Card>
    );
  }

  const showStartButton = (
    job.status === JobStatus.ASSIGNED ||
    job.status === JobStatus.REQUISITION_APPROVED ||
    job.status === JobStatus.PRE_INSPECTION_APPROVED
  );

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
          {showStartButton && (
            <Button
              onClick={handleStartJob}
              disabled={startMutation.isPending || !currentLocation}
              size="lg"
            >
              {startMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Job
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Job Progress Indicator */}
      <Card>
        <CardContent className="pt-6">
          <JobProgressSteps currentStatus={job.status} />
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-7">
          {[
            { value: "info", icon: Briefcase, label: "Info" },
            { value: "requisition", icon: Package, label: "Materials" },
            { value: "vehicle", icon: Car, label: "Vehicle" },
            { value: "pre-inspection", icon: ClipboardCheck, label: "Pre-Check" },
            { value: "installation", icon: Play, label: "Install" },
            { value: "post-inspection", icon: CheckCircle, label: "Final Check" },
            { value: "completion", icon: CheckCircle2, label: "Complete" },
          ].map((tab) => {
            const { enabled, completed, locked } = getTabAccessibility(tab.value);
            const Icon = tab.icon;
            
            return (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value}
                disabled={locked}
                className="relative"
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
                {completed && <CheckCircle2 className="h-3 w-3 ml-1 text-green-600" />}
                {locked && <Lock className="h-3 w-3 ml-1 text-gray-400" />}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="info">
          <JobInfo job={job} />
        </TabsContent>

        <TabsContent value="requisition">
          <RequisitionForm job={job} onComplete={() => handleStepComplete("requisition")} />
        </TabsContent>

        <TabsContent value="vehicle">
          <VehicleForm job={job} onComplete={() => handleStepComplete("vehicle")} />
        </TabsContent>

        <TabsContent value="pre-inspection">
          <PreInspection job={job} onComplete={() => handleStepComplete("pre-inspection")} />
        </TabsContent>

        <TabsContent value="installation">
          <InstallationProgress job={job} onComplete={() => handleStepComplete("installation")} />
        </TabsContent>

        <TabsContent value="post-inspection">
          <PostInspection job={job} onComplete={() => handleStepComplete("post-inspection")} />
        </TabsContent>

        <TabsContent value="completion">
          <CompletionForm job={job} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    PENDING: "bg-gray-500",
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

const JobProgressSteps = ({ currentStatus }: { currentStatus: string }) => {
  const steps = [
    { key: "ASSIGNED", label: "Start Job", icon: Play },
    { key: "PRE_INSPECTION_APPROVED", label: "Pre-Inspection", icon: ClipboardCheck },
    { key: "IN_PROGRESS", label: "Installation", icon: Briefcase },
    { key: "POST_INSPECTION_PENDING", label: "Final Check", icon: CheckCircle },
    { key: "COMPLETED", label: "Completed", icon: CheckCircle2 },
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
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={`
                  rounded-full p-3 
                  ${isComplete ? "bg-green-500" : isCurrent ? "bg-blue-500" : "bg-gray-300"}
                  text-white transition-all duration-300
                `}
              >
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-xs mt-2 text-center whitespace-nowrap font-medium">
                {step.label}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`
                  flex-1 h-1 mx-2 min-w-[20px] transition-all duration-300
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