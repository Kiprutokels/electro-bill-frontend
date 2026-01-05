import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Eye,
  Loader2,
} from 'lucide-react';
import { processingFeesService } from '@/api/services/processing-fees.service';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/lib/utils';

const ProcessingFees = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [settleDialogOpen, setSettleDialogOpen] = useState(false);
  const [settlementData, setSettlementData] = useState({
    periodStart: '',
    periodEnd: '',
    notes: '',
  });
  const [selectedSettlement, setSelectedSettlement] = useState<string | null>(null);

  // Queries
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['processing-fees-stats'],
    queryFn: () => processingFeesService.getDashboardStats(),
  });

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['processing-fees-pending'],
    queryFn: () => processingFeesService.getPendingSummary(),
    enabled: activeTab === 'pending',
  });

  const { data: allFeesData, isLoading: allFeesLoading } = useQuery({
    queryKey: ['processing-fees-all'],
    queryFn: () => processingFeesService.getAllFees({ limit: 100 }),
    enabled: activeTab === 'all',
  });

  const { data: settlementsData, isLoading: settlementsLoading } = useQuery({
    queryKey: ['processing-fees-settlements'],
    queryFn: () => processingFeesService.getAllSettlements(),
    enabled: activeTab === 'settlements',
  });

  const { data: settlementDetails } = useQuery({
    queryKey: ['processing-fee-settlement', selectedSettlement],
    queryFn: () => processingFeesService.getSettlementById(selectedSettlement!),
    enabled: !!selectedSettlement,
  });

  // Mutation
  const settleMutation = useMutation({
    mutationFn: processingFeesService.settleFees,
    onSuccess: () => {
      toast.success('Fees settled successfully');
      setSettleDialogOpen(false);
      setSettlementData({ periodStart: '', periodEnd: '', notes: '' });
      queryClient.invalidateQueries({ queryKey: ['processing-fees-stats'] });
      queryClient.invalidateQueries({ queryKey: ['processing-fees-pending'] });
      queryClient.invalidateQueries({ queryKey: ['processing-fees-settlements'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to settle fees');
    },
  });

  const handleSettle = () => {
    if (!settlementData.periodStart || !settlementData.periodEnd) {
      toast.error('Please select period start and end dates');
      return;
    }
    settleMutation.mutate(settlementData);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Processing Fees</h1>
          <p className="text-muted-foreground">
            Track and manage transaction processing fees
          </p>
        </div>
        <Button onClick={() => setSettleDialogOpen(true)} disabled={!stats?.pending.count}>
          <DollarSign className="mr-2 h-4 w-4" />
          Settle Pending Fees
        </Button>
      </div>

      {/* Stats Cards */}
      {statsLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Fees</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(stats?.pending.totalFees || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.pending.count || 0} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cleared Fees</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats?.cleared.totalFees || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.cleared.count || 0} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats?.thisMonth.totalFees || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.thisMonth.count || 0} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(
                  (stats?.pending.totalFees || 0) + (stats?.cleared.totalFees || 0)
                )}
              </div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Pending ({stats?.pending.count || 0})
          </TabsTrigger>
          <TabsTrigger value="settlements">
            Settlements
          </TabsTrigger>
          <TabsTrigger value="all">All Transactions</TabsTrigger>
        </TabsList>

        {/* Pending Fees Tab */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pending Processing Fees</CardTitle>
                {pendingData?.summary && (
                  <div className="text-right">
                    <p className="text-2xl font-bold text-yellow-600">
                      {formatCurrency(pendingData.summary.totalFeeAmount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {pendingData.summary.transactionCount} transactions
                    </p>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {pendingLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : !pendingData?.transactions.length ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <p className="text-lg font-medium">All Caught Up!</p>
                  <p className="text-muted-foreground">No pending fees to settle</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Receipt #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Transaction</TableHead>
                      <TableHead className="text-right">Fee Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingData.transactions.map((fee: any) => (
                      <TableRow key={fee.id}>
                        <TableCell>{formatDate(fee.transactionDate)}</TableCell>
                        <TableCell className="font-mono">
                          {fee.receipt.receiptNumber}
                        </TableCell>
                        <TableCell>
                          {fee.customer.businessName || fee.customer.contactPerson}
                          <span className="block text-sm text-muted-foreground">
                            {fee.customer.customerCode}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(fee.transactionAmount)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-yellow-600">
                          {formatCurrency(fee.feeAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settlements Tab */}
        <TabsContent value="settlements">
          <Card>
            <CardHeader>
              <CardTitle>Settlement History</CardTitle>
            </CardHeader>
            <CardContent>
              {settlementsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : !settlementsData?.data.length ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No settlements yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Settlement #</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-center">Transactions</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                      <TableHead>Settled By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settlementsData.data.map((settlement: any) => (
                      <TableRow key={settlement.id}>
                        <TableCell className="font-mono font-medium">
                          {settlement.settlementNumber}
                        </TableCell>
                        <TableCell>
                          {formatDate(settlement.periodStart)} -{' '}
                          {formatDate(settlement.periodEnd)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            {settlement.transactionCount}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(settlement.totalFeeAmount)}
                        </TableCell>
                        <TableCell>
                          {settlement.settledByUser.firstName}{' '}
                          {settlement.settledByUser.lastName}
                        </TableCell>
                        <TableCell>{formatDate(settlement.settledAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedSettlement(settlement.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Transactions Tab */}
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Fee Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {allFeesLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Receipt #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Transaction</TableHead>
                      <TableHead className="text-right">Fee</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allFeesData?.data.map((fee: any) => (
                      <TableRow key={fee.id}>
                        <TableCell>{formatDate(fee.transactionDate)}</TableCell>
                        <TableCell className="font-mono">
                          {fee.receipt.receiptNumber}
                        </TableCell>
                        <TableCell>
                          {fee.customer.businessName || fee.customer.contactPerson}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(fee.transactionAmount)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(fee.feeAmount)}
                        </TableCell>
                        <TableCell>
                          {fee.isCleared ? (
                            <Badge className="bg-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Cleared
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-600">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Settlement Dialog */}
      <Dialog open={settleDialogOpen} onOpenChange={setSettleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Settle Pending Fees</DialogTitle>
            <DialogDescription>
              Create a settlement batch for pending processing fees
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="periodStart">Period Start</Label>
              <Input
                id="periodStart"
                type="date"
                value={settlementData.periodStart}
                onChange={(e) =>
                  setSettlementData({ ...settlementData, periodStart: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="periodEnd">Period End</Label>
              <Input
                id="periodEnd"
                type="date"
                value={settlementData.periodEnd}
                onChange={(e) =>
                  setSettlementData({ ...settlementData, periodEnd: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Enter settlement notes..."
                value={settlementData.notes}
                onChange={(e) =>
                  setSettlementData({ ...settlementData, notes: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSettleDialogOpen(false)}
              disabled={settleMutation.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleSettle} disabled={settleMutation.isPending}>
              {settleMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Settle Fees
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settlement Details Dialog */}
      <Dialog
        open={!!selectedSettlement}
        onOpenChange={() => setSelectedSettlement(null)}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Settlement Details</DialogTitle>
          </DialogHeader>
          {settlementDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Settlement Number</p>
                  <p className="font-mono font-medium">
                    {settlementDetails.settlementNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(settlementDetails.totalFeeAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Period</p>
                  <p>
                    {formatDate(settlementDetails.periodStart)} -{' '}
                    {formatDate(settlementDetails.periodEnd)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Settled By</p>
                  <p>
                    {settlementDetails.settledByUser.firstName}{' '}
                    {settlementDetails.settledByUser.lastName}
                  </p>
                </div>
              </div>

              {settlementDetails.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">{settlementDetails.notes}</p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">
                  Transactions ({settlementDetails.transactions.length})
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Receipt</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Fee</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settlementDetails.transactions.map((txn: any) => (
                      <TableRow key={txn.id}>
                        <TableCell>{formatDate(txn.transactionDate)}</TableCell>
                        <TableCell className="font-mono">
                          {txn.receipt.receiptNumber}
                        </TableCell>
                        <TableCell>
                          {txn.customer.businessName || txn.customer.contactPerson}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(txn.feeAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProcessingFees;
