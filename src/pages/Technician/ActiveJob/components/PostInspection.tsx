import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronDown,
  ChevronRight,
  Check,
  Camera,
  Loader2,
  Send,
  CheckCircle2,
  AlertTriangle,
  Edit,
} from "lucide-react";
import {
  inspectionsService,
  CheckStatus,
  InspectionStage,
} from "@/api/services/inspections.service";

interface PostInspectionProps {
  job: any;
  onComplete?: () => void;
}

const PostInspection = ({ job, onComplete }: PostInspectionProps) => {
  const queryClient = useQueryClient();
  const [checklistData, setChecklistData] = useState<Record<string, any>>({});
  const [photoFiles, setPhotoFiles] = useState<Record<string, File>>({});
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { data: checklistItems, isLoading: loadingItems } = useQuery({
    queryKey: ["checklist-items-post"],
    queryFn: () =>
      inspectionsService.getChecklistItems({
        isPostInstallation: true,
        isActive: true,
        limit: 100,
      }),
  });

  const { data: existingInspections } = useQuery({
    queryKey: ["job-post-inspections", job.id],
    queryFn: () =>
      inspectionsService.getJobInspections(
        job.id,
        InspectionStage.POST_INSTALLATION,
      ),
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const uploadedPhotoUrls: Record<string, string> = {};

      for (const [itemId, file] of Object.entries(photoFiles)) {
        if (file) {
          uploadedPhotoUrls[itemId] = URL.createObjectURL(file);
        }
      }

      const items = checklistItems?.data || [];
      const inspections = items.map((item: any) => {
        const checkData = checklistData[item.id];
        return {
          checklistItemId: item.id,
          status: checkData?.status || CheckStatus.CHECKED,
          notes: checkData?.notes || "",
          photoUrls: uploadedPhotoUrls[item.id]
            ? [uploadedPhotoUrls[item.id]]
            : [],
        };
      });

      return inspectionsService.submitInspection({
        jobId: job.id,
        vehicleId: job.vehicleId!,
        inspectionStage: InspectionStage.POST_INSTALLATION,
        inspections,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["job-post-inspections"],
      });
      await queryClient.invalidateQueries({ queryKey: ["active-job"] });
      await queryClient.invalidateQueries({ queryKey: ["job-by-id", job.id] });

      const wasFirstSubmission = !hasExistingInspection;

      if (wasFirstSubmission) {
        toast.success("Post-installation inspection submitted");
      } else {
        toast.success("Post-installation inspection updated");
      }

      setChecklistData({});
      setPhotoFiles({});
      setSelectedItems(new Set());
      setSelectAll(false);
      setIsEditing(false);

      // Only call onComplete for first-time submissions (to advance to next tab)
      if (onComplete && wasFirstSubmission) {
        onComplete();
      }
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to submit inspection",
      );
    },
  });

  const items = checklistItems?.data || [];
  const hasExistingInspection =
    existingInspections && existingInspections.length > 0;

  const selectableItems = items.filter((item: any) => {
    const existingCheck = existingInspections?.find(
      (ei: any) => ei.checklistItemId === item.id,
    );
    return !existingCheck || isEditing;
  });

  const handleToggleCheck = (itemId: string) => {
    const currentStatus = checklistData[itemId]?.status;
    let nextStatus: CheckStatus;

    if (!currentStatus || currentStatus === CheckStatus.NOT_CHECKED) {
      nextStatus = CheckStatus.CHECKED;
    } else if (currentStatus === CheckStatus.CHECKED) {
      nextStatus = CheckStatus.ISSUE_FOUND;
    } else {
      nextStatus = CheckStatus.NOT_CHECKED;
    }

    setChecklistData({
      ...checklistData,
      [itemId]: {
        ...checklistData[itemId],
        status: nextStatus,
      },
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems(new Set());
      setSelectAll(false);
    } else {
      const allSelectableIds = new Set(
        selectableItems.map((item: any) => item.id),
      );
      setSelectedItems(allSelectableIds);
      setSelectAll(true);
    }
  };

  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
    setSelectAll(
      newSelected.size === selectableItems.length && selectableItems.length > 0,
    );
  };

  const handleMarkSelectedAsChecked = () => {
    const newData = { ...checklistData };
    selectedItems.forEach((itemId) => {
      newData[itemId] = {
        ...newData[itemId],
        status: CheckStatus.CHECKED,
      };
    });
    setChecklistData(newData);
    setSelectedItems(new Set());
    setSelectAll(false);
    toast.success(`${selectedItems.size} components marked as checked`);
  };

  const handleSubmit = () => {
    const incomplete = items.filter((item: any) => {
      const existing = existingInspections?.find(
        (ei: any) => ei.checklistItemId === item.id,
      );
      return !existing && !checklistData[item.id]?.status;
    });

    if (incomplete.length > 0 && !isEditing) {
      toast.error(`Please check ${incomplete.length} remaining components`);
      return;
    }

    submitMutation.mutate();
  };

  const handleEdit = () => {
    setIsEditing(true);
    toast.info("Edit mode enabled. You can now modify your inspection.");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setChecklistData({});
    setPhotoFiles({});
    setSelectedItems(new Set());
    setSelectAll(false);
    toast.info("Edit mode cancelled");
  };

  const getStatusIcon = (status?: string) => {
    if (status === CheckStatus.CHECKED) {
      return <Check className="h-5 w-5 text-green-600 dark:text-green-500" />;
    }
    if (status === CheckStatus.ISSUE_FOUND) {
      return (
        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500" />
      );
    }
    return (
      <div className="h-5 w-5 border-2 border-gray-300 dark:border-gray-600 rounded" />
    );
  };

  if (loadingItems) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const checkedCount = items.filter((item: any) => {
    const existing = existingInspections?.find(
      (ei: any) => ei.checklistItemId === item.id,
    );
    const currentStatus = existing?.status || checklistData[item.id]?.status;
    return (
      currentStatus === CheckStatus.CHECKED ||
      currentStatus === CheckStatus.ISSUE_FOUND
    );
  }).length;

  const issueCount = items.filter((item: any) => {
    const existing = existingInspections?.find(
      (ei: any) => ei.checklistItemId === item.id,
    );
    return (
      existing?.status === CheckStatus.ISSUE_FOUND ||
      checklistData[item.id]?.status === CheckStatus.ISSUE_FOUND
    );
  }).length;

  return (
    <div className="space-y-4">
      {hasExistingInspection && !isEditing && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
                <p className="text-sm text-green-800 dark:text-green-300">
                  Post-installation inspection completed. All components
                  verified working after installation.
                  {issueCount > 0 &&
                    ` (${issueCount} issue${issueCount > 1 ? "s" : ""} reported)`}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Inspection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {(!hasExistingInspection || isEditing) && selectableItems.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-sm text-muted-foreground">
                  Progress: {checkedCount} / {items.length} components reviewed
                </span>
                {selectedItems.size > 0 && (
                  <Badge variant="secondary">
                    {selectedItems.size} selected
                  </Badge>
                )}
                {issueCount > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {issueCount} issue{issueCount > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isEditing && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleMarkSelectedAsChecked}
                  disabled={selectedItems.size === 0}
                  className="bg-green-50 dark:bg-green-950/50 hover:bg-green-100 dark:hover:bg-green-950/70 border-green-200 dark:border-green-800"
                >
                  <Check className="h-4 w-4 mr-2 text-green-600 dark:text-green-500" />
                  Mark{" "}
                  {selectedItems.size > 0 ? selectedItems.size : "Selected"} as
                  Checked
                </Button>

                <Button
                  onClick={handleSubmit}
                  disabled={
                    submitMutation.isPending ||
                    (checkedCount < items.length && !isEditing)
                  }
                  size="sm"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      {isEditing ? "Update" : "Submit"} ({checkedCount}/
                      {items.length})
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Post-Installation Component Check</CardTitle>
          <p className="text-sm text-muted-foreground">
            Verify all components are working correctly after installation.
            Click status to toggle: Not Checked → Checked → Issue Found
          </p>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden dark:border-gray-800">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 dark:bg-muted/20">
                  {(!hasExistingInspection || isEditing) &&
                    selectableItems.length > 0 && (
                      <TableHead className="w-10">
                        <Checkbox
                          checked={selectAll}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all components"
                        />
                      </TableHead>
                    )}
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Component</TableHead>
                  <TableHead className="w-24 text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No components to check
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item: any, index: number) => {
                    const existingCheck = existingInspections?.find(
                      (ei: any) => ei.checklistItemId === item.id,
                    );
                    const currentStatus =
                      existingCheck?.status || checklistData[item.id]?.status;
                    const isExpanded = expandedItem === item.id;
                    const isSelected = selectedItems.has(item.id);
                    const isSelectable = !existingCheck || isEditing;
                    const hasNotes =
                      existingCheck?.notes || checklistData[item.id]?.notes;

                    return (
                      <React.Fragment key={item.id}>
                        <TableRow
                          className={`
                            ${isSelected ? "bg-blue-50 dark:bg-blue-950/30" : ""} 
                            ${isExpanded ? "border-b-0" : ""} 
                            ${currentStatus === CheckStatus.ISSUE_FOUND ? "bg-red-50/50 dark:bg-red-950/20" : ""}
                          `}
                        >
                          {(!hasExistingInspection || isEditing) &&
                            selectableItems.length > 0 && (
                              <TableCell>
                                {isSelectable ? (
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() =>
                                      handleSelectItem(item.id)
                                    }
                                    aria-label={`Select ${item.name}`}
                                  />
                                ) : (
                                  <div className="w-4 h-4" />
                                )}
                              </TableCell>
                            )}

                          <TableCell className="font-medium text-muted-foreground">
                            {index + 1}
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedItem(isExpanded ? null : item.id)
                                }
                                className="p-1 hover:bg-muted rounded transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                              </button>
                              <span className="font-medium">{item.name}</span>
                              {currentStatus === CheckStatus.ISSUE_FOUND && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  Issue Found
                                </Badge>
                              )}
                              {hasNotes && (
                                <Badge variant="outline" className="text-xs">
                                  Has notes
                                </Badge>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="text-center">
                            {!existingCheck || isEditing ? (
                              <button
                                type="button"
                                onClick={() => handleToggleCheck(item.id)}
                                className="inline-flex items-center justify-center p-1 hover:bg-muted rounded transition-colors"
                                aria-label={`Toggle status for ${item.name}`}
                                title="Click to cycle: Not Checked → Checked → Issue Found"
                              >
                                {getStatusIcon(currentStatus)}
                              </button>
                            ) : (
                              <div className="inline-flex items-center justify-center">
                                {getStatusIcon(currentStatus)}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>

                        {isExpanded && (
                          <TableRow className="bg-muted/20 dark:bg-muted/10">
                            <TableCell colSpan={4} className="p-0">
                              <div className="p-4 space-y-4">
                                {item.description && (
                                  <div>
                                    <Label className="text-xs text-muted-foreground">
                                      Description
                                    </Label>
                                    <p className="text-sm mt-1">
                                      {item.description}
                                    </p>
                                  </div>
                                )}

                                {(!existingCheck || isEditing) && (
                                  <>
                                    <div className="flex items-center gap-2 p-3 bg-muted/50 dark:bg-muted/30 rounded-lg">
                                      <div className="flex items-center gap-3">
                                        <Button
                                          type="button"
                                          variant={
                                            currentStatus ===
                                            CheckStatus.CHECKED
                                              ? "default"
                                              : "outline"
                                          }
                                          size="sm"
                                          onClick={() =>
                                            setChecklistData({
                                              ...checklistData,
                                              [item.id]: {
                                                ...checklistData[item.id],
                                                status: CheckStatus.CHECKED,
                                              },
                                            })
                                          }
                                          className={
                                            currentStatus ===
                                            CheckStatus.CHECKED
                                              ? "bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                                              : ""
                                          }
                                        >
                                          <Check className="h-4 w-4 mr-1" />
                                          Checked
                                        </Button>
                                        <Button
                                          type="button"
                                          variant={
                                            currentStatus ===
                                            CheckStatus.ISSUE_FOUND
                                              ? "default"
                                              : "outline"
                                          }
                                          size="sm"
                                          onClick={() =>
                                            setChecklistData({
                                              ...checklistData,
                                              [item.id]: {
                                                ...checklistData[item.id],
                                                status: CheckStatus.ISSUE_FOUND,
                                              },
                                            })
                                          }
                                          className={
                                            currentStatus ===
                                            CheckStatus.ISSUE_FOUND
                                              ? "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                                              : ""
                                          }
                                        >
                                          <AlertTriangle className="h-4 w-4 mr-1" />
                                          Issue Found
                                        </Button>
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor={`notes-${item.id}`}>
                                        Notes{" "}
                                        {currentStatus ===
                                          CheckStatus.ISSUE_FOUND && (
                                          <span className="text-red-600 dark:text-red-500">
                                            *
                                          </span>
                                        )}
                                      </Label>
                                      <Textarea
                                        id={`notes-${item.id}`}
                                        placeholder={
                                          currentStatus ===
                                          CheckStatus.ISSUE_FOUND
                                            ? "Describe the issue found..."
                                            : "Add notes (optional)..."
                                        }
                                        value={
                                          checklistData[item.id]?.notes || ""
                                        }
                                        onChange={(e) =>
                                          setChecklistData({
                                            ...checklistData,
                                            [item.id]: {
                                              ...checklistData[item.id],
                                              notes: e.target.value,
                                            },
                                          })
                                        }
                                        rows={3}
                                        className={`text-sm ${currentStatus === CheckStatus.ISSUE_FOUND ? "border-red-300 dark:border-red-800" : ""}`}
                                      />
                                      {currentStatus ===
                                        CheckStatus.ISSUE_FOUND &&
                                        !checklistData[item.id]?.notes && (
                                          <p className="text-xs text-red-600 dark:text-red-500">
                                            Please describe the issue
                                          </p>
                                        )}
                                    </div>

                                    {item.requiresPhoto && (
                                      <div className="space-y-2">
                                        <Label htmlFor={`photo-${item.id}`}>
                                          Photo{" "}
                                          {currentStatus ===
                                            CheckStatus.ISSUE_FOUND && (
                                            <span className="text-red-600 dark:text-red-500">
                                              *
                                            </span>
                                          )}
                                        </Label>
                                        <Input
                                          id={`photo-${item.id}`}
                                          type="file"
                                          accept="image/*"
                                          capture="environment"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              setPhotoFiles({
                                                ...photoFiles,
                                                [item.id]: file,
                                              });
                                            }
                                          }}
                                          className="text-sm"
                                        />
                                        {photoFiles[item.id] && (
                                          <Badge className="bg-green-500 dark:bg-green-700">
                                            <Camera className="h-3 w-3 mr-1" />
                                            Photo Captured
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                  </>
                                )}

                                {existingCheck?.notes && !isEditing && (
                                  <div className="p-3 bg-muted dark:bg-muted/50 rounded-lg">
                                    <Label className="text-xs text-muted-foreground">
                                      Technician Notes
                                    </Label>
                                    <p className="text-sm mt-1">
                                      {existingCheck.notes}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostInspection;
