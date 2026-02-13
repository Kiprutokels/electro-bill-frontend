import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Users, MapPin, Phone, Star } from "lucide-react";
import { toast } from "sonner";
import {
  jobsService,
  Job,
  AssignTechnicianRequest,
} from "@/api/services/jobs.service";
import { techniciansService } from "@/api/services/technicians.service";
import { Badge } from "../ui/badge";

interface AssignTechnicianDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
}

const AssignTechnicianDialog = ({
  open,
  onOpenChange,
  job,
}: AssignTechnicianDialogProps) => {
  const queryClient = useQueryClient();
  const [selectedTechIds, setSelectedTechIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  // Fetch available technicians
  const { data: techniciansData, isLoading } = useQuery({
    queryKey: ["technicians-available"],
    queryFn: () =>
      techniciansService.getTechnicians({ limit: 100, isAvailable: true }),
    enabled: open,
  });

  // Assign mutation
  const assignMutation = useMutation({
    mutationFn: (data: AssignTechnicianRequest) =>
      jobsService.assignTechnicians(job!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job-statistics"] });
      toast.success("Technicians assigned successfully");
      onOpenChange(false);
      setSelectedTechIds([]);
      setNotes("");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to assign technicians",
      );
    },
  });

  const handleToggleTech = (techId: string) => {
    setSelectedTechIds((prev) =>
      prev.includes(techId)
        ? prev.filter((id) => id !== techId)
        : [...prev, techId],
    );
  };

  const handleSubmit = () => {
    if (selectedTechIds.length === 0) {
      toast.error("Please select at least one technician");
      return;
    }

    assignMutation.mutate({
      technicianIds: selectedTechIds,
      notes: notes || undefined,
    });
  };

  const technicians = techniciansData?.data || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assign Technicians to Job
          </DialogTitle>
          <DialogDescription>
            Select one or more technicians for job{" "}
            <strong>{job?.jobNumber}</strong>. The first selected technician
            will become the primary technician.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <Star className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Primary Technician:</strong> The first technician you
              select will be designated as the primary technician for this job.
            </AlertDescription>
          </Alert>

          {/* Technician Selection */}
          <div className="space-y-2">
            <Label>Available Technicians</Label>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : technicians.length === 0 ? (
              <div className="text-center py-8 bg-muted/50 rounded-lg">
                <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No available technicians found
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-lg p-2">
                {technicians.map((tech, index) => {
                  const isSelected = selectedTechIds.includes(tech.id);
                  const selectionOrder = selectedTechIds.indexOf(tech.id) + 1;

                  return (
                    <div
                      key={tech.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/10 dark:bg-primary/20"
                          : "border-border bg-card hover:border-primary/50 hover:bg-accent"
                      }`}
                      onClick={() => handleToggleTech(tech.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleTech(tech.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-foreground">
                                {tech.user.firstName} {tech.user.lastName}
                              </p>
                              {isSelected && selectionOrder === 1 && (
                                <Badge variant="default" className="text-xs">
                                  <Star className="h-3 w-3 mr-1" />
                                  Primary
                                </Badge>
                              )}
                              {isSelected && selectionOrder > 1 && (
                                <Badge variant="secondary" className="text-xs">
                                  #{selectionOrder}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {tech.technicianCode}
                            </p>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">
                                  {tech.location}
                                </span>
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">
                                  {tech.user.phone}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Count */}
          {selectedTechIds.length > 0 && (
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                <strong>{selectedTechIds.length}</strong> technician
                {selectedTechIds.length > 1 ? "s" : ""} selected
              </AlertDescription>
            </Alert>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="assignNotes">Assignment Notes (Optional)</Label>
            <Textarea
              id="assignNotes"
              placeholder="Add any notes about this assignment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setSelectedTechIds([]);
              setNotes("");
            }}
            disabled={assignMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={assignMutation.isPending || selectedTechIds.length === 0}
          >
            {assignMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Assign {selectedTechIds.length > 0 && `(${selectedTechIds.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignTechnicianDialog;
