import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  Send,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS } from "@/utils/constants";
import {
  smsService,
  SmsLog,
  SmsStats,
  SendSmsRequest,
} from "@/api/services/sms.service";
import { useToast } from "@/hooks/use-toast";

const smsSchema = z.object({
  mobile: z
    .string()
    .min(1, "Phone number required")
    .regex(/^(07|254)[0-9]{8,9}$/, "Use format: 07XXXXXXXX or 254XXXXXXXX"),
  message: z
    .string()
    .min(1, "Message required")
    .max(160, "SMS limited to 160 characters"),
  messageType: z.string().default("manual"),
});

type SmsFormData = z.infer<typeof smsSchema>;

const SmsManagement = () => {
  const { hasPermission } = useAuth();
  const { toast } = useToast();

  // State
  const [activeTab, setActiveTab] = useState("send");
  const [balance, setBalance] = useState<number | null>(null);
  const [stats, setStats] = useState<SmsStats | null>(null);
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsMeta, setLogsMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sending, setSending] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Form
  const form = useForm<SmsFormData>({
    resolver: zodResolver(smsSchema),
    defaultValues: {
      mobile: "",
      message: "",
      messageType: "manual",
    },
  });

  // Load initial data
  useEffect(() => {
    if (hasPermission(PERMISSIONS.SMS_READ)) {
      loadBalance();
      loadStats();
      loadLogs();
    }
  }, []);

  // Load balance
  const loadBalance = async () => {
    try {
      setBalanceLoading(true);
      const data = await smsService.checkBalance();
      setBalance(data.balance);
    } catch (error: any) {
      toast({
        title: "Failed to load balance",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setBalanceLoading(false);
    }
  };

  // Load stats
  const loadStats = async () => {
    try {
      const data = await smsService.getStats();
      setStats(data);
    } catch (error: any) {
      console.error("Failed to load SMS stats", error);
    }
  };

  // Load logs
  const loadLogs = async (page = 1, status = statusFilter) => {
    try {
      setLogsLoading(true);
      const params: any = { page, limit: 10 };
      if (status !== "ALL") params.status = status;

      const response = await smsService.getLogs(params);
      setLogs(response.data);
      setLogsMeta(response.meta);
    } catch (error: any) {
      toast({
        title: "Failed to load logs",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLogsLoading(false);
    }
  };

  // Handle status filter change
  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    loadLogs(1, status);
  };

  const onSendSms = async (data: SmsFormData) => {
    try {
      setSending(true);

      const payload: SendSmsRequest = {
        mobile: data.mobile,
        message: data.message,
        messageType: data.messageType,
      };

      const result = await smsService.send(payload);

      if (result.success) {
        toast({
          title: "SMS Sent Successfully",
          description: `Message sent to ${result.recipient}`,
        });
        form.reset();
        loadBalance();
        loadStats();
        loadLogs();
      } else {
        toast({
          title: "SMS Send Failed",
          description: result.statusMessage,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send SMS",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  // Handle test SMS
  const handleTestSms = async () => {
    const testNumber = form.watch("mobile");
    if (!testNumber) {
      toast({
        title: "Phone number required",
        description: "Enter a phone number first",
        variant: "destructive",
      });
      return;
    }

    try {
      setSending(true);
      const result = await smsService.test(testNumber);

      if (result.success) {
        toast({
          title: "Test SMS Sent",
          description: `Test message sent to ${result.recipient}`,
        });
        loadBalance();
        loadStats();
        loadLogs();
      } else {
        toast({
          title: "Test Failed",
          description: result.statusMessage,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Test failed",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  // Permission check
  if (!hasPermission(PERMISSIONS.SMS_READ)) {
    return (
      <div className="p-4 sm:p-6">
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>You don't have permission to access SMS management.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const charCount = form.watch("message")?.length || 0;

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">SMS Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Send SMS, monitor delivery, and track usage
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadBalance}
          disabled={balanceLoading}
        >
          {balanceLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh Balance
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SMS Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {balance !== null ? `KES ${balance.toFixed(2)}` : "—"}
            </div>
            <p className="text-xs text-muted-foreground">Available credit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.sent || 0}
            </div>
            <p className="text-xs text-muted-foreground">Successfully sent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.failed || 0}
            </div>
            <p className="text-xs text-muted-foreground">Delivery failed</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="send">
            <Send className="h-4 w-4 mr-2" />
            Send SMS
          </TabsTrigger>
          <TabsTrigger value="logs">
            <Clock className="h-4 w-4 mr-2" />
            SMS Logs
          </TabsTrigger>
        </TabsList>

        {/* Send SMS Tab */}
        <TabsContent value="send" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send SMS</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSendSms)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="mobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="0712345678 or 254712345678"
                            {...field}
                            disabled={!hasPermission(PERMISSIONS.SMS_SEND)}
                          />
                        </FormControl>
                        <FormDescription>
                          Format: 07XXXXXXXX or 254XXXXXXXX
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter your SMS message here..."
                            rows={5}
                            {...field}
                            disabled={!hasPermission(PERMISSIONS.SMS_SEND)}
                          />
                        </FormControl>
                        <FormDescription className="flex items-center justify-between">
                          <span>Max 160 characters</span>
                          <span
                            className={
                              charCount > 160 ? "text-destructive font-medium" : ""
                            }
                          >
                            {charCount}/160
                          </span>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {hasPermission(PERMISSIONS.SMS_SEND) && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        type="submit"
                        disabled={sending || charCount > 160}
                        className="flex-1"
                      >
                        {sending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Send SMS
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleTestSms}
                        disabled={sending || !form.watch("mobile")}
                      >
                        <AlertCircle className="mr-2 h-4 w-4" />
                        Send Test
                      </Button>
                    </div>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle>SMS Logs</CardTitle>
                <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="SENT">Sent</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No SMS logs found</p>
                </div>
              ) : (
                <>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Recipient</TableHead>
                          <TableHead>Message</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Sent At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-medium">
                              {log.recipient}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {log.message}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  log.status === "SENT"
                                    ? "default"
                                    : log.status === "FAILED"
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {log.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="capitalize">
                              {log.messageType.replace("_", " ")}
                            </TableCell>
                            <TableCell>
                              {log.sentAt
                                ? new Date(log.sentAt).toLocaleString()
                                : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {logsMeta.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Page {logsMeta.page} of {logsMeta.totalPages} ({logsMeta.total}{" "}
                        total)
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={logsMeta.page === 1}
                          onClick={() => loadLogs(logsMeta.page - 1, statusFilter)}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={logsMeta.page === logsMeta.totalPages}
                          onClick={() => loadLogs(logsMeta.page + 1, statusFilter)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SmsManagement;
