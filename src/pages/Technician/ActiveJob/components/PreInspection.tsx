import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Camera,
  Loader2,
  Send,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { inspectionsService, CheckStatus, InspectionStage } from '@/api/services/inspections.service';

const PreInspection = ({ job }: { job: any }) => {
  const queryClient = useQueryClient();
  const [checklistData, setChecklistData] = useState<Record<string, any>>({});
  const [photoFiles, setPhotoFiles] = useState<Record<string, File>>({});
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Fetch checklist items
  const { data: checklistItems, isLoading: loadingItems } = useQuery({
    queryKey: ['checklist-items-pre'],
    queryFn: () =>
      inspectionsService.getChecklistItems({
        isPreInstallation: true,
        isActive: true,
        limit: 100,
      }),
  });

  // Fetch existing inspections
  const { data: existingInspections } = useQuery({
    queryKey: ['job-pre-inspections', job.id],
    queryFn: () =>
      inspectionsService.getJobInspections(job.id, InspectionStage.PRE_INSTALLATION),
    enabled: !!job.vehicleId,
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
          notes: checkData?.notes || '',
          photoUrls: uploadedPhotoUrls[item.id] ? [uploadedPhotoUrls[item.id]] : [],
        };
      });

      return inspectionsService.submitInspection({
        jobId: job.id,
        vehicleId: job.vehicleId!,
        inspectionStage: InspectionStage.PRE_INSTALLATION,
        inspections,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-pre-inspections'] });
      queryClient.invalidateQueries({ queryKey: ['active-job'] });
      toast.success('Pre-installation inspection submitted');
      setChecklistData({});
      setPhotoFiles({});
      setSelectedItems(new Set());
      setSelectAll(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit inspection');
    },
  });

  const items = checklistItems?.data || [];
  const hasExistingInspection = existingInspections && existingInspections.length > 0;

  // Get only items that can be selected (not already checked)
  const selectableItems = items.filter((item: any) => {
    const existingCheck = existingInspections?.find(
      (ei: any) => ei.checklistItemId === item.id
    );
    return !existingCheck;
  });

  // Three-state toggle: Not Checked → Checked → Issue Found → Not Checked
  const handleToggleCheck = (itemId: string) => {
    const currentStatus = checklistData[itemId]?.status;
    let nextStatus;
    
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

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems(new Set());
      setSelectAll(false);
    } else {
      const allSelectableIds = new Set(selectableItems.map((item: any) => item.id));
      setSelectedItems(allSelectableIds);
      setSelectAll(true);
    }
  };

  // Handle individual select
  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
    
    setSelectAll(newSelected.size === selectableItems.length && selectableItems.length > 0);
  };

  // Mark selected as checked
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
    if (!job.vehicleId) {
      toast.error('Please add vehicle information first');
      return;
    }

    const incomplete = items.filter((item: any) => {
      const existing = existingInspections?.find(
        (ei: any) => ei.checklistItemId === item.id
      );
      return !existing && !checklistData[item.id]?.status;
    });

    if (incomplete.length > 0) {
      toast.error(`Please check ${incomplete.length} remaining components`);
      return;
    }

    submitMutation.mutate();
  };

  const getStatusIcon = (status?: string) => {
    if (status === CheckStatus.CHECKED) {
      return <Check className="h-5 w-5 text-green-600" />;
    }
    if (status === CheckStatus.ISSUE_FOUND) {
      return <AlertTriangle className="h-5 w-5 text-red-600" />;
    }
    return <div className="h-5 w-5 border-2 border-gray-300 rounded" />;
  };

  if (loadingItems) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const checkedCount = items.filter((item: any) => {
    const existing = existingInspections?.find((ei: any) => ei.checklistItemId === item.id);
    const currentStatus = existing?.status || checklistData[item.id]?.status;
    return currentStatus === CheckStatus.CHECKED || currentStatus === CheckStatus.ISSUE_FOUND;
  }).length;

  const issueCount = items.filter((item: any) => {
    const existing = existingInspections?.find((ei: any) => ei.checklistItemId === item.id);
    return existing?.status === CheckStatus.ISSUE_FOUND || checklistData[item.id]?.status === CheckStatus.ISSUE_FOUND;
  }).length;

  return (
    <div className="space-y-4">
      {hasExistingInspection && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-800">
                Pre-installation inspection completed. Components verified before starting work.
                {issueCount > 0 && ` (${issueCount} issue${issueCount > 1 ? 's' : ''} reported)`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!job.vehicleId && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <p className="text-sm text-orange-800">
                Add vehicle information in the Vehicle tab first
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      {!hasExistingInspection && selectableItems.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-sm text-muted-foreground">
                  Progress: {checkedCount} / {items.length} components reviewed
                </span>
                {selectedItems.size > 0 && (
                  <Badge variant="secondary">{selectedItems.size} selected</Badge>
                )}
                {issueCount > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {issueCount} issue{issueCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleMarkSelectedAsChecked}
                  disabled={selectedItems.size === 0}
                  className="bg-green-50 hover:bg-green-100"
                >
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  Mark {selectedItems.size > 0 ? selectedItems.size : 'Selected'} as Checked
                </Button>
                
                <Button
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending || !job.vehicleId || checkedCount < items.length}
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
                      Submit ({checkedCount}/{items.length})
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Checklist Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pre-Installation Component Check</CardTitle>
          <p className="text-sm text-muted-foreground">
            Verify all components are working before starting installation. Click status to toggle: Not Checked → Checked → Issue Found
          </p>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  {!hasExistingInspection && selectableItems.length > 0 && (
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
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No components to check
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item: any, index: number) => {
                    const existingCheck = existingInspections?.find(
                      (ei: any) => ei.checklistItemId === item.id
                    );
                    const currentStatus = existingCheck?.status || checklistData[item.id]?.status;
                    const isExpanded = expandedItem === item.id;
                    const isSelected = selectedItems.has(item.id);
                    const isSelectable = !existingCheck && !hasExistingInspection;
                    const hasNotes = existingCheck?.notes || checklistData[item.id]?.notes;

                    return (
                      <React.Fragment key={item.id}>
                        <TableRow 
                          className={`${isSelected ? 'bg-blue-50' : ''} ${isExpanded ? 'border-b-0' : ''} ${currentStatus === CheckStatus.ISSUE_FOUND ? 'bg-red-50/50' : ''}`}
                        >
                          {!hasExistingInspection && selectableItems.length > 0 && (
                            <TableCell>
                              {isSelectable ? (
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => handleSelectItem(item.id)}
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
                                onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                                className="p-1 hover:bg-muted rounded"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                              </button>
                              <span className="font-medium">{item.name}</span>
                              {currentStatus === CheckStatus.ISSUE_FOUND && (
                                <Badge variant="destructive" className="text-xs">
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
                            {!existingCheck && !hasExistingInspection ? (
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

                        {/* Expanded Details Row */}
                        {isExpanded && (
                          <TableRow className="bg-muted/20">
                            <TableCell colSpan={4} className="p-0">
                              <div className="p-4 space-y-4">
                                {item.description && (
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Description</Label>
                                    <p className="text-sm mt-1">{item.description}</p>
                                  </div>
                                )}

                                {!existingCheck && !hasExistingInspection && (
                                  <>
                                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                                      <div className="flex items-center gap-3">
                                        <Button
                                          type="button"
                                          variant={currentStatus === CheckStatus.CHECKED ? 'default' : 'outline'}
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
                                          className={currentStatus === CheckStatus.CHECKED ? 'bg-green-600 hover:bg-green-700' : ''}
                                        >
                                          <Check className="h-4 w-4 mr-1" />
                                          Checked
                                        </Button>
                                        <Button
                                          type="button"
                                          variant={currentStatus === CheckStatus.ISSUE_FOUND ? 'default' : 'outline'}
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
                                          className={currentStatus === CheckStatus.ISSUE_FOUND ? 'bg-red-600 hover:bg-red-700' : ''}
                                        >
                                          <AlertTriangle className="h-4 w-4 mr-1" />
                                          Issue Found
                                        </Button>
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor={`notes-${item.id}`}>
                                        Notes {currentStatus === CheckStatus.ISSUE_FOUND && <span className="text-red-600">*</span>}
                                      </Label>
                                      <Textarea
                                        id={`notes-${item.id}`}
                                        placeholder={currentStatus === CheckStatus.ISSUE_FOUND ? "Describe the issue found..." : "Add notes (optional)..."}
                                        value={checklistData[item.id]?.notes || ''}
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
                                        className={`text-sm ${currentStatus === CheckStatus.ISSUE_FOUND ? 'border-red-300' : ''}`}
                                      />
                                      {currentStatus === CheckStatus.ISSUE_FOUND && !checklistData[item.id]?.notes && (
                                        <p className="text-xs text-red-600">Please describe the issue</p>
                                      )}
                                    </div>

                                    {item.requiresPhoto && (
                                      <div className="space-y-2">
                                        <Label htmlFor={`photo-${item.id}`}>
                                          Photo {currentStatus === CheckStatus.ISSUE_FOUND && <span className="text-red-600">*</span>}
                                        </Label>
                                        <Input
                                          id={`photo-${item.id}`}
                                          type="file"
                                          accept="image/*"
                                          capture="environment"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              setPhotoFiles({ ...photoFiles, [item.id]: file });
                                            }
                                          }}
                                          className="text-sm"
                                        />
                                        {photoFiles[item.id] && (
                                          <Badge className="bg-green-500">
                                            <Camera className="h-3 w-3 mr-1" />
                                            Photo Captured
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                  </>
                                )}

                                {existingCheck?.notes && (
                                  <div className="p-3 bg-muted rounded-lg">
                                    <Label className="text-xs text-muted-foreground">Technician Notes</Label>
                                    <p className="text-sm mt-1">{existingCheck.notes}</p>
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

export default PreInspection;
