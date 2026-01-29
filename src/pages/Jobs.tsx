import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  CalendarClock,
  MapPin,
} from "lucide-react";
import { jobsService, JobStatus, Job } from "@/api/services/jobs.service";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS } from "@/utils/constants";
import TableToolbar, { PageSizeOption } from "@/components/shared/TableToolbar";
import PaginationFooter from "@/components/shared/PaginationFooter";

// Dialogs
import CreateJobDialog from "@/components/jobs/CreateJobDialog";
import ViewJobDialog from "@/components/jobs/ViewJobDialog";
import AssignTechnicianDialog from "@/components/jobs/AssignTechnicianDialog";
import ManageTechniciansDialog from "@/components/jobs/ManageTechniciansDialog";
import CancelJobDialog from "@/components/jobs/CancelJobDialog";
import RescheduleJobDialog from "@/components/jobs/RescheduleJobDialog";

const PAGE_SIZE_OPTIONS: PageSizeOption[] = [
  { label: "10", value: 10 },
  { label: "25", value: 25 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
];

const Jobs = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobStatus | undefined>();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const {
    data: jobsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["jobs", page, pageSize, searchTerm, statusFilter],
    queryFn: () =>
      jobsService.getJobs({
        page,
        limit: pageSize,
        search: searchTerm,
        status: statusFilter,
      }),
  });

  const { data: statistics } = useQuery({
    queryKey: ["job-statistics"],
    queryFn: jobsService.getStatistics,
  });

  const jobs = jobsData?.data || [];
  const totalPages = jobsData?.meta?.totalPages || 1;
  const totalItems = jobsData?.meta?.total || 0;

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

  const handleRescheduleClick = (job: Job) => {
    setSelectedJob(job);
    setIsRescheduleDialogOpen(true);
  };

  const handleGenerateInvoice = (job: Job) => {
    navigate(`/jobs/${job.id}/workflow`);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleStatusFilterChange = (value: string) => {
    if (value === "all") {
      setStatusFilter(undefined);
    } else {
      setStatusFilter(value as JobStatus);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: any }> = {
      PENDING: { color: "bg-gray-500", icon: Clock },
      SCHEDULED: { color: "bg-indigo-500", icon: CalendarClock },
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

  if (isLoading && jobs.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Job Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track installation and maintenance jobs
          </p>
        </div>
        {hasPermission(PERMISSIONS.JOBS_CREATE) && (
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Job
          </Button>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Jobs
            </CardTitle>
            <Briefcase className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {statistics?.total || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Scheduled
            </CardTitle>
            <Calendar className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {statistics?.scheduled || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {statistics?.pending || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
            <Briefcase className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {statistics?.inProgress || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {statistics?.completed || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Awaiting Inspection
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {statistics?.awaitingInspection || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <TableToolbar
            title="Job Management"
            searchPlaceholder="Search jobs, customer, vehicle, location..."
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageSizeChange={handlePageSizeChange}
            refreshing={isLoading}
            onRefresh={handleRefresh}
            rightSlot={
              <Select value={statusFilter || "all"} onValueChange={handleStatusFilterChange}>
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
            }
          />
        </CardHeader>

        <CardContent className="p-0 sm:p-6">
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[140px]">Job Number</TableHead>
                    <TableHead className="min-w-[220px]">
                      Customer/Vehicle
                    </TableHead>
                    <TableHead className="min-w-[150px]">Location</TableHead>
                    <TableHead className="min-w-[120px]">Type</TableHead>
                    <TableHead className="min-w-[140px]">Technicians</TableHead>
                    <TableHead className="min-w-[120px]">Scheduled</TableHead>
                    <TableHead className="min-w-[160px]">Status</TableHead>
                    <TableHead className="text-right min-w-[60px]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {jobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
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

                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span
                              className="truncate max-w-[120px]"
                              title={job.location}
                            >
                              {job.location || "-"}
                            </span>
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
                            {job.scheduledDate
                              ? new Date(job.scheduledDate).toLocaleDateString()
                              : "Not set"}
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

                            <DropdownMenuContent align="end" className="w-52">
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
                              {(job.status === JobStatus.PENDING ||
                                job.status === JobStatus.SCHEDULED) &&
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

                              {/* Reschedule */}
                              {hasPermission(PERMISSIONS.JOBS_UPDATE) &&
                                ![
                                  JobStatus.COMPLETED,
                                  JobStatus.VERIFIED,
                                  JobStatus.CANCELLED,
                                ].includes(job.status) && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleRescheduleClick(job)}
                                    >
                                      <CalendarClock className="mr-2 h-4 w-4" />
                                      Reschedule
                                    </DropdownMenuItem>
                                  </>
                                )}

                              {/* Invoice */}
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

                              {/* Cancel */}
                              {hasPermission(PERMISSIONS.JOBS_UPDATE) &&
                                ![
                                  JobStatus.COMPLETED,
                                  JobStatus.VERIFIED,
                                  JobStatus.CANCELLED,
                                ].includes(job.status) && (
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

          <PaginationFooter
            totalItems={totalItems}
            currentPage={page}
            totalPages={totalPages}
            pageSize={pageSize}
            loading={isLoading}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
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
          if (selectedJob?.technicians?.length) setIsManageDialogOpen(true);
          else setIsAssignDialogOpen(true);
        }}
        onCancel={() => {
          setIsViewDialogOpen(false);
          if (selectedJob) handleCancelClick(selectedJob);
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

      <RescheduleJobDialog
        open={isRescheduleDialogOpen}
        onOpenChange={setIsRescheduleDialogOpen}
        job={selectedJob}
      />
    </div>
  );
};

export default Jobs;