import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  UserPlus,
  UserMinus,
  Star,
  MapPin,
  Phone,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  jobsService,
  Job,
  AddTechnicianRequest,
} from "@/api/services/jobs.service";
import { techniciansService } from "@/api/services/technicians.service";

interface ManageTechniciansDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
}

const ManageTechniciansDialog = ({
  open,
  onOpenChange,
  job,
}: ManageTechniciansDialogProps) => {
  const queryClient = useQueryClient();
  const [selectedTechId, setSelectedTechId] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [notes, setNotes] = useState("");
  const [techToRemove, setTechToRemove] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [removeReason, setRemoveReason] = useState("");
  const [techToSetPrimary, setTechToSetPrimary] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Fetch available technicians
  const { data: techniciansData } = useQuery({
    queryKey: ["technicians-available"],
    queryFn: () =>
      techniciansService.getTechnicians({ limit: 100, isAvailable: true }),
    enabled: open,
  });

  // Add technician mutation
  const addMutation = useMutation({
    mutationFn: (data: AddTechnicianRequest) =>
      jobsService.addTechnician(job!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Technician added successfully");
      setSelectedTechId("");
      setIsPrimary(false);
      setNotes("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to add technician");
    },
  });

  // Remove technician mutation
  const removeMutation = useMutation({
    mutationFn: ({ techId, reason }: { techId: string; reason?: string }) =>
      jobsService.removeTechnician(job!.id, techId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Technician removed successfully");
      setTechToRemove(null);
      setRemoveReason("");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to remove technician",
      );
    },
  });

  // Set primary mutation
  const setPrimaryMutation = useMutation({
    mutationFn: (techId: string) =>
      jobsService.setPrimaryTechnician(job!.id, techId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Primary technician updated");
      setTechToSetPrimary(null);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to set primary technician",
      );
    },
  });

  const handleAddTechnician = () => {
    if (!selectedTechId) {
      toast.error("Please select a technician");
      return;
    }

    addMutation.mutate({
      technicianId: selectedTechId,
      isPrimary,
      notes: notes || undefined,
    });
  };

  const handleRemoveTechnician = () => {
    if (!techToRemove) return;

    removeMutation.mutate({
      techId: techToRemove.id,
      reason: removeReason || undefined,
    });
  };

  const handleSetPrimary = () => {
    if (!techToSetPrimary) return;
    setPrimaryMutation.mutate(techToSetPrimary.id);
  };

  const technicians = techniciansData?.data || [];
  const assignedTechIds = job?.technicians?.map((t) => t.id) || [];
  const availableTechnicians = technicians.filter(
    (t) => !assignedTechIds.includes(t.id),
  );
  const currentTechnicians = job?.technicians || [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Technicians - {job?.jobNumber}</DialogTitle>
            <DialogDescription>
              Add or remove technicians, and set the primary technician for this
              job.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Current Technicians */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">
                Current Team ({currentTechnicians.length})
              </Label>
              {currentTechnicians.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No technicians assigned yet
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {currentTechnicians.map((tech) => (
                    <div
                      key={tech.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        tech.isPrimary
                          ? "border-primary bg-primary/10 dark:bg-primary/20"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-semibold text-foreground">
                              {tech.firstName} {tech.lastName}
                            </p>
                            {tech.isPrimary && (
                              <Badge variant="default" className="text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Primary
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-muted-foreground">
                            <span>{tech.technicianCode}</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{tech.location}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{tech.phone}</span>
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                          {!tech.isPrimary && currentTechnicians.length > 1 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setTechToSetPrimary({
                                  id: tech.id,
                                  name: `${tech.firstName} ${tech.lastName}`,
                                })
                              }
                              className="flex-1 sm:flex-none"
                            >
                              <Star className="h-3 w-3 mr-1" />
                              Set Primary
                            </Button>
                          )}
                          {currentTechnicians.length > 1 && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                setTechToRemove({
                                  id: tech.id,
                                  name: `${tech.firstName} ${tech.lastName}`,
                                })
                              }
                              className="flex-1 sm:flex-none"
                            >
                              <UserMinus className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Add New Technician */}
            <div>
              <Label className="text-sm font-semibold mb-3 flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Add Technician
              </Label>

              {availableTechnicians.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No additional available technicians found
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="techSelect">Select Technician</Label>
                    <Select
                      value={selectedTechId}
                      onValueChange={setSelectedTechId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a technician" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTechnicians.map((tech) => (
                          <SelectItem key={tech.id} value={tech.id}>
                            {tech.user.firstName} {tech.user.lastName} (
                            {tech.technicianCode}) - {tech.location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isPrimary"
                      checked={isPrimary}
                      onChange={(e) => setIsPrimary(e.target.checked)}
                      className="rounded border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                    <Label
                      htmlFor="isPrimary"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Set as primary technician (replaces current primary)
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addNotes">Notes (Optional)</Label>
                    <Textarea
                      id="addNotes"
                      placeholder="Add notes about this assignment..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <Button
                    onClick={handleAddTechnician}
                    disabled={!selectedTechId || addMutation.isPending}
                    className="w-full"
                  >
                    {addMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Technician
                  </Button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Technician Confirmation */}
      <AlertDialog
        open={!!techToRemove}
        onOpenChange={() => setTechToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Technician</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>{techToRemove?.name}</strong> from this job?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="removeReason">Reason (Optional)</Label>
            <Textarea
              id="removeReason"
              placeholder="Enter reason for removal..."
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value)}
              rows={3}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRemoveReason("")}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveTechnician}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={removeMutation.isPending}
            >
              {removeMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Remove Technician
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Set Primary Confirmation */}
      <AlertDialog
        open={!!techToSetPrimary}
        onOpenChange={() => setTechToSetPrimary(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set Primary Technician</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to set{" "}
              <strong>{techToSetPrimary?.name}</strong> as the primary
              technician? This will replace the current primary technician.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSetPrimary}
              disabled={setPrimaryMutation.isPending}
            >
              {setPrimaryMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ManageTechniciansDialog;
