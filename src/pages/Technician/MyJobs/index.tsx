import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Briefcase,
  Clock,
  CheckCircle,
  Play,
  Eye,
  Calendar,
  Loader2,
  AlertCircle,
  CalendarClock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { technicianJobsService } from "@/api/services/technician-jobs.service";
import { JobStatus } from "@/api/services/jobs.service";

const MyJobs = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<JobStatus | undefined>();
  const [page, setPage] = useState(1);

  // Fetch my jobs with aggressive refetch settings
  const { data: jobsData, isLoading } = useQuery({
    queryKey: ["technician-jobs", page, statusFilter],
    queryFn: () =>
      technicianJobsService.getMyJobs({
        page,
        limit: 10,
        status: statusFilter,
      }),
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  // Fetch my statistics
  const { data: stats } = useQuery({
    queryKey: ["technician-stats"],
    queryFn: technicianJobsService.getMyStats,
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const jobs = jobsData?.data || [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: any }> = {
      SCHEDULED: { color: "bg-indigo-500", icon: CalendarClock },
      ASSIGNED: { color: "bg-blue-500", icon: Briefcase },
      IN_PROGRESS: { color: "bg-purple-500", icon: Play },
      PRE_INSPECTION_PENDING: { color: "bg-orange-500", icon: Clock },
      PRE_INSPECTION_APPROVED: { color: "bg-blue-500", icon: CheckCircle },
      POST_INSPECTION_PENDING: { color: "bg-orange-500", icon: Clock },
      COMPLETED: { color: "bg-green-500", icon: CheckCircle },
      REQUISITION_PENDING: { color: "bg-yellow-500", icon: Clock },
      REQUISITION_APPROVED: { color: "bg-blue-500", icon: CheckCircle },
    };

    const variant = variants[status] || { color: "bg-gray-500", icon: Clock };
    const Icon = variant.icon;

    return (
      <Badge className={`${variant.color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace(/_/g, " ")}
      </Badge>
    );
  };

  const canStartJob = (job: any): boolean => {
    // Check if status allows starting
    const validStatuses = [
      JobStatus.SCHEDULED,
      JobStatus.ASSIGNED,
      JobStatus.REQUISITION_APPROVED,
      JobStatus.PRE_INSPECTION_APPROVED,
    ];

    if (!validStatuses.includes(job.status as JobStatus)) {
      return false;
    }

    // NEW: Check if scheduled date has arrived
    if (job.scheduledDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const scheduledDate = new Date(job.scheduledDate);
      scheduledDate.setHours(0, 0, 0, 0);

      if (scheduledDate > today) {
        return false; // Job is scheduled for future date
      }
    }

    return true;
  };

  const getScheduledDateInfo = (
    job: any
  ): {
    canStart: boolean;
    message?: string;
    daysUntil?: number;
  } => {
    if (!job.scheduledDate) {
      return { canStart: true };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const scheduledDate = new Date(job.scheduledDate);
    scheduledDate.setHours(0, 0, 0, 0);

    const daysUntil = Math.ceil(
      (scheduledDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntil > 0) {
      return {
        canStart: false,
        message: `Starts in ${daysUntil} day${daysUntil > 1 ? "s" : ""}`,
        daysUntil,
      };
    } else if (daysUntil === 0) {
      return {
        canStart: true,
        message: "Starts today",
        daysUntil: 0,
      };
    } else {
      return {
        canStart: true,
        message: "Ready to start",
        daysUntil: 0,
      };
    }
  };

  const handleViewJob = (jobId: string) => {
    navigate(`/technician/jobs/${jobId}`);
  };

  const handleStartJob = (jobId: string) => {
    navigate(`/technician/jobs/${jobId}/work`);
  };

  const handleViewCompleted = (jobId: string) => {
    navigate(`/technician/jobs/${jobId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Jobs</h1>
          <p className="text-muted-foreground">
            View and manage your assigned jobs
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.assigned || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats?.inProgress || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.completed || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Action
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats?.pending || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Assigned Jobs</CardTitle>
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val === "all" ? undefined : (val as JobStatus));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value={JobStatus.SCHEDULED}>Scheduled</SelectItem>
                <SelectItem value={JobStatus.ASSIGNED}>Assigned</SelectItem>
                <SelectItem value={JobStatus.IN_PROGRESS}>
                  In Progress
                </SelectItem>
                <SelectItem value={JobStatus.COMPLETED}>Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Type</TableHead>
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
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          No jobs found.{" "}
                          {statusFilter
                            ? "Try changing the filter."
                            : "Please contact your supervisor."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs.map((job) => {
                    const scheduleInfo = getScheduledDateInfo(job);
                    const startable = canStartJob(job);
                    const isCompleted =
                      job.status === JobStatus.COMPLETED ||
                      job.status === JobStatus.VERIFIED;

                    return (
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
                              {job.customer.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {job.vehicle ? (
                            <div>
                              <div className="font-medium">
                                {job.vehicle.vehicleReg}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {job.vehicle.make} {job.vehicle.model}
                              </div>
                            </div>
                          ) : (
                            <Badge variant="outline">Not Assigned</Badge>
                          )}
                        </TableCell>
                        <TableCell>{job.jobType.replace("_", " ")}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center text-sm">
                              <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                              {new Date(job.scheduledDate).toLocaleDateString()}
                            </div>
                            {scheduleInfo.message && (
                              <Badge
                                variant={
                                  scheduleInfo.canStart
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-xs w-fit"
                              >
                                {scheduleInfo.message}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {isCompleted ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewCompleted(job.id)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewJob(job.id)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                {startable ? (
                                  <Button
                                    size="sm"
                                    onClick={() => handleStartJob(job.id)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <Play className="h-4 w-4 mr-1" />
                                    {job.status === JobStatus.IN_PROGRESS
                                      ? "Continue"
                                      : "Start"}
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    disabled
                                    variant="outline"
                                    title={
                                      !scheduleInfo.canStart
                                        ? `Starts in ${scheduleInfo.daysUntil} days`
                                        : "Cannot start yet"
                                    }
                                  >
                                    <Clock className="h-4 w-4 mr-1" />
                                    Scheduled
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
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
    </div>
  );
};

export default MyJobs;
