import { useEffect, useMemo, useRef, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  AlertCircle,
  Plus,
  Briefcase,
  Calendar,
  MapPin,
  FileText,
  Users,
  Star,
  History,
  Layers,
  Car,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  jobsService,
  JobStatus,
  JobType,
  CreateJobRequest,
  CreateJobBatchRequest,
  CustomerVehicleLite,
  RecentCustomerJobLite,
} from "@/api/services/jobs.service";
import CustomerSearchCombobox from "./CustomerSearchCombobox";
import { techniciansService } from "@/api/services/technicians.service";
import { Checkbox } from "@/components/ui/checkbox";

interface CreateJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const JOB_TYPES = [
  { value: JobType.NEW_INSTALLATION, label: "New Installation" },
  { value: JobType.REPLACEMENT, label: "Replacement" },
  { value: JobType.MAINTENANCE, label: "Maintenance" },
  { value: JobType.REPAIR, label: "Repair" },
  { value: JobType.UPGRADE, label: "Upgrade" },
];

type CreateMode = "single" | "batch";

const statusColor: Record<string, string> = {
  PENDING: "bg-gray-500",
  SCHEDULED: "bg-indigo-500",
  ASSIGNED: "bg-blue-500",
  IN_PROGRESS: "bg-purple-500",
  COMPLETED: "bg-green-500",
  VERIFIED: "bg-green-600",
  CANCELLED: "bg-red-500",
  REQUISITION_PENDING: "bg-yellow-500",
  REQUISITION_APPROVED: "bg-blue-500",
  PRE_INSPECTION_PENDING: "bg-orange-500",
  PRE_INSPECTION_APPROVED: "bg-green-500",
  POST_INSPECTION_PENDING: "bg-orange-500",
};

const formatDate = (value?: string) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
};

