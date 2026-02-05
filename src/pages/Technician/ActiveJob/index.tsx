import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  CalendarX,
} from "lucide-react";

import { technicianJobsService } from "@/api/services/technician-jobs.service";
import { jobsService, JobStatus } from "@/api/services/jobs.service";
import { useIsMobile } from "@/hooks/use-mobile";

import JobInfo from "./components/JobInfo";
import VehicleForm from "./components/VehicleForm";
import PreInspection from "./components/PreInspection";
import RequisitionForm from "./components/RequisitionForm";
import InstallationProgress from "./components/InstallationProgress";
import PostInspection from "./components/PostInspection";
import CompletionForm from "./components/CompletionForm";

type LatLng = { lat: number; lng: number };

const ActiveJob = () => {
  const [searchParams] = useSearchParams();
  const params = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const jobId = useMemo(() => {
    return params.id || searchParams.get("jobId") || undefined;
  }, [params.id, searchParams]);

  const [activeTab, setActiveTab] = useState("info");
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);

  // Get current location
  useEffect(() => {
    if (!navigator.geolocation) return;

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
      },
    );
  }, []);

  // Fetch job data
  const {
    data: job,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: jobId ? ["job-by-id", jobId] : ["active-job"],
    queryFn: async () => {
      if (jobId) {
        return jobsService.getJobById(jobId);
      }
      return technicianJobsService.getActiveJob();
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
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

    if (job?.scheduledDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const scheduledDate = new Date(job.scheduledDate);
      scheduledDate.setHours(0, 0, 0, 0);

      if (scheduledDate > today) {
        toast.error(
          `Job cannot be started before scheduled date: ${scheduledDate.toLocaleDateString()}`,
        );
        return;
      }
    }

    startMutation.mutate();
  };

  const getActiveTabFromStatus = (status: string): string => {
    const statusTabMap: Record<string, string> = {
      [JobStatus.PENDING]: "info",
      [JobStatus.SCHEDULED]: "info",
      [JobStatus.ASSIGNED]: "info",
      [JobStatus.REQUISITION_PENDING]: "requisition",
      [JobStatus.REQUISITION_APPROVED]: "vehicle",
      [JobStatus.PRE_INSPECTION_PENDING]: "pre-inspection",
      [JobStatus.PRE_INSPECTION_APPROVED]: "installation",
      [JobStatus.IN_PROGRESS]: "installation",
      [JobStatus.POST_INSPECTION_PENDING]: "post-inspection",
      [JobStatus.COMPLETED]: "completion",
      [JobStatus.VERIFIED]: "completion",
    };
    return statusTabMap[status] || "info";
  };

  const getNextAvailableTab = (status: string): string => {
    const currentTab = getActiveTabFromStatus(status);
    const tabOrder = [
      "info",
      "requisition",
      "vehicle",
      "pre-inspection",
      "installation",
      "post-inspection",
      "completion",
    ];
    const currentIndex = tabOrder.indexOf(currentTab);
    return tabOrder[Math.min(currentIndex + 1, tabOrder.length - 1)];
  };

  // Auto-switch tab based on job status
  useEffect(() => {
    if (!job) return;
    const newTab = getActiveTabFromStatus(job.status);
    setActiveTab(newTab);
  }, [job?.status]);

  /**
   * Enhanced tab accessibility logic:
   * - Tabs are unlocked progressively
   * - Once unlocked, they remain accessible (can go back)
   * - Locked only if prerequisite steps not completed
   */
  const getTabAccessibility = (tabName: string) => {
    if (!job) return { enabled: false, completed: false, locked: true };

    const isJobAssigned =
      job.status !== JobStatus.PENDING && job.status !== JobStatus.SCHEDULED;

    const hasVehicle = !!job.vehicleId;

    const hasPreInspection = [
      JobStatus.PRE_INSPECTION_APPROVED,
      JobStatus.IN_PROGRESS,
      JobStatus.POST_INSPECTION_PENDING,
      JobStatus.COMPLETED,
      JobStatus.VERIFIED,
    ].includes(job.status as JobStatus);

    const hasInstallationData =
      (job.imeiNumbers?.length || 0) > 0 && (job.photoUrls?.length || 0) > 0;

    const hasPostInspection = [
      JobStatus.POST_INSPECTION_PENDING,
      JobStatus.COMPLETED,
      JobStatus.VERIFIED,
    ].includes(job.status as JobStatus);

    const isCompleted = [JobStatus.COMPLETED, JobStatus.VERIFIED].includes(
      job.status as JobStatus,
    );

    // Define the progression level
    const tabOrder = [
      "info",
      "requisition",
      "vehicle",
      "pre-inspection",
      "installation",
      "post-inspection",
      "completion",
    ];

    const currentTabIndex = tabOrder.indexOf(
      getActiveTabFromStatus(job.status),
    );
    const requestedTabIndex = tabOrder.indexOf(tabName);

    // Allow access to current tab and all previous tabs
    const canAccessBasedOnProgression = requestedTabIndex <= currentTabIndex;

    switch (tabName) {
      case "info":
        return { enabled: true, completed: true, locked: false };

      case "requisition":
        return {
          enabled: isJobAssigned,
          completed: job.status !== JobStatus.REQUISITION_PENDING,
          locked: !isJobAssigned,
        };

      case "vehicle":
        return {
          enabled: isJobAssigned && canAccessBasedOnProgression,
          completed: hasVehicle,
          locked: !isJobAssigned,
        };

      case "pre-inspection":
        return {
          enabled: hasVehicle && canAccessBasedOnProgression,
          completed: hasPreInspection,
          locked: !hasVehicle,
        };

      case "installation":
        return {
          enabled: hasPreInspection && canAccessBasedOnProgression,
          completed: hasInstallationData,
          locked: !hasPreInspection,
        };

      case "post-inspection":
        return {
          enabled: hasInstallationData && canAccessBasedOnProgression,
          completed: hasPostInspection,
          locked: !hasInstallationData,
        };

      case "completion":
        return {
          enabled: hasPostInspection && canAccessBasedOnProgression,
          completed: isCompleted,
          locked: !hasPostInspection,
        };

      default:
        return { enabled: false, completed: false, locked: true };
    }
  };

  const handleTabChange = (tabName: string) => {
    const { locked } = getTabAccessibility(tabName);
    if (locked) {
      toast.error("Complete previous steps first");
      return;
    }
    setActiveTab(tabName);
  };

  const handleStepComplete = async (completedStep: string) => {
    await queryClient.invalidateQueries({
      queryKey: jobId ? ["job-by-id", jobId] : ["active-job"],
    });

    await new Promise((resolve) => setTimeout(resolve, 300));
    await refetch();

    const tabOrder = [
      "info",
      "requisition",
      "vehicle",
      "pre-inspection",
      "installation",
      "post-inspection",
      "completion",
    ];

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
          <h3 className="text-lg font-semibold mb-2">Job not available</h3>
          <p className="text-muted-foreground mb-4">
            {jobId
              ? "Job not found or you don't have access to this job."
              : "You don't have an active job at the moment."}
          </p>
          <Button onClick={() => navigate("/technician/jobs")}>
            View My Jobs
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Scheduled-date start eligibility message
  const canStartNow = (): { allowed: boolean; message?: string } => {
    if (!job.scheduledDate) return { allowed: true };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const scheduledDate = new Date(job.scheduledDate);
    scheduledDate.setHours(0, 0, 0, 0);

    if (scheduledDate > today) {
      const daysUntil = Math.ceil(
        (scheduledDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      return {
        allowed: false,
        message: `Job is scheduled for ${scheduledDate.toLocaleDateString()}. You can start it in ${daysUntil} day${
          daysUntil > 1 ? "s" : ""
        }.`,
      };
    }

    return { allowed: true };
  };

  const startValidation = canStartNow();

  const showStartButton =
    [
      JobStatus.SCHEDULED,
      JobStatus.ASSIGNED,
      JobStatus.REQUISITION_APPROVED,
      JobStatus.PRE_INSPECTION_APPROVED,
    ].includes(job.status as JobStatus) && startValidation.allowed;

  const tabs = [
    { value: "info", icon: Briefcase, label: "Info", shortLabel: "Info" },
    {
      value: "requisition",
      icon: Package,
      label: "Materials",
      shortLabel: "Materials",
    },
    { value: "vehicle", icon: Car, label: "Vehicle", shortLabel: "Vehicle" },
    {
      value: "pre-inspection",
      icon: ClipboardCheck,
      label: "Pre-Check",
      shortLabel: "Pre",
    },
    {
      value: "installation",
      icon: Play,
      label: "Install",
      shortLabel: "Install",
    },
    {
      value: "post-inspection",
      icon: CheckCircle,
      label: "Final Check",
      shortLabel: "Final",
    },
    {
      value: "completion",
      icon: CheckCircle2,
      label: "Complete",
      shortLabel: "Done",
    },
  ];

  const isCompleted =
    job.status === JobStatus.COMPLETED || job.status === JobStatus.VERIFIED;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {isCompleted ? "Completed Job" : "Active Job"}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Job #{job.jobNumber}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Badge className={`${getStatusColor(job.status)} text-xs sm:text-sm`}>
            {job.status.replace(/_/g, " ")}
          </Badge>

          {showStartButton && (
            <Button
              onClick={handleStartJob}
              disabled={startMutation.isPending || !currentLocation}
              size={isMobile ? "default" : "lg"}
              className="text-xs sm:text-sm bg-green-600 hover:bg-green-700"
            >
              {startMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Start Job
                </>
              )}
            </Button>
          )}

          {!showStartButton && !startValidation.allowed && (
            <Badge variant="outline" className="flex items-center gap-1">
              <CalendarX className="h-3 w-3" />
              Scheduled for {new Date(job.scheduledDate).toLocaleDateString()}
            </Badge>
          )}
        </div>
      </div>

      {!startValidation.allowed && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <CalendarX className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-900">
                  Job Not Yet Available
                </p>
                <p className="text-sm text-orange-700 mt-1">
                  {startValidation.message}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Steps */}
      <Card className="hidden md:block">
        <CardContent className="pt-6">
          <JobProgressSteps currentStatus={job.status} />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        {/* Mobile: Dropdown Selector */}
        {isMobile ? (
          <div className="mb-4">
            <Select value={activeTab} onValueChange={handleTabChange}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {tabs.find((t) => t.value === activeTab)?.label ||
                    "Select Step"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {tabs.map((tab) => {
                  const { completed, locked } = getTabAccessibility(tab.value);
                  const Icon = tab.icon;

                  return (
                    <SelectItem
                      key={tab.value}
                      value={tab.value}
                      disabled={locked}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                        {completed && (
                          <CheckCircle2 className="h-3 w-3 ml-auto text-green-600" />
                        )}
                        {locked && (
                          <Lock className="h-3 w-3 ml-auto text-gray-400" />
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <TabsList className="grid w-full grid-cols-7 mb-4">
            {tabs.map((tab) => {
              const { completed, locked } = getTabAccessibility(tab.value);
              const Icon = tab.icon;

              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  disabled={locked}
                  className="relative text-xs lg:text-sm"
                >
                  <Icon className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                  <span className="hidden lg:inline">{tab.label}</span>
                  <span className="lg:hidden">{tab.shortLabel}</span>
                  {completed && (
                    <CheckCircle2 className="h-3 w-3 ml-1 text-green-600" />
                  )}
                  {locked && <Lock className="h-3 w-3 ml-1 text-gray-400" />}
                </TabsTrigger>
              );
            })}
          </TabsList>
        )}

        <TabsContent value="info">
          <JobInfo job={job} />
        </TabsContent>

        <TabsContent value="requisition">
          <RequisitionForm
            job={job}
            onComplete={() => handleStepComplete("requisition")}
          />
        </TabsContent>

        <TabsContent value="vehicle">
          <VehicleForm
            job={job}
            onComplete={() => handleStepComplete("vehicle")}
          />
        </TabsContent>

        <TabsContent value="pre-inspection">
          <PreInspection
            job={job}
            onComplete={() => handleStepComplete("pre-inspection")}
          />
        </TabsContent>

        <TabsContent value="installation">
          <InstallationProgress
            job={job}
            onComplete={() => handleStepComplete("installation")}
          />
        </TabsContent>

        <TabsContent value="post-inspection">
          <PostInspection
            job={job}
            onComplete={() => handleStepComplete("post-inspection")}
          />
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
    SCHEDULED: "bg-indigo-500",
    ASSIGNED: "bg-blue-500",
    IN_PROGRESS: "bg-purple-500",
    PRE_INSPECTION_PENDING: "bg-orange-500",
    PRE_INSPECTION_APPROVED: "bg-blue-500",
    POST_INSPECTION_PENDING: "bg-orange-500",
    COMPLETED: "bg-green-500",
    VERIFIED: "bg-green-600",
    REQUISITION_PENDING: "bg-yellow-500",
    REQUISITION_APPROVED: "bg-blue-500",
  };
  return colors[status] || "bg-gray-500";
};

const JobProgressSteps = ({ currentStatus }: { currentStatus: string }) => {
  const steps = [
    { key: "ASSIGNED", label: "Start Job", icon: Play },
    {
      key: "PRE_INSPECTION_APPROVED",
      label: "Pre-Inspection",
      icon: ClipboardCheck,
    },
    { key: "IN_PROGRESS", label: "Installation", icon: Briefcase },
    { key: "POST_INSPECTION_PENDING", label: "Final Check", icon: CheckCircle },
    { key: "COMPLETED", label: "Completed", icon: CheckCircle2 },
  ];

  const currentIndex = steps.findIndex((s) => s.key === currentStatus);

  return (
    <div className="flex items-center w-full overflow-x-auto pb-2">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={`
                  rounded-full p-2 sm:p-3
                  ${isComplete ? "bg-green-500" : isCurrent ? "bg-blue-500" : "bg-gray-300"}
                  text-white transition-all duration-300
                `}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <p className="text-[10px] sm:text-xs mt-1 sm:mt-2 text-center whitespace-nowrap font-medium max-w-[60px] sm:max-w-none">
                {step.label}
              </p>
            </div>

            {index < steps.length - 1 && (
              <div
                className={`
                  flex-1 h-1 mx-1 sm:mx-2 min-w-[20px] transition-all duration-300
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
