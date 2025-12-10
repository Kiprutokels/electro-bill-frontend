import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
  MoreVertical,
  FileText,
  DollarSign,
} from "lucide-react";
import { jobsService, JobStatus, Job } from "@/api/services/jobs.service";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS } from "@/utils/constants";

// Import modals
import CreateJobDialog from "@/components/jobs/CreateJobDialog";
import ViewJobDialog from "@/components/jobs/ViewJobDialog";
import AssignTechnicianDialog from "@/components/jobs/AssignTechnicianDialog";
import ManageTechniciansDialog from "@/components/jobs/ManageTechniciansDialog";
import CancelJobDialog from "@/components/jobs/CancelJobDialog";

const Jobs = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
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
    queryKey: ["jobs", page, searchTerm, statusFilter],
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
    queryKey: ["job-statistics"],
    queryFn: jobsService.getStatistics,
  });

  const handleView = (job: Job) => {
    setSelectedJob(job);
    setIsViewDialogOpen(true);
  };

  const handleViewWorkflow = (job: Job) => {
    navigate(`/jobs/${job.id}/workflow`);
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

  const handleGenerateInvoice = (job: Job) => {
    navigate(`/jobs/${job.id}/workflow`);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: any }> = {
      PENDING: { color: "bg-gray-500", icon: Clock },
      ASSIGNED: { color: "bg-blue-500", icon: Briefcase },
      REQUISITION_PENDING: { color: "bg-yellow-500", icon: Clock },
      REQUISITION_APPROVED: { color: "bg-blue-500", icon: CheckCircle },
      PRE_INSPECTION_PENDING: { color: "bg-orange-500", icon: Clock },
      PRE_INSPECTION_APPROVED: { color: "bg-blue-500", icon: CheckCircle },
      IN_PROGRESS: { color: "bg-purple-500", icon: Briefcase },
      POST_INSPECTION_PENDING: { color: "bg-orange-500", icon: Clock },
      COMPLETED: { color: "bg-green-500", icon: CheckCircle },
      VERIFIED: { color: "bg-green-600", icon: CheckCircle },
      CANCELLED: { color: "bg-red-500", icon: XCircle },
    };

    const variant = variants[status] || variants["PENDING"];
    const Icon = variant.icon;

    return (
      <Badge className={`${variant.color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace(/_/g, " ")}
      </Badge>
    );
  };

  const getJobTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      NEW_INSTALLATION: "bg-blue-100 text-blue-800",
      REPLACEMENT: "bg-orange-100 text-orange-800",
      MAINTENANCE: "bg-green-100 text-green-800",
      REPAIR: "bg-red-100 text-red-800",
      UPGRADE: "bg-purple-100 text-purple-800",
    };

    return (
      <Badge variant="outline" className={colors[type]}>
        {type.replace("_", " ")}
      </Badge>
    );
  };

  const jobs = jobsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Job Management</h1>
          <p className="text-muted-foreground">
            Track installation and maintenance jobs
          </p>
        </div>
        {hasPermission(PERMISSIONS.JOBS_CREATE) && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Job
          </Button>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-gray-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.total || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {statistics?.pending || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {statistics?.inProgress || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statistics?.completed || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Awaiting Inspection
            </CardTitle>
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Active Jobs</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Select
                value={statusFilter}
                onValueChange={(val) =>
                  setStatusFilter(
                    val === "all" ? undefined : (val as JobStatus)
                  )
                }
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.values(JobStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:max-w-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[140px]">Job Number</TableHead>
                    <TableHead className="min-w-[200px]">
                      Customer/Vehicle
                    </TableHead>
                    <TableHead className="min-w-[120px]">Type</TableHead>
                    <TableHead className="min-w-[140px]">Technicians</TableHead>
                    <TableHead className="min-w-[120px]">Scheduled</TableHead>
                    <TableHead className="min-w-[140px]">Status</TableHead>
                    <TableHead className="text-right min-w-[100px]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <p className="text-sm text-muted-foreground">
                            Loading jobs...
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : jobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {searchTerm
                            ? "No jobs found matching your search."
                            : "No jobs created yet."}
                        </div>
                        {!searchTerm &&
                          hasPermission(PERMISSIONS.JOBS_CREATE) && (
                            <Button
                              variant="outline"
                              onClick={() => setIsCreateDialogOpen(true)}
                              className="mt-2"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Create Your First Job
                            </Button>
                          )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    jobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-mono font-medium">
                          {job.jobNumber}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {job.customer.businessName ||
                                job.customer.contactPerson}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {job.vehicle
                                ? `${job.vehicle.vehicleReg} - ${job.vehicle.make} ${job.vehicle.model}`
                                : "No vehicle assigned"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getJobTypeBadge(job.jobType)}</TableCell>
                        <TableCell>
                          {job.technicians && job.technicians.length > 0 ? (
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                {job.technicians.length}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                (
                                {job.technicians.find((t) => t.isPrimary)
                                  ?.firstName || "N/A"}
                                )
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              {/* View Actions */}
                              <DropdownMenuItem onClick={() => handleView(job)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleViewWorkflow(job)}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                View Workflow
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              {/* Assignment Actions */}
                              {job.status === JobStatus.PENDING &&
                                !job.technicians?.length && (
                                  <DropdownMenuItem
                                    onClick={() => handleAssignClick(job)}
                                  >
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Assign Technician
                                  </DropdownMenuItem>
                                )}
                              {job.technicians &&
                                job.technicians.length > 0 && (
                                  <DropdownMenuItem
                                    onClick={() => handleManageClick(job)}
                                  >
                                    <Settings className="mr-2 h-4 w-4" />
                                    Manage Team
                                  </DropdownMenuItem>
                                )}

                              {/* Invoice Action */}
                              {job.status === JobStatus.COMPLETED &&
                                hasPermission(PERMISSIONS.SALES_CREATE) && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleGenerateInvoice(job)}
                                    >
                                      <DollarSign className="mr-2 h-4 w-4" />
                                      Generate Invoice
                                    </DropdownMenuItem>
                                  </>
                                )}

                              {/* Cancel Action */}
                              {job.status !== JobStatus.COMPLETED &&
                                job.status !== JobStatus.VERIFIED &&
                                job.status !== JobStatus.CANCELLED && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleCancelClick(job)}
                                      className="text-destructive"
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Cancel Job
                                    </DropdownMenuItem>
                                  </>
                                )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          {jobsData && jobsData.meta.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * 10 + 1} to{" "}
                {Math.min(page * 10, jobsData.meta.total)} of{" "}
                {jobsData.meta.total} jobs
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
                <div className="flex items-center gap-2 px-3 text-sm">
                  Page {page} of {jobsData.meta.totalPages}
                </div>
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
      <CreateJobDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

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
