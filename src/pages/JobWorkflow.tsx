import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";

import { jobsService } from "@/api/services/jobs.service";
import { invoicesService } from "@/api/services/invoices.service";
import {
  requisitionsService,
  IssueItemRequest,
} from "@/api/services/requisitions.service";
import {
  advanceRequestsService,
  DisbursementMethod,
} from "@/api/services/advance-requests.service";
import {
  ProductBatch,
  productBatchesService,
} from "@/api/services/product-batches.service";

import WorkflowHeader from "./job-workflow/components/WorkflowHeader";
import JobSummaryCard from "./job-workflow/components/JobSummaryCard";
import TimelineTab from "./job-workflow/components/TimelineTab";
import PreInspectionTab from "./job-workflow/components/PreInspectionTab";
import PostInspectionTab from "./job-workflow/components/PostInspectionTab";
import InstallationDetailsTab from "./job-workflow/components/InstallationDetailsTab";

import MaterialsTab from "./job-workflow/tabs/MaterialsTab";
import AdvancesTab from "./job-workflow/tabs/AdvancesTab";

import RequisitionViewDialog from "./job-workflow/dialogs/RequisitionViewDialog";
import RequisitionIssueDialog from "./job-workflow/dialogs/RequisitionIssueDialog";
import RejectRequisitionDialog from "./job-workflow/dialogs/RejectRequisitionDialog";

import AdvanceViewDialog from "./job-workflow/dialogs/AdvanceViewDialog";
import RejectAdvanceDialog from "./job-workflow/dialogs/RejectAdvanceDialog";
import DisburseAdvanceDialog from "./job-workflow/dialogs/DisburseAdvanceDialog";

import DeviceSelectionDialog from "@/components/inventory/DeviceSelectionDialog";

