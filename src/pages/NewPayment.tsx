import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import ProcessPaymentDialog from "@/components/payments/ProcessPaymentDialog";
import { invoicesService } from "@/api/services/invoices.service";
import { customersService } from "@/api/services/customers.service";
import { toast } from "sonner";

const NewPayment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get('invoiceId');
  const amount = searchParams.get('amount');

  const [customerId, setCustomerId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoiceData = async () => {
      if (invoiceId) {
        try {
          const invoice = await invoicesService.getById(invoiceId);
          setCustomerId(invoice.customerId);
        } catch (error) {
          console.error("Failed to fetch invoice:", error);
          toast.error("Failed to load invoice data");
          navigate('/payments');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchInvoiceData();
  }, [invoiceId, navigate]);

  const handlePaymentProcessed = () => {
    navigate('/payments');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading payment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/payments')}
          className="w-fit"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Payments
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            New Payment
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Process customer payment and generate receipt
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Processing</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            {invoiceId 
              ? `Processing payment for invoice with amount ${amount ? `of ${amount}` : ''}`
              : "Select a customer and invoices to process payment"
            }
          </p>
          <ProcessPaymentDialog
            open={true}
            onOpenChange={(open) => {
              if (!open) navigate('/payments');
            }}
            customerId={customerId}
            preSelectedInvoiceId={invoiceId || undefined}
            onPaymentProcessed={handlePaymentProcessed}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default NewPayment;
