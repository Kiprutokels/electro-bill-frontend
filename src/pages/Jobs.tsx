import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Briefcase, Clock, CheckCircle, XCircle, Eye, Calendar, UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  jobsService,
  JobType,
  JobStatus,
  CreateJobRequest,
  AssignTechnicianRequest,
} from '@/api/services/jobs.service';
import { customersService } from '@/api/services/customers.service';
import { techniciansService } from '@/api/services/technicians.service';

const JOB_TYPES = Object.values(JobType);

const Jobs = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | undefined>();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [cancelJob, setCancelJob] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');

  const [formData, setFormData] = useState<CreateJobRequest>({
    customerId: '',
    vehicleId: undefined,
    jobType: JobType.NEW_INSTALLATION,
    productIds: [],
    serviceDescription: '',
    scheduledDate: '',
    installationNotes: '',
  });

  const [assignData, setAssignData] = useState<AssignTechnicianRequest>({
    technicianIds: [],
    notes: '',
  });

  // Fetch jobs
  const { data: jobsData, isLoading } = useQuery({
    queryKey: ['jobs', page, searchTerm, statusFilter],
    queryFn: () =>
      jobsService.getJobs({
        page,
        limit: 10,
        search: searchTerm,
        status: statusFilter,
      }),
  });

  // Fetch job statistics
  const { data: statistics } = useQuery({
    queryKey: ['job-statistics'],
    queryFn: jobsService.getStatistics,
  });

  // Fetch customers for dropdown
  const { data: customersData } = useQuery({
    queryKey: ['customers-all'],
    queryFn: () => customersService.getCustomers({ limit: 100 }),
  });

  // Fetch technicians for assignment
  const { data: techniciansData } = useQuery({
    queryKey: ['technicians-all'],
    queryFn: () => techniciansService.getTechnicians({ limit: 100, isAvailable: true }),
    enabled: isAssignDialogOpen,
  });

  // Create job mutation
  const createMutation = useMutation({
    mutationFn: jobsService.createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job-statistics'] });
      toast.success('Job created successfully');
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create job');
    },
  });

  // Assign technician mutation
  const assignMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssignTechnicianRequest }) =>
      jobsService.assignTechnicians(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job-statistics'] });
      toast.success('Technician assigned successfully');
      setIsAssignDialogOpen(false);
      setSelectedJob(null);
      setAssignData({ technicianIds: [], notes: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to assign technician');
    },
  });

  // Cancel job mutation
  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      jobsService.cancelJob(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job-statistics'] });
      toast.success('Job cancelled successfully');
      setCancelJob(null);
      setCancelReason('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel job');
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

  const handleAdd = () => {
    if (!formData.customerId || !formData.jobType || !formData.scheduledDate) {
      toast.error('Please fill all required fields');
      return;
    }

    createMutation.mutate(formData);
  };

  const handleAssign = () => {
    if (!selectedJob || assignData.technicianIds.length === 0) {
      toast.error('Please select a technician');
      return;
    }

    assignMutation.mutate({
      id: selectedJob.id,
      data: assignData,
    });
  };

  const handleCancel = () => {
    if (!cancelJob) return;

    cancelMutation.mutate({
      id: cancelJob.id,
      reason: cancelReason,
    });
  };

  const handleView = (job: any) => {
    setSelectedJob(job);
    setIsViewDialogOpen(true);
  };

  const handleAssignClick = (job: any) => {
    setSelectedJob(job);
    setIsAssignDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: any }> = {
      PENDING: { color: 'bg-gray-500', icon: Clock },
      ASSIGNED: { color: 'bg-blue-500', icon: Briefcase },
      REQUISITION_PENDING: { color: 'bg-yellow-500', icon: Clock },
      REQUISITION_APPROVED: { color: 'bg-blue-500', icon: CheckCircle },
      PRE_INSPECTION_PENDING: { color: 'bg-orange-500', icon: Clock },
      PRE_INSPECTION_APPROVED: { color: 'bg-blue-500', icon: CheckCircle },
      IN_PROGRESS: { color: 'bg-purple-500', icon: Briefcase },
      POST_INSPECTION_PENDING: { color: 'bg-orange-500', icon: Clock },
      COMPLETED: { color: 'bg-green-500', icon: CheckCircle },
      VERIFIED: { color: 'bg-green-600', icon: CheckCircle },
      CANCELLED: { color: 'bg-red-500', icon: XCircle },
    };

    const variant = variants[status] || variants['PENDING'];
    const Icon = variant.icon;

    return (
      <Badge className={`${variant.color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace(/_/g, ' ')}
      </Badge>
    );
  };

  const getJobTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      NEW_INSTALLATION: 'bg-blue-100 text-blue-800',
      REPLACEMENT: 'bg-orange-100 text-orange-800',
      MAINTENANCE: 'bg-green-100 text-green-800',
      REPAIR: 'bg-red-100 text-red-800',
      UPGRADE: 'bg-purple-100 text-purple-800',
    };

    return (
      <Badge variant="outline" className={colors[type]}>
        {type.replace('_', ' ')}
      </Badge>
    );
  };

  const jobs = jobsData?.data || [];
  const customers = customersData?.data || [];
  const technicians = techniciansData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Job Management</h1>
          <p className="text-muted-foreground">Track installation and maintenance jobs</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Job
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{statistics?.pending || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{statistics?.inProgress || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statistics?.completed || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Inspection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{statistics?.awaitingInspection || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Active Jobs</CardTitle>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as JobStatus)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.values(JobStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Number</TableHead>
                  <TableHead>Customer/Vehicle</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : jobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm ? 'No jobs found.' : 'No jobs created yet.'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono font-medium">{job.jobNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{job.customer.businessName || job.customer.contactPerson}</div>
                          <div className="text-sm text-muted-foreground">
                            {job.vehicle ? `${job.vehicle.vehicleReg} - ${job.vehicle.make} ${job.vehicle.model}` : 'No vehicle assigned'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getJobTypeBadge(job.jobType)}</TableCell>
                      <TableCell>
                        {job.technician ? (
                          <div className="text-sm">
                            {job.technician.user.firstName} {job.technician.user.lastName}
                          </div>
                        ) : (
                          <Badge variant="outline">Unassigned</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                          {new Date(job.scheduledDate).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleView(job)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {job.status === JobStatus.PENDING && (
                            <Button size="sm" onClick={() => handleAssignClick(job)}>
                              <UserPlus className="h-4 w-4 mr-1" />
                              Assign
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {jobsData && jobsData.meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {jobs.length} of {jobsData.meta.total} jobs
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= jobsData.meta.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Job Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Job</DialogTitle>
            <DialogDescription>Schedule a new installation or maintenance job</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-muted-foreground">Customer not found?</p>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={() => navigate('/customers')}
                >
                  Create new customer
                </Button>
              </div>
            </div>

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
                      <SelectItem key={type} value={type}>
                        {type.replace('_', ' ')}
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
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceDescription">
                Service Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="serviceDescription"
                placeholder="Describe the work to be done..."
                value={formData.serviceDescription}
                onChange={(e) => setFormData({ ...formData, serviceDescription: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="installationNotes">Installation Notes</Label>
              <Textarea
                id="installationNotes"
                placeholder="Additional notes..."
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
                setIsAddDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Job Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Job Number</Label>
                  <p className="font-mono font-medium text-lg">{selectedJob.jobNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedJob.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Customer</Label>
                  <p className="font-medium">{selectedJob.customer.businessName || selectedJob.customer.contactPerson}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Vehicle</Label>
                  <p className="font-medium">
                    {selectedJob.vehicle
                      ? `${selectedJob.vehicle.vehicleReg} - ${selectedJob.vehicle.make} ${selectedJob.vehicle.model}`
                      : 'Not assigned'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Job Type</Label>
                  <div className="mt-1">{getJobTypeBadge(selectedJob.jobType)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Technician</Label>
                  <p className="font-medium">
                    {selectedJob.technician
                      ? `${selectedJob.technician.user.firstName} ${selectedJob.technician.user.lastName}`
                      : 'Not assigned'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Scheduled Date</Label>
                  <p className="font-medium">{new Date(selectedJob.scheduledDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created Date</Label>
                  <p className="font-medium">{new Date(selectedJob.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Service Description</Label>
                <p className="text-sm mt-1">{selectedJob.serviceDescription}</p>
              </div>
              {selectedJob.installationNotes && (
                <div>
                  <Label className="text-muted-foreground">Installation Notes</Label>
                  <p className="text-sm mt-1">{selectedJob.installationNotes}</p>
                </div>
              )}
              {selectedJob.startTime && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Start Time</Label>
                    <p className="font-medium">{new Date(selectedJob.startTime).toLocaleString()}</p>
                  </div>
                  {selectedJob.endTime && (
                    <div>
                      <Label className="text-muted-foreground">End Time</Label>
                      <p className="font-medium">{new Date(selectedJob.endTime).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex justify-between">
            <Button
              variant="destructive"
              onClick={() => {
                setIsViewDialogOpen(false);
                setCancelJob(selectedJob);
              }}
              disabled={
                selectedJob?.status === JobStatus.COMPLETED ||
                selectedJob?.status === JobStatus.VERIFIED ||
                selectedJob?.status === JobStatus.CANCELLED
              }
            >
              Cancel Job
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
              {selectedJob?.status === JobStatus.PENDING && (
                <Button
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    handleAssignClick(selectedJob);
                  }}
                >
                  Assign Technician
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Technician Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Technician</DialogTitle>
            <DialogDescription>
              Select a technician for job {selectedJob?.jobNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="technician">
                Technician <span className="text-destructive">*</span>
              </Label>
              <Select
                value={assignData.technicianIds[0]}
                onValueChange={(val) => setAssignData({ ...assignData, technicianIds: [val] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select technician" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.user.firstName} {tech.user.lastName} ({tech.technicianCode}) - {tech.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignNotes">Notes</Label>
              <Textarea
                id="assignNotes"
                placeholder="Assignment notes..."
                value={assignData.notes}
                onChange={(e) => setAssignData({ ...assignData, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAssignDialogOpen(false);
                setAssignData({ technicianIds: [], notes: '' });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={assignMutation.isPending}>
              {assignMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign Technician
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Job Dialog */}
      <AlertDialog open={!!cancelJob} onOpenChange={() => setCancelJob(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel job "{cancelJob?.jobNumber}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="cancelReason">Cancellation Reason (Optional)</Label>
            <Textarea
              id="cancelReason"
              placeholder="Enter reason for cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCancelReason('')}>No, Keep Job</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground"
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, Cancel Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Jobs;