const JobWorkflow = () => {
  const { id } = useParams<{ id: string }>();
  const jobId = id!;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Invoice
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [checkingInvoice, setCheckingInvoice] = useState(false);
  const [existingInvoiceId, setExistingInvoiceId] = useState<string | null>(
    null,
  );

  // Requisition dialog states
  const [selectedRequisition, setSelectedRequisition] = useState<any>(null);
  const [viewReqOpen, setViewReqOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [rejectReqOpen, setRejectReqOpen] = useState(false);
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

  // Advances dialog states
  const [selectedAdvance, setSelectedAdvance] = useState<any>(null);
  const [viewAdvanceOpen, setViewAdvanceOpen] = useState(false);
  const [rejectAdvanceOpen, setRejectAdvanceOpen] = useState(false);
  const [disburseOpen, setDisburseOpen] = useState(false);

  const [advanceRejectReason, setAdvanceRejectReason] = useState("");
  const [disbursementData, setDisbursementData] = useState({
    method: DisbursementMethod.MPESA,
    reference: "",
  });

  // -----------------------------
  // Queries
  // -----------------------------
  const { data: jobWorkflow, isLoading } = useQuery({
    queryKey: ["job-workflow", jobId],
    queryFn: () => jobsService.getJobWorkflow(jobId),
    enabled: !!jobId,
  });

  const { data: jobRequisitionsData, isLoading: loadingJobReqs } = useQuery({
    queryKey: ["job-requisitions-admin", jobId],
    queryFn: () => requisitionsService.getRequisitions({ jobId, limit: -1 }),
    enabled: !!jobId,
  });

  const { data: jobAdvancesData, isLoading: loadingJobAdvances } = useQuery({
    queryKey: ["job-advances-admin", jobId],
    queryFn: () =>
      advanceRequestsService.getAdvanceRequests({ jobId, limit: -1 }),
    enabled: !!jobId,
  });

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
          } catch {
            result[item.id] = [];
          }
        }),
      );

      return result;
    },
    enabled: issueOpen && !!selectedRequisition,
  });

  // -----------------------------
  // Invoice check
  // -----------------------------
  useEffect(() => {
    if (jobWorkflow?.status === "COMPLETED" && jobId) {
      checkForExistingInvoice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobWorkflow?.status, jobId]);

  const checkForExistingInvoice = async () => {
    setCheckingInvoice(true);
    try {
      const hasInvoice = await invoicesService.hasInvoiceForJob(jobId);
      if (hasInvoice) {
        const invoice = await invoicesService.getByJobId(jobId);
        if (invoice) setExistingInvoiceId(invoice.id);
      }
    } catch {
      // ignore
    } finally {
      setCheckingInvoice(false);
    }
  };

  const handleGenerateInvoice = async () => {
    setGeneratingInvoice(true);
    try {
      const invoice = await invoicesService.createFromJob(jobId);
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
  // Mutations — requisitions
  // -----------------------------
  const approveReqMutation = useMutation({
    mutationFn: (reqId: string) =>
      requisitionsService.approveRequisition(reqId),
    onSuccess: async () => {
      toast.success("Requisition approved");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["job-requisitions-admin", jobId],
        }),
        queryClient.invalidateQueries({ queryKey: ["job-workflow", jobId] }),
      ]);
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Failed to approve requisition"),
  });

  const rejectReqMutation = useMutation({
    mutationFn: ({ reqId, reason }: { reqId: string; reason: string }) =>
      requisitionsService.rejectRequisition(reqId, reason),
    onSuccess: async () => {
      toast.success("Requisition rejected");
      setRejectReqOpen(false);
      setSelectedRequisition(null);
      setReqRejectReason("");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["job-requisitions-admin", jobId],
        }),
        queryClient.invalidateQueries({ queryKey: ["job-workflow", jobId] }),
      ]);
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Failed to reject requisition"),
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
      closeIssueDialog();
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["job-requisitions-admin", jobId],
        }),
        queryClient.invalidateQueries({ queryKey: ["job-workflow", jobId] }),
        queryClient.invalidateQueries({
          queryKey: ["job-by-id", jobId] as any,
        }),
      ]);
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Failed to issue items"),
  });

  // -----------------------------
  // Mutations — advances
  // -----------------------------
  const approveAdvanceMutation = useMutation({
    mutationFn: (advanceId: string) =>
      advanceRequestsService.approveAdvanceRequest(advanceId),
    onSuccess: async () => {
      toast.success("Advance request approved");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["job-advances-admin", jobId],
        }),
        queryClient.invalidateQueries({ queryKey: ["job-workflow", jobId] }),
      ]);
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Failed to approve advance"),
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
      setRejectAdvanceOpen(false);
      setSelectedAdvance(null);
      setAdvanceRejectReason("");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["job-advances-admin", jobId],
        }),
        queryClient.invalidateQueries({ queryKey: ["job-workflow", jobId] }),
      ]);
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Failed to reject advance"),
  });

  const disburseMutation = useMutation({
    mutationFn: ({ advanceId, data }: { advanceId: string; data: any }) =>
      advanceRequestsService.disburseAdvanceRequest(advanceId, data),
    onSuccess: async () => {
      toast.success("Advance disbursed");
      setDisburseOpen(false);
      setSelectedAdvance(null);
      setDisbursementData({ method: DisbursementMethod.MPESA, reference: "" });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["job-advances-admin", jobId],
        }),
        queryClient.invalidateQueries({ queryKey: ["job-workflow", jobId] }),
      ]);
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Failed to disburse advance"),
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
    setViewReqOpen(true);
  };

  const openIssueReq = (req: any) => {
    setSelectedRequisition(req);

    const q: Record<string, number> = {};
    const b: Record<string, string> = {};
    req.items.forEach((item: any) => {
      q[item.id] = Math.max(0, item.quantityRequested - item.quantityIssued);
      b[item.id] = item.batchId || "";
    });

    setIssueQuantities(q);
    setIssueBatches(b);
    setIssueOpen(true);
  };

  const openRejectReq = (req: any) => {
    setSelectedRequisition(req);
    setRejectReqOpen(true);
  };

  const closeIssueDialog = () => {
    setIssueOpen(false);
    setSelectedRequisition(null);
    setIssueQuantities({});
    setIssueBatches({});
    setSelectedItemImeis({});
    setCurrentIssuingItem(null);
    setShowImeiDialog(false);
  };

  const handleIssueSubmit = () => {
    if (!selectedRequisition) return;

    const items: IssueItemRequest[] = [];

    for (const item of selectedRequisition.items) {
      const remaining = item.quantityRequested - item.quantityIssued;
      const qty = Math.min(issueQuantities[item.id] || 0, remaining);
      if (qty <= 0) continue;

      const batchId = issueBatches[item.id];
      if (!batchId) {
        toast.error(`Select batch for ${item.product.name}`);
        return;
      }

      const imeis = selectedItemImeis[item.id] || [];
      if (imeis.length !== qty) {
        toast.error(`Select exactly ${qty} IMEI(s) for ${item.product.name}`);
        return;
      }

      items.push({
        requisitionItemId: item.id,
        quantityIssued: qty,
        batchId,
        imeiNumbers: imeis,
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
    setViewAdvanceOpen(true);
  };

  const openRejectAdvance = (adv: any) => {
    setSelectedAdvance(adv);
    setRejectAdvanceOpen(true);
  };

  const openDisburseAdvance = (adv: any) => {
    setSelectedAdvance(adv);
    setDisburseOpen(true);
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
      <div className="p-4 sm:p-6">
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
    <div className="min-h-screen bg-background">
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
        <WorkflowHeader
          jobTitle={jobTitle}
          status={jobWorkflow.status}
          onBack={() => navigate("/jobs")}
          invoice={{
            isCompleted: jobWorkflow.status === "COMPLETED",
            checkingInvoice,
            generatingInvoice,
            existingInvoiceId,
            onGenerate: handleGenerateInvoice,
            onView: handleViewInvoice,
          }}
        />

        <JobSummaryCard job={jobWorkflow} />

        {/* Tabs Container with responsive design */}
        <div className="w-full">
          <Tabs defaultValue="timeline" className="w-full">
            {/* Responsive TabsList */}
            <div className="w-full overflow-x-auto">
              <TabsList className="inline-flex w-full min-w-max sm:w-full sm:inline-grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1 p-1 bg-muted rounded-lg">
                <TabsTrigger
                  value="timeline"
                  className="flex-shrink-0 sm:flex-1 text-[11px] xs:text-xs sm:text-sm whitespace-nowrap sm:whitespace-normal px-2 sm:px-3 py-2"
                >
                  Timeline
                </TabsTrigger>

                <TabsTrigger
                  value="materials"
                  className="flex-shrink-0 sm:flex-1 text-[11px] xs:text-xs sm:text-sm whitespace-nowrap sm:whitespace-normal px-2 sm:px-3 py-2"
                >
                  Materials
                </TabsTrigger>

                <TabsTrigger
                  value="advances"
                  className="flex-shrink-0 sm:flex-1 text-[11px] xs:text-xs sm:text-sm whitespace-nowrap sm:whitespace-normal px-2 sm:px-3 py-2"
                >
                  Advances
                </TabsTrigger>

                <TabsTrigger
                  value="pre-inspection"
                  className="flex-shrink-0 sm:flex-1 text-[11px] xs:text-xs sm:text-sm whitespace-nowrap sm:whitespace-normal px-2 sm:px-3 py-2"
                >
                  <span className="hidden xs:inline">Pre-Insp</span>
                  <span className="inline xs:hidden">Pre</span>
                </TabsTrigger>

                <TabsTrigger
                  value="installation"
                  className="flex-shrink-0 sm:flex-1 text-[11px] xs:text-xs sm:text-sm whitespace-nowrap sm:whitespace-normal px-2 sm:px-3 py-2"
                >
                  <span className="hidden xs:inline">Install</span>
                  <span className="inline xs:hidden">Inst</span>
                </TabsTrigger>

                <TabsTrigger
                  value="post-inspection"
                  className="flex-shrink-0 sm:flex-1 text-[11px] xs:text-xs sm:text-sm whitespace-nowrap sm:whitespace-normal px-2 sm:px-3 py-2"
                >
                  <span className="hidden xs:inline">Post-Insp</span>
                  <span className="inline xs:hidden">Post</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Contents */}
            <div className="mt-4 sm:mt-6 w-full">
              <TabsContent value="timeline" className="mt-0 w-full">
                <TimelineTab timeline={workflow.timeline} />
              </TabsContent>

              <TabsContent value="materials" className="mt-0 w-full">
                <MaterialsTab
                  loading={loadingJobReqs}
                  requisitions={requisitions}
                  onView={openViewReq}
                  onApprove={(reqId) => approveReqMutation.mutate(reqId)}
                  onReject={openRejectReq}
                  onIssue={openIssueReq}
                  approving={approveReqMutation.isPending}
                />
              </TabsContent>

              <TabsContent value="advances" className="mt-0 w-full">
                <AdvancesTab
                  loading={loadingJobAdvances}
                  advances={advances}
                  onView={openViewAdvance}
                  onApprove={(id) => approveAdvanceMutation.mutate(id)}
                  onReject={openRejectAdvance}
                  onDisburse={openDisburseAdvance}
                  approving={approveAdvanceMutation.isPending}
                />
              </TabsContent>

              <TabsContent value="pre-inspection" className="mt-0 w-full">
                <PreInspectionTab checklist={workflow.preInspectionChecklist} />
              </TabsContent>

              <TabsContent value="installation" className="mt-0 w-full">
                <InstallationDetailsTab job={jobWorkflow} />
              </TabsContent>

              <TabsContent value="post-inspection" className="mt-0 w-full">
                <PostInspectionTab
                  checklist={workflow.postInspectionChecklist}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Requisition dialogs */}
        <RequisitionViewDialog
          open={viewReqOpen}
          onOpenChange={setViewReqOpen}
          requisition={selectedRequisition}
          onApprove={(reqId) => approveReqMutation.mutate(reqId)}
          onReject={(req) => {
            setViewReqOpen(false);
            openRejectReq(req);
          }}
          onIssue={(req) => {
            setViewReqOpen(false);
            openIssueReq(req);
          }}
          approving={approveReqMutation.isPending}
        />

        <RequisitionIssueDialog
          open={issueOpen}
          onOpenChange={(v) => {
            if (!v) closeIssueDialog();
            else setIssueOpen(true);
          }}
          requisition={selectedRequisition}
          batchesData={batchesData as any}
          batchesLoading={isBatchesLoading}
          issueQuantities={issueQuantities}
          setIssueQuantities={setIssueQuantities}
          issueBatches={issueBatches}
          setIssueBatches={setIssueBatches}
          selectedItemImeis={selectedItemImeis}
          onSelectImei={(item) => {
            const batchId = issueBatches[item.id];
            const qty = issueQuantities[item.id] || 0;

            if (!batchId) return toast.error("Select batch first");
            if (qty <= 0) return toast.error("Enter quantity first");

            setCurrentIssuingItem(item);
            setShowImeiDialog(true);
          }}
          onSubmit={handleIssueSubmit}
          submitting={issueReqMutation.isPending}
        />

        <RejectRequisitionDialog
          open={rejectReqOpen}
          onOpenChange={setRejectReqOpen}
          requisition={selectedRequisition}
          reason={reqRejectReason}
          setReason={setReqRejectReason}
          onConfirm={() => {
            if (!selectedRequisition || !reqRejectReason.trim()) {
              toast.error("Rejection reason is required");
              return;
            }
            rejectReqMutation.mutate({
              reqId: selectedRequisition.id,
              reason: reqRejectReason,
            });
          }}
          submitting={rejectReqMutation.isPending}
        />

        {/* Advance dialogs */}
        <AdvanceViewDialog
          open={viewAdvanceOpen}
          onOpenChange={setViewAdvanceOpen}
          advance={selectedAdvance}
          onApprove={(id) => approveAdvanceMutation.mutate(id)}
          onReject={(adv) => {
            setViewAdvanceOpen(false);
            openRejectAdvance(adv);
          }}
          onDisburse={(adv) => {
            setViewAdvanceOpen(false);
            openDisburseAdvance(adv);
          }}
          approving={approveAdvanceMutation.isPending}
        />

        <RejectAdvanceDialog
          open={rejectAdvanceOpen}
          onOpenChange={setRejectAdvanceOpen}
          advance={selectedAdvance}
          reason={advanceRejectReason}
          setReason={setAdvanceRejectReason}
          onConfirm={() => {
            if (!selectedAdvance || !advanceRejectReason.trim()) {
              toast.error("Rejection reason is required");
              return;
            }
            rejectAdvanceMutation.mutate({
              advanceId: selectedAdvance.id,
              reason: advanceRejectReason,
            });
          }}
          submitting={rejectAdvanceMutation.isPending}
        />

        <DisburseAdvanceDialog
          open={disburseOpen}
          onOpenChange={setDisburseOpen}
          advance={selectedAdvance}
          data={disbursementData}
          setData={setDisbursementData}
          onConfirm={() => {
            if (!selectedAdvance) return;
            disburseMutation.mutate({
              advanceId: selectedAdvance.id,
              data: {
                disbursementMethod: disbursementData.method,
                referenceNumber: disbursementData.reference || undefined,
              },
            });
          }}
          submitting={disburseMutation.isPending}
        />

        {/* IMEI selection */}
        {currentIssuingItem && (
          <DeviceSelectionDialog
            open={showImeiDialog}
            onOpenChange={(v) => {
              setShowImeiDialog(v);
              if (!v) setCurrentIssuingItem(null);
            }}
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
              setShowImeiDialog(false);
              setCurrentIssuingItem(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default JobWorkflow;
