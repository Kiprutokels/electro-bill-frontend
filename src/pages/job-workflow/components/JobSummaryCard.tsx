import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const JobSummaryCard = ({ job }: { job: any }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg">Job Summary</CardTitle>
      </CardHeader>

      <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
        <div>
          <Label className="text-muted-foreground">Customer</Label>
          <div className="font-medium">
            {job.customer?.businessName || job.customer?.contactPerson || "—"}
          </div>
        </div>

        <div>
          <Label className="text-muted-foreground">Vehicle</Label>
          <div className="font-medium">
            {job.vehicle?.vehicleReg
              ? `${job.vehicle.vehicleReg} (${job.vehicle.make || ""} ${job.vehicle.model || ""})`
              : "Not assigned"}
          </div>
        </div>

        <div>
          <Label className="text-muted-foreground">Scheduled</Label>
          <div className="font-medium">
            {job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString() : "—"}
          </div>
        </div>

        <div>
          <Label className="text-muted-foreground">Type</Label>
          <div className="font-medium">{job.jobType?.replace(/_/g, " ") || "—"}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobSummaryCard;