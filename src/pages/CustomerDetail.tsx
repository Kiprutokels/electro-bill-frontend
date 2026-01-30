import { Link, useParams } from "react-router-dom";
import { useCustomerDetail } from "@/hooks/useCustomerDetail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  RefreshCw,
  ArrowLeft,
  Car,
  Calendar,
  FileText,
  Receipt,
  Wallet,
  ClipboardList,
  PhoneCall,
  AlertTriangle,
  Plus,
  Ticket,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/utils/format.utils";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { crmFollowupsService } from "@/api/services/crm-followups.service";
import { ticketsService } from "@/api/services/tickets.service";
import { crmInteractionsService } from "@/api/services/crm-interactions.service";
import { toast } from "sonner";

const CustomerDetail = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const { data, loading, error, refresh } = useCustomerDetail(customerId || "");
  const [refreshing, setRefreshing] = useState(false);

  // ==================== CRM INTEGRATION ====================
  const crmFollowups = useQuery({
    queryKey: ["crm-followups-customer", customerId],
    queryFn: () => crmFollowupsService.list({ customerId, limit: 10, status: "PENDING" }),
    enabled: !!customerId,
  });

  const crmInteractions = useQuery({
    queryKey: ["crm-interactions-customer", customerId],
    queryFn: () => crmInteractionsService.list({ customerId, limit: 10 }),
    enabled: !!customerId,
  });

  const crmTickets = useQuery({
    queryKey: ["tickets-customer", customerId],
    queryFn: () => ticketsService.list({ customerId, limit: 10 }),
    enabled: !!customerId,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
      crmFollowups.refetch();
      crmInteractions.refetch();
      crmTickets.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading customer detail...
          </p>
        </div>
      </div>
    );
  }

  const customer = data?.customer;
  const name =
    customer?.businessName ||
    customer?.contactPerson ||
    customer?.customerCode ||
    "Customer";

  const followups = crmFollowups.data?.data || [];
  const interactions = crmInteractions.data?.data || [];
  const tickets = crmTickets.data?.data || [];

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link to="/customers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Comprehensive customer view: vehicles, subscriptions, invoices,
              payments, transactions, **CRM activities**
            </p>
          </div>
        </div>

        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {data && customer && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Wallet className="h-4 w-4" /> Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(Number(data.financials.currentBalance))}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Credit Limit:{" "}
                  {formatCurrency(Number(data.financials.creditLimit))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Invoiced
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(Number(data.financials.totalInvoiced))}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Paid: {formatCurrency(Number(data.financials.totalPaid))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Outstanding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(Number(data.financials.totalOutstanding))}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Invoices: {data.totals.invoices} • Receipts:{" "}
                  {data.totals.receipts}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Assets
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div>
                  Vehicles: <strong>{data.totals.vehicles}</strong>
                </div>
                <div>
                  Subscriptions: <strong>{data.totals.subscriptions}</strong>
                </div>
                <div>
                  Transactions: <strong>{data.totals.transactions}</strong>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customer profile */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Customer Profile</CardTitle>
              <Badge variant={customer.isActive ? "default" : "destructive"}>
                {customer.isActive ? "ACTIVE" : "INACTIVE"}
              </Badge>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Customer Code</div>
                <div className="font-medium">{customer.customerCode}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Email</div>
                <div className="font-medium">{customer.email || "N/A"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Phone</div>
                <div className="font-medium">{customer.phone}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Tax Number</div>
                <div className="font-medium">{customer.taxNumber || "N/A"}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-muted-foreground">Address</div>
                <div className="font-medium">
                  {[
                    customer.addressLine1,
                    customer.addressLine2,
                    customer.city,
                    customer.country,
                  ]
                    .filter(Boolean)
                    .join(", ") || "N/A"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ==================== ✅ CRM SECTION ==================== */}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* CRM Follow-ups */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardList className="h-4 w-4" /> Follow-ups
                </CardTitle>
                <Badge variant="outline">{followups.length}</Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                {followups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pending follow-ups.</p>
                ) : (
                  followups.map((f: any) => (
                    <div key={f.id} className="border rounded-md p-2">
                      <div className="text-sm font-medium">{f.title}</div>
                      <div className="text-xs text-muted-foreground">
                        Due: {formatDate(f.dueDate)} • {f.status} • {f.priority}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Sub: {f.subscription?.subscriptionNumber || "—"}
                      </div>
                    </div>
                  ))
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    // Navigate to create follow-up with prefilled customerId
                    window.location.href = `/crm/followups?prefill=${customerId}`;
                  }}
                >
                  <Plus className="h-3 w-3 mr-2" /> New Follow-up
                </Button>
              </CardContent>
            </Card>

            {/* CRM Interactions */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <PhoneCall className="h-4 w-4" /> Interactions
                </CardTitle>
                <Badge variant="outline">{interactions.length}</Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                {interactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No interactions yet.</p>
                ) : (
                  interactions.map((i: any) => (
                    <div key={i.id} className="border rounded-md p-2">
                      <div className="text-xs text-muted-foreground">
                        {formatDate(i.interactionDate)} • {i.interactionType}
                      </div>
                      <div className="text-sm">{i.notes.slice(0, 80)}...</div>
                    </div>
                  ))
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    window.location.href = `/crm/interactions?prefill=${customerId}`;
                  }}
                >
                  <Plus className="h-3 w-3 mr-2" /> Log Interaction
                </Button>
              </CardContent>
            </Card>

            {/* Tickets */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Ticket className="h-4 w-4" /> Tickets
                </CardTitle>
                <Badge variant="outline">{tickets.length}</Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                {tickets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No open tickets.</p>
                ) : (
                  tickets.map((t: any) => (
                    <div key={t.id} className="border rounded-md p-2">
                      <div className="font-mono text-xs">{t.ticketNumber}</div>
                      <div className="text-sm font-medium">{t.subject}</div>
                      <div className="text-xs text-muted-foreground">
                        {t.status} • {t.priority}
                        {t.slaBreached && (
                          <span className="text-red-600 font-semibold ml-2">SLA BREACHED</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    window.location.href = `/tickets?prefill=${customerId}`;
                  }}
                >
                  <Plus className="h-3 w-3 mr-2" /> New Ticket
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Vehicles */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" /> Vehicles
              </CardTitle>
              <Badge variant="outline">{data.vehicles.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.vehicles.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No vehicles found.
                </p>
              ) : (
                data.vehicles.map((v) => (
                  <div
                    key={v.id}
                    className="border rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                  >
                    <div>
                      <div className="font-medium">{v.vehicleReg}</div>
                      <div className="text-sm text-muted-foreground">
                        {v.make} {v.model} • Chassis: {v.chassisNo}
                      </div>
                    </div>
                    <Badge variant={v.isActive ? "default" : "secondary"}>
                      {v.isActive ? "ACTIVE" : "INACTIVE"}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Subscriptions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" /> Subscriptions
              </CardTitle>
              <Badge variant="outline">{data.subscriptions.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.subscriptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No subscriptions found.
                </p>
              ) : (
                data.subscriptions.map((s) => (
                  <div key={s.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <div className="font-mono font-medium">
                          {s.subscriptionNumber}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {s.product?.name} ({s.product?.sku})
                        </div>
                        <div className="text-sm">
                          Start: {formatDate(s.startDate)} • Expiry:{" "}
                          {formatDate(s.expiryDate)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Fee:{" "}
                          {formatCurrency(
                            Number(s.product?.subscriptionFee || 0)
                          )}
                        </div>
                      </div>
                      <Badge variant="outline">{s.status}</Badge>
                    </div>

                    {Array.isArray(s.renewals) && s.renewals.length > 0 && (
                      <div className="border-t pt-2">
                        <div className="text-sm font-medium mb-1">
                          Renewal History
                        </div>
                        {s.renewals.slice(0, 5).map((r) => (
                          <div
                            key={r.id}
                            className="text-sm text-muted-foreground flex flex-col sm:flex-row sm:justify-between"
                          >
                            <span>
                              {formatDate(r.paidAt)} •{" "}
                              {formatCurrency(Number(r.amount))} •{" "}
                              {formatDate(r.startDate)} →{" "}
                              {formatDate(r.expiryDate)}
                            </span>
                            <span>
                              Invoice: {r.invoice?.invoiceNumber} (
                              {r.invoice?.status})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Invoices */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> Invoices (latest)
              </CardTitle>
              <Badge variant="outline">{data.invoices.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No invoices found.
                </p>
              ) : (
                data.invoices.slice(0, 10).map((inv: any) => (
                  <div
                    key={inv.id}
                    className="border rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                  >
                    <div>
                      <div className="font-mono font-medium">
                        {inv.invoiceNumber}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(inv.invoiceDate)} • Due{" "}
                        {formatDate(inv.dueDate)}
                      </div>
                      <div className="text-sm">
                        Total: {formatCurrency(Number(inv.totalAmount))} • Paid:{" "}
                        {formatCurrency(Number(inv.amountPaid))}
                      </div>
                      {inv.job?.jobNumber && (
                        <div className="text-sm text-muted-foreground">
                          Job: {inv.job.jobNumber}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline">{inv.status}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Receipts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" /> Receipts (latest)
              </CardTitle>
              <Badge variant="outline">{data.receipts.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.receipts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No receipts found.
                </p>
              ) : (
                data.receipts.slice(0, 10).map((r: any) => (
                  <div key={r.id} className="border rounded-lg p-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <div className="font-mono font-medium">
                          {r.receiptNumber}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(r.paymentDate)} • {r.paymentMethod?.name}
                        </div>
                      </div>
                      <div className="font-medium">
                        {formatCurrency(Number(r.totalAmount))}
                      </div>
                    </div>
                    {Array.isArray(r.items) && r.items.length > 0 && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        Applied to:{" "}
                        {r.items
                          .map((it: any) => it.invoice?.invoiceNumber)
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default CustomerDetail;