const CreateJobDialog = ({ open, onOpenChange }: CreateJobDialogProps) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [mode, setMode] = useState<CreateMode>("single");

  // shared form template (single job OR template for batch jobs)
  const [formData, setFormData] = useState<CreateJobRequest>({
    customerId: "",
    vehicleId: undefined,
    jobType: JobType.NEW_INSTALLATION,
    productIds: [],
    serviceDescription: "",
    scheduledDate: "",
    location: "",
    installationNotes: "",
    technicianIds: [],
    technicianNotes: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // batch-specific
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);
  const [extraJobsWithoutVehicle, setExtraJobsWithoutVehicle] =
    useState<number>(0);

  const maxBatchJobs = 10;

  // =========================
  // Queries: vehicles, recent jobs, technicians
  // =========================

  const customerId = formData.customerId;

  const { data: vehiclesResp, isLoading: vehiclesLoading } = useQuery({
    queryKey: ["customer-vehicles-lite", customerId],
    queryFn: () => jobsService.getCustomerVehicles(customerId),
    enabled: open && !!customerId,
  });

  const vehicles: CustomerVehicleLite[] = vehiclesResp?.data || [];

  const { data: techniciansData, isLoading: techniciansLoading } = useQuery({
    queryKey: ["technicians-available-create-job"],
    queryFn: () =>
      techniciansService.getTechnicians({ limit: 100, isAvailable: true }),
    enabled: open,
  });

  const technicians = techniciansData?.data || [];

  const recentScrollRef = useRef<HTMLDivElement | null>(null);

  const recentQuery = useInfiniteQuery({
    queryKey: ["customer-recent-jobs", customerId],
    enabled: open && !!customerId,
    queryFn: ({ pageParam }) => {
      return jobsService.getCustomerRecentJobs(customerId, {
        take: 10,
        cursor: pageParam || undefined,
      });
    },
    initialPageParam: "",
    getNextPageParam: (lastPage) => lastPage?.meta?.nextCursor || undefined,
  });

  const recentJobs: RecentCustomerJobLite[] = useMemo(() => {
    const pages = recentQuery.data?.pages || [];
    return pages.flatMap((p) => p.data || []);
  }, [recentQuery.data]);

  // load more on scroll
  useEffect(() => {
    const el = recentScrollRef.current;
    if (!el) return;

    const onScroll = () => {
      const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 80;
      if (
        nearBottom &&
        recentQuery.hasNextPage &&
        !recentQuery.isFetchingNextPage
      ) {
        recentQuery.fetchNextPage();
      }
    };

    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [
    recentQuery.hasNextPage,
    recentQuery.isFetchingNextPage,
    recentQuery.fetchNextPage,
  ]);

  // reset batch selections when customer changes
  useEffect(() => {
    setSelectedVehicleIds([]);
    setExtraJobsWithoutVehicle(0);
  }, [customerId]);

  // =========================
  // Backdated helpers
  // =========================

  const isBackdatedJob = () => {
    if (!formData.scheduledDate) return false;
    const selectedDate = new Date(formData.scheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate < today;
  };

  const getDaysAgo = () => {
    if (!formData.scheduledDate) return 0;
    const selectedDate = new Date(formData.scheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - selectedDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getBackdateMessage = () => {
    const daysAgo = getDaysAgo();
    if (daysAgo <= 0) return null;

    if (daysAgo === 1) return "1 day ago";
    if (daysAgo < 7) return `${daysAgo} days ago`;
    if (daysAgo < 30) {
      const weeks = Math.floor(daysAgo / 7);
      return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
    }
    const months = Math.floor(daysAgo / 30);
    return months === 1 ? "1 month ago" : `${months} months ago`;
  };

  // =========================
  // Mutations
  // =========================

  const createSingleMutation = useMutation({
    mutationFn: jobsService.createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job-statistics"] });

      const backdateInfo = isBackdatedJob()
        ? ` (backdated to ${getBackdateMessage()})`
        : "";
      toast.success(`✓ Job created successfully${backdateInfo}!`);

      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create job");
    },
  });

  const createBatchMutation = useMutation({
    mutationFn: (payload: CreateJobBatchRequest) =>
      jobsService.createJobsBatch(payload),
    onSuccess: (resp) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job-statistics"] });

      toast.success(`✓ Created ${resp?.meta?.count || 0} job(s) successfully!`);
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to create jobs batch",
      );
    },
  });

  // =========================
  // UI helpers
  // =========================

  const resetForm = () => {
    setMode("single");
    setFormData({
      customerId: "",
      vehicleId: undefined,
      jobType: JobType.NEW_INSTALLATION,
      productIds: [],
      serviceDescription: "",
      scheduledDate: "",
      location: "",
      installationNotes: "",
      technicianIds: [],
      technicianNotes: "",
    });
    setSelectedVehicleIds([]);
    setExtraJobsWithoutVehicle(0);
    setFormErrors({});
  };

  const validateTemplate = () => {
    const errors: Record<string, string> = {};
    if (!formData.customerId) errors.customerId = "Customer is required";
    if (!formData.jobType) errors.jobType = "Job type is required";
    if (!formData.scheduledDate)
      errors.scheduledDate = "Scheduled date is required";
    if (!formData.serviceDescription)
      errors.serviceDescription = "Service description is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const totalBatchJobs = selectedVehicleIds.length + extraJobsWithoutVehicle;

  const batchTooLarge = totalBatchJobs > maxBatchJobs;

  const toggleVehicle = (id: string) => {
    setSelectedVehicleIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);

      // enforce max selection with extras
      if (prev.length + 1 + extraJobsWithoutVehicle > maxBatchJobs) {
        toast.error(`Max ${maxBatchJobs} jobs per batch`);
        return prev;
      }

      return [...prev, id];
    });
  };

  const toggleTech = (id: string) => {
    setFormData((prev) => {
      const cur = prev.technicianIds || [];
      const next = cur.includes(id)
        ? cur.filter((x) => x !== id)
        : [...cur, id];
      return { ...prev, technicianIds: next };
    });
  };

  const primaryTechName = useMemo(() => {
    const ids = formData.technicianIds || [];
    if (ids.length === 0) return null;
    const primary = technicians.find((t: any) => t.id === ids[0]);
    if (!primary) return "Primary technician selected";
    return `${primary.user.firstName} ${primary.user.lastName}`;
  }, [formData.technicianIds, technicians]);

  // =========================
  // Submit handlers
  // =========================

  const handleSubmitSingle = () => {
    if (!validateTemplate()) {
      toast.error("Please fill all required fields");
      return;
    }

    createSingleMutation.mutate({
      ...formData,
      technicianIds: (formData.technicianIds || []).length
        ? formData.technicianIds
        : undefined,
      technicianNotes: formData.technicianNotes || undefined,
    });
  };

  const handleSubmitBatch = () => {
    if (!validateTemplate()) {
      toast.error("Please fill all required fields");
      return;
    }

    if (totalBatchJobs <= 0) {
      toast.error("Select at least 1 vehicle or add at least 1 extra job");
      return;
    }

    if (batchTooLarge) {
      toast.error(`Max ${maxBatchJobs} jobs per batch`);
      return;
    }

    const template = {
      jobType: formData.jobType,
      productIds: formData.productIds,
      serviceDescription: formData.serviceDescription,
      scheduledDate: formData.scheduledDate,
      location: formData.location,
      installationNotes: formData.installationNotes,
    };

    const jobs = [
      ...selectedVehicleIds.map((vehicleId) => ({ ...template, vehicleId })),
      ...Array.from({ length: extraJobsWithoutVehicle }, () => ({
        ...template,
      })),
    ];

    createBatchMutation.mutate({
      customerId: formData.customerId,
      jobs,
      technicianIds: (formData.technicianIds || []).length
        ? formData.technicianIds
        : undefined,
      technicianNotes: formData.technicianNotes || undefined,
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const pending =
    createSingleMutation.isPending || createBatchMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold">
                Create Job{mode === "batch" ? "s" : ""}
              </DialogTitle>
              <DialogDescription className="text-sm mt-1">
                Select customer → review recent jobs → create single or batch
                jobs (up to 10)
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={mode === "single" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("single")}
                disabled={pending}
              >
                Single
              </Button>
              <Button
                type="button"
                variant={mode === "batch" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("batch")}
                disabled={pending}
              >
                <Layers className="h-4 w-4 mr-1" />
                Batch
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-6 py-6 px-6">
            {/* Customer selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Customer Context
                </h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer" className="text-sm font-semibold">
                  Select Customer <span className="text-red-500">*</span>
                </Label>
                <CustomerSearchCombobox
                  value={formData.customerId}
                  onValueChange={(val) => {
                    setFormData({ ...formData, customerId: val });
                    setFormErrors({ ...formErrors, customerId: "" });
                  }}
                />
                {formErrors.customerId && (
                  <p className="text-xs text-red-500 mt-1">
                    {formErrors.customerId}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    Customer not in list?{" "}
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700"
                      onClick={() => navigate("/customers")}
                    >
                      Create new customer →
                    </Button>
                  </div>
                </div>
              </div>

              {/* Recent jobs panel */}
              {!!customerId && (
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30">
                  <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                      <p className="text-sm font-semibold">
                        Recent jobs for this customer
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {recentJobs.length}
                    </Badge>
                  </div>

                  <div
                    ref={recentScrollRef}
                    className="max-h-[220px] overflow-y-auto p-3 space-y-2"
                  >
                    {recentQuery.isLoading ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : recentJobs.length === 0 ? (
                      <Alert className="bg-muted/40">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          No jobs found for this customer yet.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <>
                        {recentJobs.map((j) => (
                          <div
                            key={j.id}
                            className="rounded-lg border bg-background dark:bg-muted/20 p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-mono font-semibold text-sm truncate">
                                    {j.jobNumber}
                                  </p>
                                  <Badge
                                    className={`${statusColor[j.status] || "bg-gray-500"} text-white text-xs`}
                                  >
                                    {String(j.status).replace(/_/g, " ")}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {String(j.jobType).replace(/_/g, " ")}
                                  </Badge>
                                </div>

                                <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-3 w-3" />
                                    <span>
                                      Scheduled: {formatDate(j.scheduledDate)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3" />
                                    <span className="truncate">
                                      {j.location || "-"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Car className="h-3 w-3" />
                                    <span className="truncate">
                                      {j.vehicle?.vehicleReg
                                        ? `${j.vehicle.vehicleReg} (${j.vehicle.make} ${j.vehicle.model})`
                                        : "No vehicle"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex-shrink-0 text-xs text-muted-foreground">
                                {formatDate(j.createdAt)}
                              </div>
                            </div>
                          </div>
                        ))}

                        {recentQuery.isFetchingNextPage && (
                          <div className="flex justify-center py-2">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Batch-only vehicle selection */}
            {mode === "batch" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-5 bg-amber-500 rounded-full"></div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    Batch Setup (up to {maxBatchJobs})
                  </h3>
                </div>

                {!customerId ? (
                  <Alert className="bg-muted/40">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Select a customer first to load vehicles and recent jobs.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Vehicles */}
                    <div className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold flex items-center gap-2">
                          <Car className="h-4 w-4" />
                          Vehicles
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          Selected: {selectedVehicleIds.length}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground mt-1">
                        Select vehicles to create one job per vehicle.
                      </p>

                      <div className="mt-3 max-h-[220px] overflow-y-auto space-y-2 border rounded-md p-2">
                        {vehiclesLoading ? (
                          <div className="flex justify-center py-6">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          </div>
                        ) : vehicles.length === 0 ? (
                          <Alert className="bg-muted/40">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              No vehicles found for this customer. You can still
                              add “extra jobs without vehicle”.
                            </AlertDescription>
                          </Alert>
                        ) : (
                          vehicles.map((v) => {
                            const selected = selectedVehicleIds.includes(v.id);
                            return (
                              <div
                                key={v.id}
                                className={[
                                  "rounded-md border p-2 cursor-pointer",
                                  selected
                                    ? "border-primary bg-primary/10 dark:bg-primary/20"
                                    : "bg-background hover:bg-accent",
                                ].join(" ")}
                                onClick={() => toggleVehicle(v.id)}
                              >
                                <div className="flex items-start gap-2">
                                  <Checkbox
                                    checked={selected}
                                    onCheckedChange={() => toggleVehicle(v.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="mt-0.5"
                                  />
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold truncate">
                                      {v.vehicleReg}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {v.make} {v.model}{" "}
                                      {v.color ? `• ${v.color}` : ""}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Extra jobs without vehicle */}
                    <div className="rounded-lg border p-3">
                      <p className="text-sm font-semibold flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Extra jobs (no vehicle)
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Use this if vehicles are not yet captured, or you want
                        placeholder jobs.
                      </p>

                      <div className="mt-4 flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={pending || totalBatchJobs >= maxBatchJobs}
                          onClick={() =>
                            setExtraJobsWithoutVehicle((n) =>
                              Math.min(maxBatchJobs, n + 1),
                            )
                          }
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={pending || extraJobsWithoutVehicle <= 0}
                          onClick={() =>
                            setExtraJobsWithoutVehicle((n) =>
                              Math.max(0, n - 1),
                            )
                          }
                        >
                          Remove
                        </Button>

                        <Badge variant="secondary" className="text-xs">
                          {extraJobsWithoutVehicle} extra
                        </Badge>
                      </div>

                      <div className="mt-4">
                        <Alert
                          className={
                            batchTooLarge
                              ? "border-red-300 bg-red-50 dark:bg-red-900/20"
                              : "bg-muted/40"
                          }
                        >
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            Total jobs to create:{" "}
                            <strong>{totalBatchJobs}</strong> / {maxBatchJobs}
                            {batchTooLarge ? " (too many)" : ""}
                          </AlertDescription>
                        </Alert>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* Job template details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-5 bg-purple-500 rounded-full"></div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Job Details {mode === "batch" ? "(applies to all)" : ""}
                </h3>
              </div>

              <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-xs text-amber-700 dark:text-amber-300 ml-2">
                  <strong>Note:</strong>{" "}
                  {mode === "single"
                    ? "Vehicle assignment is optional. You can assign a vehicle later."
                    : "Batch create will generate one job per selected vehicle, plus any extra jobs without vehicle."}
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="jobType" className="text-sm font-semibold">
                    Job Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.jobType}
                    onValueChange={(val) => {
                      setFormData({ ...formData, jobType: val as JobType });
                      setFormErrors({ ...formErrors, jobType: "" });
                    }}
                  >
                    <SelectTrigger className="h-11 text-base font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.jobType && (
                    <p className="text-xs text-red-500">{formErrors.jobType}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="scheduledDate"
                    className="text-sm font-semibold"
                  >
                    Scheduled Date <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-300 pointer-events-none" />
                    <Input
                      id="scheduledDate"
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          scheduledDate: e.target.value,
                        });
                        setFormErrors({ ...formErrors, scheduledDate: "" });
                      }}
                      className="h-11 pl-10 text-base font-medium"
                    />
                  </div>
                  {formErrors.scheduledDate && (
                    <p className="text-xs text-red-500">
                      {formErrors.scheduledDate}
                    </p>
                  )}

                  {isBackdatedJob() && (
                    <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-md border border-orange-200 dark:border-orange-800">
                      <History className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                      <p className="text-xs text-orange-700 dark:text-orange-300 font-medium">
                        Backdated job: {getBackdateMessage()}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    You can select past dates to create backdated jobs
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-semibold">
                  Installation Location
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Input
                    id="location"
                    placeholder="e.g., Customer site, Nairobi, or workshop"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="h-11 pl-10 text-base"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Optional: Can be updated later
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="serviceDescription"
                  className="text-sm font-semibold"
                >
                  Service Description <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Textarea
                    id="serviceDescription"
                    placeholder="Describe the work to be done in detail..."
                    value={formData.serviceDescription}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        serviceDescription: e.target.value,
                      });
                      setFormErrors({ ...formErrors, serviceDescription: "" });
                    }}
                    rows={5}
                    className="pl-10 text-base resize-none"
                  />
                </div>
                {formErrors.serviceDescription && (
                  <p className="text-xs text-red-500">
                    {formErrors.serviceDescription}
                  </p>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formData.serviceDescription.length}/500 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="installationNotes"
                  className="text-sm font-semibold"
                >
                  Installation Notes{" "}
                  <span className="text-slate-500">(Optional)</span>
                </Label>
                <Textarea
                  id="installationNotes"
                  placeholder="Additional notes, special instructions, or any other relevant information..."
                  value={formData.installationNotes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      installationNotes: e.target.value,
                    })
                  }
                  rows={3}
                  className="text-base resize-none"
                />
              </div>
            </div>

            <Separator />

            {/* Technician assignment (optional) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-5 bg-green-500 rounded-full"></div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Assign Technicians Now (optional)
                </h3>
              </div>

              <Alert className="bg-muted/40">
                <Star className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  If you select technicians here, the first selected becomes the{" "}
                  <strong>Primary</strong>.{" "}
                  {mode === "batch"
                    ? "The same team will be assigned to all created jobs."
                    : ""}
                </AlertDescription>
              </Alert>

              {techniciansLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : technicians.length === 0 ? (
                <Alert className="bg-muted/40">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    No available technicians found.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Available technicians
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      Selected: {(formData.technicianIds || []).length}
                    </Badge>
                  </div>

                  {primaryTechName && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Primary: <strong>{primaryTechName}</strong>
                    </p>
                  )}

                  <div className="mt-3 max-h-[240px] overflow-y-auto space-y-2 border rounded-md p-2">
                    {technicians.map((t: any) => {
                      const selected = (formData.technicianIds || []).includes(
                        t.id,
                      );
                      const order =
                        (formData.technicianIds || []).indexOf(t.id) + 1;

                      return (
                        <div
                          key={t.id}
                          className={[
                            "rounded-md border p-2 cursor-pointer",
                            selected
                              ? "border-primary bg-primary/10 dark:bg-primary/20"
                              : "bg-background hover:bg-accent",
                          ].join(" ")}
                          onClick={() => toggleTech(t.id)}
                        >
                          <div className="flex items-start gap-2">
                            <Checkbox
                              checked={selected}
                              onCheckedChange={() => toggleTech(t.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="mt-0.5"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold">
                                  {t.user.firstName} {t.user.lastName}
                                </p>
                                {selected && order === 1 && (
                                  <Badge variant="default" className="text-xs">
                                    <Star className="h-3 w-3 mr-1" />
                                    Primary
                                  </Badge>
                                )}
                                {selected && order > 1 && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    #{order}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {t.technicianCode} • {t.location}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 space-y-2">
                    <Label
                      htmlFor="technicianNotes"
                      className="text-sm font-semibold"
                    >
                      Assignment Notes (optional)
                    </Label>
                    <Textarea
                      id="technicianNotes"
                      placeholder="Add notes about this team assignment..."
                      value={formData.technicianNotes || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          technicianNotes: e.target.value,
                        })
                      }
                      rows={2}
                      className="text-base resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={pending}
            className="h-10 px-6 font-medium"
          >
            Cancel
          </Button>

          {mode === "single" ? (
            <Button
              onClick={handleSubmitSingle}
              disabled={pending}
              className="h-10 px-6 font-medium bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {pending ? "Creating..." : "Create Job"}
            </Button>
          ) : (
            <Button
              onClick={handleSubmitBatch}
              disabled={
                pending || !customerId || totalBatchJobs <= 0 || batchTooLarge
              }
              className="h-10 px-6 font-medium bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {pending ? "Creating..." : `Create ${totalBatchJobs} Job(s)`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateJobDialog;
