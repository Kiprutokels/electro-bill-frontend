import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  Loader2,
  AlertCircle,
  Plus,
  Briefcase,
  Calendar,
  MapPin,
  FileText,
  Wrench,
  RotateCcw,
  Hammer,
  ArrowUp,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  jobsService,
  JobType,
  CreateJobRequest,
} from "@/api/services/jobs.service";
import CustomerSearchCombobox from "./CustomerSearchCombobox";

interface CreateJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const JOB_TYPES = [
  {
    value: JobType.NEW_INSTALLATION,
    label: "New Installation",
    icon: Zap,
  },
  { value: JobType.REPLACEMENT, label: "Replacement", icon: RotateCcw },
  { value: JobType.MAINTENANCE, label: "Maintenance", icon: Wrench },
  { value: JobType.REPAIR, label: "Repair", icon: Hammer },
  { value: JobType.UPGRADE, label: "Upgrade", icon: ArrowUp },
];

const CreateJobDialog = ({ open, onOpenChange }: CreateJobDialogProps) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<CreateJobRequest>({
    customerId: "",
    vehicleId: undefined,
    jobType: JobType.NEW_INSTALLATION,
    productIds: [],
    serviceDescription: "",
    scheduledDate: "",
    location: "",
    installationNotes: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: jobsService.createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job-statistics"] });
      toast.success("✓ Job created successfully!");
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create job");
    },
  });

  const resetForm = () => {
    setFormData({
      customerId: "",
      vehicleId: undefined,
      jobType: JobType.NEW_INSTALLATION,
      productIds: [],
      serviceDescription: "",
      scheduledDate: "",
      location: "",
      installationNotes: "",
    });
    setFormErrors({});
  };

  const validateForm = () => {
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

  const handleSubmit = () => {
    if (!validateForm()) {
      toast.error("Please fill all required fields");
      return;
    }
    createMutation.mutate(formData);
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                Create New Job
              </DialogTitle>
              <DialogDescription className="text-sm mt-1">
                Schedule a new installation or maintenance job for your customer
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-6 py-6 px-6">
            {/* Section 1: Customer Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Customer Details
                </h3>
              </div>

              <div className="space-y-2 col-span-full">
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
            </div>

            {/* Alert Section */}
            <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-xs text-amber-700 dark:text-amber-300 ml-2">
                <strong>Note:</strong> Vehicle assignment is optional. You can
                assign a vehicle later or create one after job creation.
              </AlertDescription>
            </Alert>

            {/* Section 2: Job Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-purple-500 rounded-full"></div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Job Details
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Job Type */}
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
                      {JOB_TYPES.map((type) => {
                        const IconComponent = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {formErrors.jobType && (
                    <p className="text-xs text-red-500">{formErrors.jobType}</p>
                  )}
                </div>

                {/* Scheduled Date */}
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
                      min={new Date().toISOString().split("T")[0]}
                      className="h-11 pl-10 text-base font-medium"
                    />
                  </div>
                  {formErrors.scheduledDate && (
                    <p className="text-xs text-red-500">
                      {formErrors.scheduledDate}
                    </p>
                  )}
                </div>
              </div>

              {/* Location Field */}
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
            </div>

            {/* Section 3: Service & Notes */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-green-500 rounded-full"></div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Service Information
                </h3>
              </div>

              {/* Service Description */}
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
                      setFormErrors({
                        ...formErrors,
                        serviceDescription: "",
                      });
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

              {/* Installation Notes */}
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
          </div>
        </div>

        <DialogFooter className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={createMutation.isPending}
            className="h-10 px-6 font-medium"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="h-10 px-6 font-medium bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            {createMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {createMutation.isPending ? (
              "Creating..."
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Create Job
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateJobDialog;
