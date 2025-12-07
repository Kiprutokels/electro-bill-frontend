import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  UserPlus,
  Loader2,
  Users,
  Settings,
} from 'lucide-react';
import { jobsService, JobStatus, Job } from '@/api/services/jobs.service';

// Import modals
import CreateJobDialog from '@/components/jobs/CreateJobDialog';
import ViewJobDialog from '@/components/jobs/ViewJobDialog';
import AssignTechnicianDialog from '@/components/jobs/AssignTechnicianDialog';
import ManageTechniciansDialog from '@/components/jobs/ManageTechniciansDialog';
import CancelJobDialog from '@/components/jobs/CancelJobDialog';

const Jobs = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | undefined>();

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

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

  // Fetch statistics
  const { data: statistics } = useQuery({
    queryKey: ['job-statistics'],
    queryFn: jobsService.getStatistics,
  });

  const handleView = (job: Job) => {
    setSelectedJob(job);
    setIsViewDialogOpen(true);
  };

  const handleAssignClick = (job: Job) => {
    setSelectedJob(job);
    setIsAssignDialogOpen(true);
  };

  const handleManageClick = (job: Job) => {
    setSelectedJob(job);
    setIsManageDialogOpen(true);
  };

  const handleCancelClick = (job: Job) => {
    setSelectedJob(job);
    setIsCancelDialogOpen(true);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Job Management</h1>
          <p className="text-muted-foreground">Track installation and maintenance jobs</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Job
        </Button>
      </div>

      {/* Statistics */}
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
            <div className="text-2xl font-bold text-orange-600">
              {statistics?.awaitingInspection || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Active Jobs</CardTitle>
            <div className="flex gap-2">
              <Select
                value={statusFilter}
                onValueChange={(val) => setStatusFilter(val === 'all' ? undefined : (val as JobStatus))}
              >
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
                  <TableHead>Technicians</TableHead>
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
                          <div className="font-medium">
                            {job.customer.businessName || job.customer.contactPerson}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {job.vehicle
                              ? `${job.vehicle.vehicleReg} - ${job.vehicle.make} ${job.vehicle.model}`
                              : 'No vehicle assigned'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getJobTypeBadge(job.jobType)}</TableCell>
                      <TableCell>
                        {job.technicians && job.technicians.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{job.technicians.length}</span>
                            <span className="text-xs text-muted-foreground">
                              ({job.technicians.find((t) => t.isPrimary)?.firstName || 'N/A'})
                            </span>
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
                          {job.status === JobStatus.PENDING && !job.technicians?.length && (
                            <Button size="sm" onClick={() => handleAssignClick(job)}>
                              <UserPlus className="h-4 w-4 mr-1" />
                              Assign
                            </Button>
                          )}
                          {job.technicians && job.technicians.length > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleManageClick(job)}
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Manage
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

      {/* Dialogs */}
      <CreateJobDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />

      <ViewJobDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        job={selectedJob}
        onManageTechnicians={() => {
          setIsViewDialogOpen(false);
          if (selectedJob?.technicians?.length) {
            setIsManageDialogOpen(true);
          } else {
            setIsAssignDialogOpen(true);
          }
        }}
        onCancel={() => {
          setIsViewDialogOpen(false);
          handleCancelClick(selectedJob!);
        }}
      />

      <AssignTechnicianDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        job={selectedJob}
      />

      <ManageTechniciansDialog
        open={isManageDialogOpen}
        onOpenChange={setIsManageDialogOpen}
        job={selectedJob}
      />

      <CancelJobDialog
        open={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
        job={selectedJob}
      />
    </div>
  );
};

export default Jobs;