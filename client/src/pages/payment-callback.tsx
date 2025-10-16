import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";

type PaymentStatus = "processing" | "success" | "failed" | "pending";

export default function PaymentCallback() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<PaymentStatus>("processing");
  const [details, setDetails] = useState<{
    refno?: string;
    status_id?: string;
    billcode?: string;
    order_id?: string;
    amount?: string;
    reason?: string;
  }>({});

  useEffect(() => {
    // Parse query parameters from ToyyibPay redirect
    const params = new URLSearchParams(window.location.search);
    
    const paymentDetails = {
      refno: params.get("refno") || undefined,
      status_id: params.get("status_id") || params.get("status") || undefined,
      billcode: params.get("billcode") || undefined,
      order_id: params.get("order_id") || undefined,
      amount: params.get("amount") || undefined,
      reason: params.get("reason") || undefined,
    };
    
    setDetails(paymentDetails);
    
    // Determine status based on status_id
    // 1 = success, 2 = pending, 3 = failed
    if (paymentDetails.status_id === "1") {
      setStatus("success");
    } else if (paymentDetails.status_id === "2") {
      setStatus("pending");
    } else if (paymentDetails.status_id === "3") {
      setStatus("failed");
    } else {
      // If no status, still processing
      setStatus("processing");
    }
  }, []);

  const handleContinue = () => {
    if (status === "success") {
      // Redirect to dashboard or subscription page
      setLocation("/");
    } else {
      // Redirect back to pricing
      setLocation("/pricing");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader className="text-center">
          {status === "processing" && (
            <>
              <div className="flex justify-center mb-4">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
              </div>
              <CardTitle>Processing Payment...</CardTitle>
              <CardDescription>
                Please wait while we verify your payment.
              </CardDescription>
            </>
          )}
          
          {status === "success" && (
            <>
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
              <CardTitle className="text-green-600">Payment Successful!</CardTitle>
              <CardDescription>
                Thank you for your subscription. Your payment has been confirmed.
              </CardDescription>
            </>
          )}
          
          {status === "pending" && (
            <>
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-16 w-16 text-yellow-600" />
              </div>
              <CardTitle className="text-yellow-600">Payment Pending</CardTitle>
              <CardDescription>
                Your payment is being processed. We'll notify you once it's confirmed.
              </CardDescription>
            </>
          )}
          
          {status === "failed" && (
            <>
              <div className="flex justify-center mb-4">
                <XCircle className="h-16 w-16 text-destructive" />
              </div>
              <CardTitle className="text-destructive">Payment Failed</CardTitle>
              <CardDescription>
                {details.reason || "Your payment could not be processed. Please try again."}
              </CardDescription>
            </>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Payment Details */}
          {details.refno && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h3 className="font-semibold mb-2">Payment Details</h3>
              {details.refno && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reference:</span>
                  <span className="font-mono">{details.refno}</span>
                </div>
              )}
              {details.order_id && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order ID:</span>
                  <span className="font-mono">{details.order_id}</span>
                </div>
              )}
              {details.amount && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount:</span>
                  <span>RM{(parseInt(details.amount) / 100).toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Next Steps */}
          <div className="text-center space-y-4">
            {status === "success" && (
              <>
                <p className="text-sm text-muted-foreground">
                  Your subscription is now active. You can start using all premium features immediately.
                </p>
                <Button 
                  onClick={handleContinue} 
                  size="lg"
                  className="w-full md:w-auto"
                  data-testid="button-continue"
                >
                  Go to Dashboard
                </Button>
              </>
            )}
            
            {status === "pending" && (
              <>
                <p className="text-sm text-muted-foreground">
                  We'll send you an email once your payment is confirmed. 
                  This usually takes a few minutes.
                </p>
                <Button 
                  onClick={handleContinue} 
                  variant="outline"
                  size="lg"
                  className="w-full md:w-auto"
                  data-testid="button-continue"
                >
                  Back to Dashboard
                </Button>
              </>
            )}
            
            {status === "failed" && (
              <>
                <p className="text-sm text-muted-foreground">
                  You have not been charged. Please try again or contact support if the issue persists.
                </p>
                <div className="flex flex-col md:flex-row gap-2 justify-center">
                  <Button 
                    onClick={() => setLocation("/pricing")} 
                    size="lg"
                    data-testid="button-try-again"
                  >
                    Try Again
                  </Button>
                  <Button 
                    onClick={() => setLocation("/")} 
                    variant="outline"
                    size="lg"
                    data-testid="button-back-home"
                  >
                    Back to Home
                  </Button>
                </div>
              </>
            )}
            
            {status === "processing" && (
              <p className="text-sm text-muted-foreground">
                This should only take a moment...
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
