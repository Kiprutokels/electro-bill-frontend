import React, { useState } from 'react';
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
import { Plus, Briefcase, Clock, CheckCircle, XCircle, Eye, Calendar, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Job {
  id: string;
  jobNumber: string;
  customerId: string;
  customerName: string;
  vehicleId: string;
  vehicleReg: string;
  vehicleMake: string;
  vehicleModel: string;
  technicianId: string | null;
  technicianName: string | null;
  jobType: string;
  status: string;
  scheduledDate: string;
  startTime: string | null;
  endTime: string | null;
  serviceDescription: string;
  createdAt: string;
}

const INITIAL_JOBS: Job[] = [
  {
    id: '1',
    jobNumber: 'JOB-2025-045',
    customerId: 'cust-1',
    customerName: 'Safaricom Ltd',
    vehicleId: 'v-1',
    vehicleReg: 'KCA 123A',
    vehicleMake: 'Toyota',
    vehicleModel: 'Land Cruiser',
    technicianId: 'tech-1',
    technicianName: 'James Mwangi',
    jobType: 'NEW_INSTALLATION',
    status: 'PRE_INSPECTION_PENDING',
    scheduledDate: '2025-01-20',
    startTime: null,
    endTime: null,
    serviceDescription: 'Install GPS tracker and fuel monitoring system',
    createdAt: '2025-01-15',
  },
  {
    id: '2',
    jobNumber: 'JOB-2025-044',
    customerId: 'cust-2',
    customerName: 'East African Breweries',
    vehicleId: 'v-2',
    vehicleReg: 'KBZ 456B',
    vehicleMake: 'Mercedes',
    vehicleModel: 'Actros',
    technicianId: 'tech-2',
    technicianName: 'Grace Achieng',
    jobType: 'MAINTENANCE',
    status: 'IN_PROGRESS',
    scheduledDate: '2025-01-18',
    startTime: '2025-01-18T09:30:00',
    endTime: null,
    serviceDescription: 'Routine maintenance and system check',
    createdAt: '2025-01-14',
  },
];

const DUMMY_CUSTOMERS = [
  { id: 'cust-1', name: 'Safaricom Ltd' },
  { id: 'cust-2', name: 'East African Breweries' },
  { id: 'cust-3', name: 'Nairobi Water' },
];

const DUMMY_VEHICLES = [
  { id: 'v-1', reg: 'KCA 123A', make: 'Toyota', model: 'Land Cruiser', customerId: 'cust-1' },
  { id: 'v-2', reg: 'KBZ 456B', make: 'Mercedes', model: 'Actros', customerId: 'cust-2' },
  { id: 'v-3', reg: 'KCD 789C', make: 'Isuzu', model: 'NQR', customerId: 'cust-3' },
];

const DUMMY_TECHNICIANS = [
  { id: 'tech-1', name: 'James Mwangi', code: 'TECH001' },
  { id: 'tech-2', name: 'Grace Achieng', code: 'TECH002' },
  { id: 'tech-3', name: 'David Omondi', code: 'TECH003' },
];

const JOB_TYPES = ['NEW_INSTALLATION', 'REPLACEMENT', 'MAINTENANCE', 'REPAIR', 'UPGRADE'];

const JOB_STATUSES = [
  'PENDING',
  'ASSIGNED',
  'REQUISITION_PENDING',
  'REQUISITION_APPROVED',
  'PRE_INSPECTION_PENDING',
  'PRE_INSPECTION_APPROVED',
  'IN_PROGRESS',
  'POST_INSPECTION_PENDING',
  'COMPLETED',
  'VERIFIED',
  'CANCELLED',
];

const Jobs = () => {
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [cancelJob, setCancelJob] = useState<Job | null>(null);

  const [formData, setFormData] = useState({
    customerId: '',
    vehicleId: '',
    jobType: '',
    scheduledDate: '',
    serviceDescription: '',
  });

  const [assignTechnicianId, setAssignTechnicianId] = useState('');

  const filteredJobs = jobs.filter(
    (j) =>
      j.jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.vehicleReg.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      customerId: '',
      vehicleId: '',
      jobType: '',
      scheduledDate: '',
      serviceDescription: '',
    });
  };

  const getFilteredVehicles = () => {
    return DUMMY_VEHICLES.filter((v) => v.customerId === formData.customerId);
  };

  const handleAdd = () => {
    if (!formData.customerId || !formData.vehicleId || !formData.jobType || !formData.scheduledDate) {
      toast.error('Please fill all required fields');
      return;
    }

    const customer = DUMMY_CUSTOMERS.find((c) => c.id === formData.customerId);
    const vehicle = DUMMY_VEHICLES.find((v) => v.id === formData.vehicleId);

    const newJob: Job = {
      id: `j-${Date.now()}`,
      jobNumber: `JOB-${new Date().getFullYear()}-${String(jobs.length + 1).padStart(3, '0')}`,
      customerId: formData.customerId,
      customerName: customer?.name || '',
      vehicleId: formData.vehicleId,
      vehicleReg: vehicle?.reg || '',
      vehicleMake: vehicle?.make || '',
      vehicleModel: vehicle?.model || '',
      technicianId: null,
      technicianName: null,
      jobType: formData.jobType,
      status: 'PENDING',
      scheduledDate: formData.scheduledDate,
      startTime: null,
      endTime: null,
      serviceDescription: formData.serviceDescription,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setJobs([newJob, ...jobs]);
    toast.success('Job created successfully');
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleAssignTechnician = () => {
    if (!selectedJob || !assignTechnicianId) {
      toast.error('Please select a technician');
      return;
    }

    const technician = DUMMY_TECHNICIANS.find((t) => t.id === assignTechnicianId);
    const updatedJobs = jobs.map((j) =>
      j.id === selectedJob.id
        ? {
            ...j,
            technicianId: assignTechnicianId,
            technicianName: technician?.name || null,
            status: 'ASSIGNED',
          }
        : j
    );

    setJobs(updatedJobs);
    toast.success('Technician assigned successfully');
    setIsAssignDialogOpen(false);
    setSelectedJob(null);
    setAssignTechnicianId('');
  };

  const handleStatusChange = (job: Job, newStatus: string) => {
    const updatedJobs = jobs.map((j) =>
      j.id === job.id
        ? {
            ...j,
            status: newStatus,
            startTime: newStatus === 'IN_PROGRESS' && !j.startTime ? new Date().toISOString() : j.startTime,
            endTime: newStatus === 'COMPLETED' ? new Date().toISOString() : j.endTime,
          }
        : j
    );

    setJobs(updatedJobs);
    toast.success(`Job status updated to ${newStatus.replace(/_/g, ' ')}`);
  };

  const handleCancel = () => {
    if (!cancelJob) return;
    const updatedJobs = jobs.map((j) => (j.id === cancelJob.id ? { ...j, status: 'CANCELLED' } : j));
    setJobs(updatedJobs);
    toast.success('Job cancelled successfully');
    setCancelJob(null);
  };

  const handleView = (job: Job) => {
    setSelectedJob(job);
    setIsViewDialogOpen(true);
  };

  const handleAssignClick = (job: Job) => {
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
            <div className="text-2xl font-bold">{jobs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {jobs.filter((j) => j.status === 'PENDING').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {jobs.filter((j) => j.status === 'IN_PROGRESS').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {jobs.filter((j) => j.status === 'COMPLETED' || j.status === 'VERIFIED').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Inspection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {jobs.filter((j) => j.status.includes('INSPECTION_PENDING')).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Jobs</CardTitle>
            <Input
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
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
                {filteredJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm ? 'No jobs found.' : 'No jobs created yet.'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono font-medium">{job.jobNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{job.customerName}</div>
                          <div className="text-sm text-muted-foreground">
                            {job.vehicleReg} - {job.vehicleMake} {job.vehicleModel}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getJobTypeBadge(job.jobType)}</TableCell>
                      <TableCell>
                        {job.technicianName ? (
                          <div className="text-sm">{job.technicianName}</div>
                        ) : (
                          <Badge variant="outline">Unassigned</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                          {job.scheduledDate}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleView(job)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {job.status === 'PENDING' && (
                            <Button size="sm" onClick={() => handleAssignClick(job)}>
                              <UserPlus className="h-4 w-4 mr-1" />
                              Assign
                            </Button>
                          )}
                          {job.status === 'ASSIGNED' && (
                            <Button size="sm" onClick={() => handleStatusChange(job, 'IN_PROGRESS')}>
                              Start Job
                            </Button>
                          )}
                          {job.status === 'IN_PROGRESS' && (
                            <Button size="sm" onClick={() => handleStatusChange(job, 'COMPLETED')}>
                              Complete
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
                onValueChange={(val) => setFormData({ ...formData, customerId: val, vehicleId: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {DUMMY_CUSTOMERS.map((cust) => (
                    <SelectItem key={cust.id} value={cust.id}>
                      {cust.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle">
                Vehicle <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.vehicleId}
                onValueChange={(val) => setFormData({ ...formData, vehicleId: val })}
                disabled={!formData.customerId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {getFilteredVehicles().map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.reg} - {vehicle.make} {vehicle.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jobType">
                  Job Type <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.jobType} onValueChange={(val) => setFormData({ ...formData, jobType: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
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
              <Label htmlFor="serviceDescription">Service Description</Label>
              <Textarea
                id="serviceDescription"
                placeholder="Describe the work to be done..."
                value={formData.serviceDescription}
                onChange={(e) => setFormData({ ...formData, serviceDescription: e.target.value })}
                rows={3}
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
            <Button onClick={handleAdd}>Create Job</Button>
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
                  <p className="font-medium">{selectedJob.customerName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Vehicle</Label>
                  <p className="font-medium">
                    {selectedJob.vehicleReg} - {selectedJob.vehicleMake} {selectedJob.vehicleModel}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Job Type</Label>
                  <div className="mt-1">{getJobTypeBadge(selectedJob.jobType)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Technician</Label>
                  <p className="font-medium">{selectedJob.technicianName || 'Not assigned'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Scheduled Date</Label>
                  <p className="font-medium">{selectedJob.scheduledDate}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created Date</Label>
                  <p className="font-medium">{selectedJob.createdAt}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Service Description</Label>
                <p className="text-sm mt-1">{selectedJob.serviceDescription || 'No description provided'}</p>
              </div>
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
            <Button variant="destructive" onClick={() => setCancelJob(selectedJob)}>
              Cancel Job
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
              {selectedJob?.status === 'PENDING' && (
                <Button onClick={() => handleAssignClick(selectedJob)}>Assign Technician</Button>
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
              <Select value={assignTechnicianId} onValueChange={setAssignTechnicianId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select technician" />
                </SelectTrigger>
                <SelectContent>
                  {DUMMY_TECHNICIANS.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.name} ({tech.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAssignDialogOpen(false);
                setAssignTechnicianId('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAssignTechnician}>Assign Technician</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Job Dialog */}
      <AlertDialog open={!!cancelJob} onOpenChange={() => setCancelJob(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel job "{cancelJob?.jobNumber}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Keep Job</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground">
              Yes, Cancel Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Jobs;