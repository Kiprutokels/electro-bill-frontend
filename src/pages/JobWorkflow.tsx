import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

import {
  ArrowLeft,
  Clock,
  Package,
  ClipboardCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  DollarSign,
  Loader2,
  Eye,
  Send,
  Smartphone,
} from "lucide-react";

import { toast } from "sonner";
import { jobsService } from "@/api/services/jobs.service";
import { invoicesService } from "@/api/services/invoices.service";

import {
  requisitionsService,
  RequisitionStatus,
  IssueItemRequest,
} from "@/api/services/requisitions.service";

import {
  advanceRequestsService,
  AdvanceRequestStatus,
  DisbursementMethod,
} from "@/api/services/advance-requests.service";

import {
  ProductBatch,
  productBatchesService,
} from "@/api/services/product-batches.service";

import DeviceSelectionDialog from "@/components/inventory/DeviceSelectionDialog";

/**
 * Admin-only page: /jobs/:id/workflow
 * - Adds Materials & Advances tabs with full actions
 * - Keeps existing workflow tabs
 * - Mobile responsive (tables -> cards)
 */

const JobWorkflow = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Invoice state (existing)
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [checkingInvoice, setCheckingInvoice] = useState(false);
  const [existingInvoiceId, setExistingInvoiceId] = useState<string | null>(
    null,
  );

  // Admin requisitions state
  const [selectedRequisition, setSelectedRequisition] = useState<any>(null);
  const [isViewReqOpen, setIsViewReqOpen] = useState(false);
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [isRejectReqOpen, setIsRejectReqOpen] = useState(false);
  const [reqRejectReason, setReqRejectReason] = useState("");

  const [issueQuantities, setIssueQuantities] = useState<
    Record<string, number>
  >({});
  const [issueBatches, setIssueBatches] = useState<Record<string, string>>({});
  const [selectedItemImeis, setSelectedItemImeis] = useState<
    Record<string, string[]>
  >({});
  const [showImeiDialog, setShowImeiDialog] = useState(false);
  const [currentIssuingItem, setCurrentIssuingItem] = useState<any>(null);

  // Admin advances state
  const [selectedAdvance, setSelectedAdvance] = useState<any>(null);
  const [isViewAdvanceOpen, setIsViewAdvanceOpen] = useState(false);
  const [isRejectAdvanceOpen, setIsRejectAdvanceOpen] = useState(false);
  const [isDisburseOpen, setIsDisburseOpen] = useState(false);
  const [advanceRejectReason, setAdvanceRejectReason] = useState("");
  const [disbursementData, setDisbursementData] = useState({
    method: DisbursementMethod.MPESA,
    reference: "",
  });

  // -----------------------------
  // Queries
  // -----------------------------

  const { data: jobWorkflow, isLoading } = useQuery({
    queryKey: ["job-workflow", id],
    queryFn: () => jobsService.getJobWorkflow(id!),
    enabled: !!id,
  });

  const { data: jobRequisitionsData, isLoading: loadingJobReqs } = useQuery({
    queryKey: ["job-requisitions-admin", id],
    queryFn: () =>
      requisitionsService.getRequisitions({ jobId: id!, limit: -1 }),
    enabled: !!id,
  });

  const { data: jobAdvancesData, isLoading: loadingJobAdvances } = useQuery({
    queryKey: ["job-advances-admin", id],
    queryFn: () =>
      advanceRequestsService.getAdvanceRequests({ jobId: id!, limit: -1 }),
    enabled: !!id,
  });

  // Fetch product batches for issuing (per requisition selection)
  const { data: batchesData, isLoading: isBatchesLoading } = useQuery({
    queryKey: ["job-req-batches", selectedRequisition?.id],
    queryFn: async () => {
      if (!selectedRequisition) return {};
      const result: Record<string, ProductBatch[]> = {};

      await Promise.all(
        selectedRequisition.items.map(async (item: any) => {
          try {
            const batches = await productBatchesService.getAvailableBatches(
              item.productId,
            );
            result[item.id] = batches;
          } catch (e) {
            console.error("Failed to fetch available batches:", e);
            result[item.id] = [];
          }
        }),
      );

      return result;
    },
    enabled: isIssueOpen && !!selectedRequisition,
  });

  // -----------------------------
  // Invoice check
  // -----------------------------
  useEffect(() => {
    if (jobWorkflow?.status === "COMPLETED" && id) {
      checkForExistingInvoice();
    }
  }, [jobWorkflow?.status, id]);

  const checkForExistingInvoice = async () => {
    if (!id) return;

    setCheckingInvoice(true);
    try {
      const hasInvoice = await invoicesService.hasInvoiceForJob(id);
      if (hasInvoice) {
        const invoice = await invoicesService.getByJobId(id);
        if (invoice) setExistingInvoiceId(invoice.id);
      }
    } catch (error) {
      console.error("Error checking invoice:", error);
    } finally {
      setCheckingInvoice(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!id) return;

    setGeneratingInvoice(true);
    try {
      const invoice = await invoicesService.createFromJob(id);
      toast.success("Invoice generated successfully");
      navigate(`/invoices/${invoice.id}`);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to generate invoice",
      );
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const handleViewInvoice = () => {
    if (existingInvoiceId) navigate(`/invoices/${existingInvoiceId}`);
  };

  // -----------------------------
  // Admin requisition mutations
  // -----------------------------
  const approveReqMutation = useMutation({
    mutationFn: (reqId: string) =>
      requisitionsService.approveRequisition(reqId),
    onSuccess: async () => {
      toast.success("Requisition approved");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["job-requisitions-admin", id],
        }),
        queryClient.invalidateQueries({ queryKey: ["job-workflow", id] }),
      ]);
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message || "Failed to approve requisition");
    },
  });

  const rejectReqMutation = useMutation({
    mutationFn: ({ reqId, reason }: { reqId: string; reason: string }) =>
      requisitionsService.rejectRequisition(reqId, reason),
    onSuccess: async () => {
      toast.success("Requisition rejected");
      setIsRejectReqOpen(false);
      setSelectedRequisition(null);
      setReqRejectReason("");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["job-requisitions-admin", id],
        }),
        queryClient.invalidateQueries({ queryKey: ["job-workflow", id] }),
      ]);
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message || "Failed to reject requisition");
    },
  });

  const issueReqMutation = useMutation({
    mutationFn: ({
      reqId,
      items,
    }: {
      reqId: string;
      items: IssueItemRequest[];
    }) => requisitionsService.issueItems(reqId, items),
    onSuccess: async () => {
      toast.success("Items issued successfully");
      setIsIssueOpen(false);
      setSelectedRequisition(null);
      setIssueQuantities({});
      setIssueBatches({});
      setSelectedItemImeis({});
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["job-requisitions-admin", id],
        }),
        queryClient.invalidateQueries({ queryKey: ["job-workflow", id] }),
        queryClient.invalidateQueries({ queryKey: ["job-by-id", id] as any }),
      ]);
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message || "Failed to issue items");
    },
  });

  // -----------------------------
  // Admin advances mutations
  // -----------------------------
  const approveAdvanceMutation = useMutation({
    mutationFn: (advanceId: string) =>
      advanceRequestsService.approveAdvanceRequest(advanceId),
    onSuccess: async () => {
      toast.success("Advance request approved");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["job-advances-admin", id] }),
        queryClient.invalidateQueries({ queryKey: ["job-workflow", id] }),
      ]);
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message || "Failed to approve advance");
    },
  });

  const rejectAdvanceMutation = useMutation({
    mutationFn: ({
      advanceId,
      reason,
    }: {
      advanceId: string;
      reason: string;
    }) => advanceRequestsService.rejectAdvanceRequest(advanceId, reason),
    onSuccess: async () => {
      toast.success("Advance request rejected");
      setIsRejectAdvanceOpen(false);
      setSelectedAdvance(null);
      setAdvanceRejectReason("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["job-advances-admin", id] }),
        queryClient.invalidateQueries({ queryKey: ["job-workflow", id] }),
      ]);
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message || "Failed to reject advance");
    },
  });

  const disburseMutation = useMutation({
    mutationFn: ({ advanceId, data }: { advanceId: string; data: any }) =>
      advanceRequestsService.disburseAdvanceRequest(advanceId, data),
    onSuccess: async () => {
      toast.success("Advance disbursed");
      setIsDisburseOpen(false);
      setSelectedAdvance(null);
      setDisbursementData({ method: DisbursementMethod.MPESA, reference: "" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["job-advances-admin", id] }),
        queryClient.invalidateQueries({ queryKey: ["job-workflow", id] }),
      ]);
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message || "Failed to disburse advance");
    },
  });

  // -----------------------------
  // Helpers
  // -----------------------------
  const requisitions = jobRequisitionsData?.data || [];
  const advances = jobAdvancesData?.data || [];

  const jobTitle = useMemo(() => {
    if (!jobWorkflow) return "";
    const cust =
      jobWorkflow.customer?.businessName || jobWorkflow.customer?.contactPerson;
    return `${jobWorkflow.jobNumber} - ${cust || "Customer"}`;
  }, [jobWorkflow]);

  const openViewReq = (req: any) => {
    setSelectedRequisition(req);
    setIsViewReqOpen(true);
  };

  const openIssueReq = (req: any) => {
    setSelectedRequisition(req);
    // initialize remaining quantities
    const q: Record<string, number> = {};
    const b: Record<string, string> = {};
    req.items.forEach((item: any) => {
      q[item.id] = Math.max(0, item.quantityRequested - item.quantityIssued);
      b[item.id] = item.batchId || "";
    });
    setIssueQuantities(q);
    setIssueBatches(b);
    setIsIssueOpen(true);
  };

  const openRejectReq = (req: any) => {
    setSelectedRequisition(req);
    setIsRejectReqOpen(true);
  };

  const handleIssueSubmit = () => {
    if (!selectedRequisition) return;

    const items: IssueItemRequest[] = [];
    for (const item of selectedRequisition.items) {
      const qty = issueQuantities[item.id] || 0;
      if (qty <= 0) continue;

      const batchId = issueBatches[item.id];
      if (!batchId) {
        toast.error(`Select batch for ${item.product.name}`);
        return;
      }

      items.push({
        requisitionItemId: item.id,
        quantityIssued: qty,
        batchId,
        imeiNumbers: selectedItemImeis[item.id] || undefined,
      });
    }

    if (items.length === 0) {
      toast.error("Enter quantities to issue");
      return;
    }

    issueReqMutation.mutate({ reqId: selectedRequisition.id, items });
  };

  const openViewAdvance = (adv: any) => {
    setSelectedAdvance(adv);
    setIsViewAdvanceOpen(true);
  };

  const openRejectAdvance = (adv: any) => {
    setSelectedAdvance(adv);
    setIsRejectAdvanceOpen(true);
  };

  const openDisburseAdvance = (adv: any) => {
    setSelectedAdvance(adv);
    setIsDisburseOpen(true);
  };

  // -----------------------------
  // Render states
  // -----------------------------
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!jobWorkflow) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p>Job not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { workflow } = jobWorkflow;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" onClick={() => navigate("/jobs")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Job Workflow</h1>
            <p className="text-muted-foreground text-sm">{jobTitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={getStatusColor(jobWorkflow.status)}>
            {jobWorkflow.status.replace(/_/g, " ")}
          </Badge>

          {jobWorkflow.status === "COMPLETED" && (
            <>
              {checkingInvoice ? (
                <Button disabled>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </Button>
              ) : existingInvoiceId ? (
                <Button onClick={handleViewInvoice}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Invoice
                </Button>
              ) : (
                <Button
                  onClick={handleGenerateInvoice}
                  disabled={generatingInvoice}
                >
                  {generatingInvoice ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <DollarSign className="mr-2 h-4 w-4" />
                  )}
                  Generate Invoice
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Job Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Job Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <div>
            <Label className="text-muted-foreground">Customer</Label>
            <div className="font-medium">
              {jobWorkflow.customer?.businessName ||
                jobWorkflow.customer?.contactPerson ||
                "—"}
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground">Vehicle</Label>
            <div className="font-medium">
              {jobWorkflow.vehicle?.vehicleReg
                ? `${jobWorkflow.vehicle.vehicleReg} (${jobWorkflow.vehicle.make || ""} ${jobWorkflow.vehicle.model || ""})`
                : "Not assigned"}
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground">Scheduled</Label>
            <div className="font-medium">
              {jobWorkflow.scheduledDate
                ? new Date(jobWorkflow.scheduledDate).toLocaleDateString()
                : "—"}
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground">Type</Label>
            <div className="font-medium">
              {jobWorkflow.jobType?.replace(/_/g, " ") || "—"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1">
          <TabsTrigger value="timeline" className="text-xs sm:text-sm">
            <Clock className="h-4 w-4 mr-2" />
            Timeline
          </TabsTrigger>

          <TabsTrigger value="materials" className="text-xs sm:text-sm">
            <Package className="h-4 w-4 mr-2" />
            Materials
          </TabsTrigger>

          <TabsTrigger value="advances" className="text-xs sm:text-sm">
            <DollarSign className="h-4 w-4 mr-2" />
            Advances
          </TabsTrigger>

          <TabsTrigger value="pre-inspection" className="text-xs sm:text-sm">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Pre
          </TabsTrigger>

          <TabsTrigger value="installation" className="text-xs sm:text-sm">
            <FileText className="h-4 w-4 mr-2" />
            Install
          </TabsTrigger>

          <TabsTrigger value="post-inspection" className="text-xs sm:text-sm">
            <CheckCircle className="h-4 w-4 mr-2" />
            Post
          </TabsTrigger>
        </TabsList>

        {/* Timeline */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Job Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflow.timeline.map((update: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 border-l-2 border-primary pl-4 pb-4"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(update.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="font-medium">{update.message}</p>
                        <Badge variant="outline">
                          {update.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        By {update.user.firstName} {update.user.lastName} •{" "}
                        {new Date(update.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Materials (Admin actions) */}
        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <CardTitle>Material Requisitions (This Job)</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingJobReqs ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : requisitions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No requisitions for this job
                </p>
              ) : (
                <>
                  {/* Mobile: cards */}
                  <div className="space-y-3 sm:hidden">
                    {requisitions.map((req: any) => (
                      <Card key={req.id} className="border">
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-mono font-medium">
                                {req.requisitionNumber}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(req.requestedDate).toLocaleString()}
                              </div>
                            </div>
                            <Badge
                              className={getRequisitionStatusColor(req.status)}
                            >
                              {req.status.replace(/_/g, " ")}
                            </Badge>
                          </div>

                          <div className="text-sm">
                            Items:{" "}
                            <span className="font-medium">
                              {req.items.length}
                            </span>
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openViewReq(req)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>

                            {req.status === RequisitionStatus.PENDING && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    approveReqMutation.mutate(req.id)
                                  }
                                  disabled={approveReqMutation.isPending}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => openRejectReq(req)}
                                >
                                  Reject
                                </Button>
                              </>
                            )}

                            {(req.status === RequisitionStatus.APPROVED ||
                              req.status ===
                                RequisitionStatus.PARTIALLY_ISSUED) && (
                              <Button
                                size="sm"
                                onClick={() => openIssueReq(req)}
                              >
                                Issue
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop: table */}
                  <div className="hidden sm:block rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Req #</TableHead>
                          <TableHead>Technician</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Requested</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requisitions.map((req: any) => (
                          <TableRow key={req.id}>
                            <TableCell className="font-mono font-medium">
                              {req.requisitionNumber}
                            </TableCell>
                            <TableCell className="text-sm">
                              {req.technician?.user?.firstName}{" "}
                              {req.technician?.user?.lastName}
                            </TableCell>
                            <TableCell>{req.items.length}</TableCell>
                            <TableCell className="text-sm">
                              {new Date(req.requestedDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={getRequisitionStatusColor(
                                  req.status,
                                )}
                              >
                                {req.status.replace(/_/g, " ")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2 flex-wrap">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openViewReq(req)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>

                                {req.status === RequisitionStatus.PENDING && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        approveReqMutation.mutate(req.id)
                                      }
                                      disabled={approveReqMutation.isPending}
                                    >
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => openRejectReq(req)}
                                    >
                                      Reject
                                    </Button>
                                  </>
                                )}

                                {(req.status === RequisitionStatus.APPROVED ||
                                  req.status ===
                                    RequisitionStatus.PARTIALLY_ISSUED) && (
                                  <Button
                                    size="sm"
                                    onClick={() => openIssueReq(req)}
                                  >
                                    Issue Items
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advances (Admin actions) */}
        <TabsContent value="advances">
          <Card>
            <CardHeader>
              <CardTitle>Financial Advances (This Job)</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingJobAdvances ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : advances.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No advance requests for this job
                </p>
              ) : (
                <>
                  {/* Mobile cards */}
                  <div className="space-y-3 sm:hidden">
                    {advances.map((req: any) => (
                      <Card key={req.id} className="border">
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-mono font-medium">
                                {req.requestNumber}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(req.requestedDate).toLocaleString()}
                              </div>
                            </div>
                            <Badge
                              className={getAdvanceStatusColor(req.status)}
                            >
                              {req.status.replace(/_/g, " ")}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              {req.requestType.replace(/_/g, " ")}
                            </div>
                            <div className="font-bold text-primary">
                              KES{" "}
                              {parseFloat(String(req.amount)).toLocaleString()}
                            </div>
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openViewAdvance(req)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>

                            {req.status === AdvanceRequestStatus.PENDING && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    approveAdvanceMutation.mutate(req.id)
                                  }
                                  disabled={approveAdvanceMutation.isPending}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => openRejectAdvance(req)}
                                >
                                  Reject
                                </Button>
                              </>
                            )}

                            {req.status === AdvanceRequestStatus.APPROVED && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => openDisburseAdvance(req)}
                              >
                                <Send className="h-4 w-4 mr-1" />
                                Disburse
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden sm:block rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Request #</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Requested</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {advances.map((req: any) => (
                          <TableRow key={req.id}>
                            <TableCell className="font-mono font-medium">
                              {req.requestNumber}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {req.requestType.replace(/_/g, " ")}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-bold text-primary">
                              KES{" "}
                              {parseFloat(String(req.amount)).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-sm">
                              {new Date(req.requestedDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={getAdvanceStatusColor(req.status)}
                              >
                                {req.status.replace(/_/g, " ")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2 flex-wrap">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openViewAdvance(req)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>

                                {req.status ===
                                  AdvanceRequestStatus.PENDING && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        approveAdvanceMutation.mutate(req.id)
                                      }
                                      disabled={
                                        approveAdvanceMutation.isPending
                                      }
                                    >
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => openRejectAdvance(req)}
                                    >
                                      Reject
                                    </Button>
                                  </>
                                )}

                                {req.status ===
                                  AdvanceRequestStatus.APPROVED && (
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => openDisburseAdvance(req)}
                                  >
                                    <Send className="h-4 w-4 mr-1" />
                                    Disburse
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pre-Inspection Tab Tab */}
        <TabsContent value="pre-inspection">
          <Card>
            <CardHeader>
              <CardTitle>Pre-Installation Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              {workflow.preInspectionChecklist.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No pre-inspection data
                </p>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Component</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Checked By</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workflow.preInspectionChecklist.map(
                        (check: any, idx: number) => (
                          <TableRow key={check.id}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell className="font-medium">
                              {check.checklistItem.name}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={getCheckStatusColor(check.status)}
                              >
                                {check.status === "CHECKED" ? (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                ) : check.status === "ISSUE_FOUND" ? (
                                  <XCircle className="h-3 w-3 mr-1" />
                                ) : (
                                  <Clock className="h-3 w-3 mr-1" />
                                )}
                                {check.status.replace(/_/g, " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {check.technician.user.firstName}{" "}
                              {check.technician.user.lastName}
                            </TableCell>
                            <TableCell>
                              {new Date(check.checkedAt).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {check.notes || "-"}
                            </TableCell>
                          </TableRow>
                        ),
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Installation */}
        <TabsContent value="installation">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">
                Installation Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm md:text-base">
                    IMEI Numbers
                  </h3>
                  {jobWorkflow.imeiNumbers &&
                  jobWorkflow.imeiNumbers.length > 0 ? (
                    <div className="space-y-1">
                      {jobWorkflow.imeiNumbers.map(
                        (imei: string, idx: number) => (
                          <p
                            key={idx}
                            className="font-mono text-xs md:text-sm bg-muted p-2 rounded"
                          >
                            {imei}
                          </p>
                        ),
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Not provided
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm md:text-base">
                    SIM Card
                  </h3>
                  <p className="font-mono text-xs md:text-sm bg-muted p-2 rounded">
                    {jobWorkflow.simCardIccid || "Not provided"}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm md:text-base">
                    MAC Address
                  </h3>
                  <p className="font-mono text-xs md:text-sm bg-muted p-2 rounded">
                    {jobWorkflow.macAddress || "Not provided"}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm md:text-base">
                    GPS Coordinates
                  </h3>
                  <p className="text-xs md:text-sm bg-muted p-2 rounded">
                    {jobWorkflow.gpsCoordinates || "Not captured"}
                  </p>
                </div>

                <div className="col-span-1 md:col-span-2 space-y-2">
                  <h3 className="font-semibold text-sm md:text-base">
                    Installation Notes
                  </h3>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs md:text-sm whitespace-pre-wrap">
                      {jobWorkflow.installationNotes || "No notes provided"}
                    </p>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2 space-y-2">
                  <h3 className="font-semibold text-sm md:text-base">
                    Installation Photos
                  </h3>
                  {jobWorkflow.photoUrls && jobWorkflow.photoUrls.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {jobWorkflow.photoUrls.map((url: string, idx: number) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative aspect-video overflow-hidden rounded-lg border hover:border-primary transition-colors"
                        >
                          <img
                            src={url}
                            alt={`Installation photo ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No photos uploaded
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Post-Inspection */}
        <TabsContent value="post-inspection">
          <Card>
            <CardHeader>
              <CardTitle>Post-Installation Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              {workflow.postInspectionChecklist.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No post-inspection data
                </p>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Component</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Checked By</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workflow.postInspectionChecklist.map(
                        (check: any, idx: number) => (
                          <TableRow key={check.id}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell className="font-medium">
                              {check.checklistItem.name}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={getCheckStatusColor(check.status)}
                              >
                                {check.status === "CHECKED" ? (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                ) : check.status === "ISSUE_FOUND" ? (
                                  <XCircle className="h-3 w-3 mr-1" />
                                ) : (
                                  <Clock className="h-3 w-3 mr-1" />
                                )}
                                {check.status.replace(/_/g, " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {check.technician.user.firstName}{" "}
                              {check.technician.user.lastName}
                            </TableCell>
                            <TableCell>
                              {new Date(check.checkedAt).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {check.notes || "-"}
                            </TableCell>
                          </TableRow>
                        ),
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* -------------------- DIALOGS: Requisition view -------------------- */}
      <Dialog open={isViewReqOpen} onOpenChange={setIsViewReqOpen}>
        <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Requisition Details</DialogTitle>
            <DialogDescription>
              Review items and take actions (approve/reject/issue)
            </DialogDescription>
          </DialogHeader>

          {selectedRequisition && (
            <div className="space-y-4 py-2">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-mono font-medium text-lg">
                    {selectedRequisition.requisitionNumber}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Requested:{" "}
                    {new Date(
                      selectedRequisition.requestedDate,
                    ).toLocaleString()}
                  </div>
                </div>
                <Badge
                  className={getRequisitionStatusColor(
                    selectedRequisition.status,
                  )}
                >
                  {selectedRequisition.status.replace(/_/g, " ")}
                </Badge>
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-center">Requested</TableHead>
                      <TableHead className="text-center">Issued</TableHead>
                      <TableHead className="text-center">Remaining</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedRequisition.items.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.product.name}{" "}
                          <span className="text-muted-foreground">
                            ({item.product.sku})
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {item.quantityRequested}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.quantityIssued}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.quantityRequested - item.quantityIssued}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {selectedRequisition.notes && (
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <strong>Notes:</strong> {selectedRequisition.notes}
                </div>
              )}

              {selectedRequisition.rejectionReason && (
                <div className="p-3 bg-destructive/10 rounded-lg text-sm text-destructive">
                  <strong>Rejection:</strong>{" "}
                  {selectedRequisition.rejectionReason}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsViewReqOpen(false)}>
              Close
            </Button>

            {selectedRequisition?.status === RequisitionStatus.PENDING && (
              <>
                <Button
                  onClick={() => {
                    setIsViewReqOpen(false);
                    approveReqMutation.mutate(selectedRequisition.id);
                  }}
                  disabled={approveReqMutation.isPending}
                >
                  {approveReqMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsViewReqOpen(false);
                    openRejectReq(selectedRequisition);
                  }}
                >
                  Reject
                </Button>
              </>
            )}

            {(selectedRequisition?.status === RequisitionStatus.APPROVED ||
              selectedRequisition?.status ===
                RequisitionStatus.PARTIALLY_ISSUED) && (
              <Button
                onClick={() => {
                  setIsViewReqOpen(false);
                  openIssueReq(selectedRequisition);
                }}
              >
                Issue Items
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -------------------- DIALOGS: Requisition issue -------------------- */}
      <Dialog open={isIssueOpen} onOpenChange={setIsIssueOpen}>
        <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Issue Items</DialogTitle>
            <DialogDescription>
              Select batch, set issue qty, and select IMEIs for each item.
            </DialogDescription>
          </DialogHeader>

          {isBatchesLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Warning for the common mismatch */}
              <div className="p-3 rounded-lg border bg-muted/30 text-sm">
                <div className="font-medium">Important</div>
                <div className="text-muted-foreground">
                  If batch shows stock but IMEI list is empty, it means the
                  batch has inventory but no AVAILABLE device records (IMEIs)
                  were stocked for that batch.
                </div>
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-center">Remaining</TableHead>
                      <TableHead className="text-center">Batch</TableHead>
                      <TableHead className="text-center">Issue Qty</TableHead>
                      <TableHead className="text-center">IMEI</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedRequisition?.items.map((item: any) => {
                      const remaining =
                        item.quantityRequested - item.quantityIssued;
                      const batches = (batchesData as any)?.[item.id] || [];

                      const qty = issueQuantities[item.id] || 0;
                      const batchId = issueBatches[item.id] || "";

                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            <div>{item.product.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.product.sku}
                            </div>
                          </TableCell>

                          <TableCell className="text-center">
                            <Badge
                              variant={
                                remaining > 0 ? "destructive" : "default"
                              }
                            >
                              {remaining}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-center">
                            <select
                              className="h-9 rounded-md border bg-background px-2 text-sm w-[220px]"
                              value={batchId}
                              onChange={(e) =>
                                setIssueBatches((prev) => ({
                                  ...prev,
                                  [item.id]: e.target.value,
                                }))
                              }
                              disabled={remaining === 0}
                            >
                              <option value="">Select batch</option>
                              {batches.map((b: any) => (
                                <option
                                  key={b.id}
                                  value={b.id}
                                  disabled={b.quantityRemaining === 0}
                                >
                                  {b.batchNumber} • {b.quantityRemaining} left
                                </option>
                              ))}
                            </select>
                          </TableCell>

                          <TableCell className="text-center">
                            <Input
                              type="number"
                              min={0}
                              max={remaining}
                              value={qty}
                              onChange={(e) => {
                                const v = parseInt(e.target.value) || 0;
                                setIssueQuantities((prev) => ({
                                  ...prev,
                                  [item.id]: Math.min(
                                    Math.max(0, v),
                                    remaining,
                                  ),
                                }));
                              }}
                              className="w-24 text-center"
                              disabled={remaining === 0}
                            />
                          </TableCell>

                          <TableCell className="text-center">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (!batchId) {
                                  toast.error("Select batch first");
                                  return;
                                }
                                if (qty <= 0) {
                                  toast.error("Enter quantity first");
                                  return;
                                }

                                setCurrentIssuingItem(item);
                                setShowImeiDialog(true);
                              }}
                              disabled={!batchId || qty <= 0}
                            >
                              <Smartphone className="h-4 w-4 mr-1" />
                              {selectedItemImeis[item.id]?.length
                                ? `${selectedItemImeis[item.id].length} Selected`
                                : "Select IMEI"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsIssueOpen(false);
                setSelectedRequisition(null);
                setIssueQuantities({});
                setIssueBatches({});
                setSelectedItemImeis({});
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleIssueSubmit}
              disabled={issueReqMutation.isPending || isBatchesLoading}
            >
              {issueReqMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Issue Items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject requisition */}
      <AlertDialog open={isRejectReqOpen} onOpenChange={setIsRejectReqOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Requisition</AlertDialogTitle>
            <AlertDialogDescription>
              Provide a reason for rejecting{" "}
              {selectedRequisition?.requisitionNumber}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-2 space-y-2">
            <Label>Reason</Label>
            <Textarea
              value={reqRejectReason}
              onChange={(e) => setReqRejectReason(e.target.value)}
              rows={4}
              placeholder="Enter rejection reason..."
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReqRejectReason("")}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!selectedRequisition || !reqRejectReason.trim()) {
                  toast.error("Rejection reason is required");
                  return;
                }
                rejectReqMutation.mutate({
                  reqId: selectedRequisition.id,
                  reason: reqRejectReason,
                });
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={rejectReqMutation.isPending || !reqRejectReason.trim()}
            >
              {rejectReqMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* -------------------- DIALOGS: Advance view/reject/disburse -------------------- */}
      <Dialog open={isViewAdvanceOpen} onOpenChange={setIsViewAdvanceOpen}>
        <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Advance Request</DialogTitle>
          </DialogHeader>

          {selectedAdvance && (
            <div className="space-y-4 py-2 text-sm">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-mono font-medium text-lg">
                    {selectedAdvance.requestNumber}
                  </div>
                  <div className="text-muted-foreground">
                    Requested:{" "}
                    {new Date(selectedAdvance.requestedDate).toLocaleString()}
                  </div>
                </div>
                <Badge
                  className={getAdvanceStatusColor(selectedAdvance.status)}
                >
                  {selectedAdvance.status.replace(/_/g, " ")}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <div className="font-medium">
                    {selectedAdvance.requestType.replace(/_/g, " ")}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <div className="font-bold text-primary text-lg">
                    KES{" "}
                    {parseFloat(
                      String(selectedAdvance.amount),
                    ).toLocaleString()}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Description</Label>
                <div className="p-3 bg-muted rounded-lg">
                  {selectedAdvance.description}
                </div>
              </div>

              {selectedAdvance.justification && (
                <div>
                  <Label className="text-muted-foreground">Justification</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    {selectedAdvance.justification}
                  </div>
                </div>
              )}

              {selectedAdvance.rejectionReason && (
                <div className="p-3 bg-destructive/10 rounded-lg text-destructive">
                  <strong>Rejected:</strong> {selectedAdvance.rejectionReason}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsViewAdvanceOpen(false)}
            >
              Close
            </Button>

            {selectedAdvance?.status === AdvanceRequestStatus.PENDING && (
              <>
                <Button
                  onClick={() => {
                    setIsViewAdvanceOpen(false);
                    approveAdvanceMutation.mutate(selectedAdvance.id);
                  }}
                  disabled={approveAdvanceMutation.isPending}
                >
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsViewAdvanceOpen(false);
                    openRejectAdvance(selectedAdvance);
                  }}
                >
                  Reject
                </Button>
              </>
            )}

            {selectedAdvance?.status === AdvanceRequestStatus.APPROVED && (
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  setIsViewAdvanceOpen(false);
                  openDisburseAdvance(selectedAdvance);
                }}
              >
                <Send className="mr-2 h-4 w-4" />
                Disburse
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject advance */}
      <AlertDialog
        open={isRejectAdvanceOpen}
        onOpenChange={setIsRejectAdvanceOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Advance Request</AlertDialogTitle>
            <AlertDialogDescription>
              Provide a reason for rejecting {selectedAdvance?.requestNumber}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-2 space-y-2">
            <Label>Reason</Label>
            <Textarea
              value={advanceRejectReason}
              onChange={(e) => setAdvanceRejectReason(e.target.value)}
              rows={4}
              placeholder="Enter rejection reason..."
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAdvanceRejectReason("")}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!selectedAdvance || !advanceRejectReason.trim()) {
                  toast.error("Rejection reason is required");
                  return;
                }
                rejectAdvanceMutation.mutate({
                  advanceId: selectedAdvance.id,
                  reason: advanceRejectReason,
                });
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={
                rejectAdvanceMutation.isPending || !advanceRejectReason.trim()
              }
            >
              {rejectAdvanceMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disburse advance */}
      <Dialog open={isDisburseOpen} onOpenChange={setIsDisburseOpen}>
        <DialogContent className="w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Disburse Advance</DialogTitle>
            <DialogDescription>
              Record disbursement details for {selectedAdvance?.requestNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Method</Label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={disbursementData.method}
                onChange={(e) =>
                  setDisbursementData((prev) => ({
                    ...prev,
                    method: e.target.value as DisbursementMethod,
                  }))
                }
              >
                <option value={DisbursementMethod.CASH}>Cash</option>
                <option value={DisbursementMethod.MPESA}>M-Pesa</option>
                <option value={DisbursementMethod.BANK_TRANSFER}>
                  Bank Transfer
                </option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Reference (optional)</Label>
              <Input
                value={disbursementData.reference}
                onChange={(e) =>
                  setDisbursementData((prev) => ({
                    ...prev,
                    reference: e.target.value,
                  }))
                }
                placeholder="Transaction reference"
              />
            </div>

            {selectedAdvance && (
              <div className="bg-muted p-4 rounded-lg flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount:</span>
                <span className="text-xl font-bold text-primary">
                  KES{" "}
                  {parseFloat(String(selectedAdvance.amount)).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDisburseOpen(false);
                setDisbursementData({
                  method: DisbursementMethod.MPESA,
                  reference: "",
                });
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                if (!selectedAdvance) return;
                disburseMutation.mutate({
                  advanceId: selectedAdvance.id,
                  data: {
                    disbursementMethod: disbursementData.method,
                    referenceNumber: disbursementData.reference || undefined,
                  },
                });
              }}
              disabled={disburseMutation.isPending}
            >
              {disburseMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm Disbursement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* IMEI selection dialog */}
      {currentIssuingItem && (
        <DeviceSelectionDialog
          open={showImeiDialog}
          onOpenChange={setShowImeiDialog}
          productId={currentIssuingItem.productId}
          productName={currentIssuingItem.product.name}
          batchId={issueBatches[currentIssuingItem.id]}
          requiredCount={issueQuantities[currentIssuingItem.id] || 0}
          allowSkip={false}
          onConfirm={(imeis) => {
            setSelectedItemImeis((prev) => ({
              ...prev,
              [currentIssuingItem.id]: imeis,
            }));
            setCurrentIssuingItem(null);
          }}
        />
      )}
    </div>
  );
};

// ---------------- Helpers ----------------
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    PENDING: "bg-gray-500",
    SCHEDULED: "bg-indigo-500",
    ASSIGNED: "bg-blue-500",
    IN_PROGRESS: "bg-purple-500",
    COMPLETED: "bg-green-500",
    VERIFIED: "bg-green-600",
    CANCELLED: "bg-red-500",
    REQUISITION_PENDING: "bg-yellow-500",
    REQUISITION_APPROVED: "bg-blue-500",
  };
  return colors[status] || "bg-gray-500";
};

const getRequisitionStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-500",
    APPROVED: "bg-blue-500",
    PARTIALLY_ISSUED: "bg-orange-500",
    FULLY_ISSUED: "bg-green-500",
    REJECTED: "bg-red-500",
  };
  return colors[status] || "bg-gray-500";
};

const getAdvanceStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-500",
    APPROVED: "bg-blue-500",
    DISBURSED: "bg-green-500",
    REJECTED: "bg-red-500",
  };
  return colors[status] || "bg-gray-500";
};

const getCheckStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    CHECKED: "bg-green-500",
    NOT_CHECKED: "bg-gray-500",
    ISSUE_FOUND: "bg-red-500",
  };
  return colors[status] || "bg-gray-500";
};

const getStatusIcon = (status: string) => {
  const icons: Record<string, any> = {
    COMPLETED: <CheckCircle className="h-5 w-5 text-green-600" />,
    CANCELLED: <XCircle className="h-5 w-5 text-red-600" />,
    IN_PROGRESS: <Clock className="h-5 w-5 text-purple-600" />,
  };
  return icons[status] || <Clock className="h-5 w-5 text-blue-600" />;
};

export default JobWorkflow;
