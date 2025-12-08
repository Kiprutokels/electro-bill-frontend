import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { jobsService, JobType, CreateJobRequest } from '@/api/services/jobs.service';
import { customersService } from '@/api/services/customers.service';

interface CreateJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const JOB_TYPES = [
  { value: JobType.NEW_INSTALLATION, label: 'New Installation' },
  { value: JobType.REPLACEMENT, label: 'Replacement' },
  { value: JobType.MAINTENANCE, label: 'Maintenance' },
  { value: JobType.REPAIR, label: 'Repair' },
  { value: JobType.UPGRADE, label: 'Upgrade' },
];

const CreateJobDialog = ({ open, onOpenChange }: CreateJobDialogProps) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<CreateJobRequest>({
    customerId: '',
    vehicleId: undefined,
    jobType: JobType.NEW_INSTALLATION,
    productIds: [],
    serviceDescription: '',
    scheduledDate: '',
    installationNotes: '',
  });

  // Fetch customers
  const { data: customersData } = useQuery({
    queryKey: ['customers-all'],
    queryFn: () => customersService.getCustomers({ limit: 100 }),
    enabled: open,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: jobsService.createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job-statistics'] });
      toast.success('Job created successfully');
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create job');
    },
  });

  const resetForm = () => {
    setFormData({
      customerId: '',
      vehicleId: undefined,
      jobType: JobType.NEW_INSTALLATION,
      productIds: [],
      serviceDescription: '',
      scheduledDate: '',
      installationNotes: '',
    });
  };

  const handleSubmit = () => {
    if (!formData.customerId || !formData.jobType || !formData.scheduledDate || !formData.serviceDescription) {
      toast.error('Please fill all required fields');
      return;
    }

    createMutation.mutate(formData);
  };

  const customers = customersData?.data || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Job</DialogTitle>
          <DialogDescription>
            Schedule a new installation or maintenance job. Vehicle assignment is optional and can be added later.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Customer Selection */}
          <div className="space-y-2">
            <Label htmlFor="customer">
              Customer <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.customerId}
              onValueChange={(val) => setFormData({ ...formData, customerId: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((cust) => (
                  <SelectItem key={cust.id} value={cust.id}>
                    {cust.businessName || cust.contactPerson} ({cust.customerCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">Customer not found?</p>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() => navigate('/customers')}
              >
                <Plus className="h-3 w-3 mr-1" />
                Create new customer
              </Button>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Note:</strong> Vehicle assignment is optional. You can assign a vehicle later or create one after job creation.
            </AlertDescription>
          </Alert>

          {/* Job Type and Scheduled Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobType">
                Job Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.jobType}
                onValueChange={(val) => setFormData({ ...formData, jobType: val as JobType })}
              >
                <SelectTrigger>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledDate">
                Scheduled Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="scheduledDate"
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Service Description */}
          <div className="space-y-2">
            <Label htmlFor="serviceDescription">
              Service Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="serviceDescription"
              placeholder="Describe the work to be done..."
              value={formData.serviceDescription}
              onChange={(e) => setFormData({ ...formData, serviceDescription: e.target.value })}
              rows={4}
            />
          </div>

          {/* Installation Notes */}
          <div className="space-y-2">
            <Label htmlFor="installationNotes">Installation Notes (Optional)</Label>
            <Textarea
              id="installationNotes"
              placeholder="Additional notes or special instructions..."
              value={formData.installationNotes}
              onChange={(e) => setFormData({ ...formData, installationNotes: e.target.value })}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Job
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateJobDialog;