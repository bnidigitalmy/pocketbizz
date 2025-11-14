import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const [countdown, setCountdown] = useState(5);

  // Get query params
  const urlParams = new URLSearchParams(window.location.search);
  const orderNumber = urlParams.get("order") || urlParams.get("order_number");
  const amount = urlParams.get("amount");

  // Check subscription status
  const { data: subscriptions, isLoading } = useQuery<any[]>({
    queryKey: ["/api/user/subscriptions"],
    refetchInterval: 2000, // Poll every 2 seconds for first 30 seconds
    refetchIntervalInBackground: false,
  });

  const activeSubscription = subscriptions?.find((s: any) => s.status === "active");

  // Auto redirect countdown
  useEffect(() => {
    if (activeSubscription && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (activeSubscription && countdown === 0) {
      setLocation("/subscription");
    }
  }, [countdown, activeSubscription, setLocation]);

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-green-900">
            Pembayaran Berjaya!
          </CardTitle>
          <CardDescription className="text-green-700">
            Terima kasih atas pembayaran anda
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Payment Details */}
          <div className="bg-white rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-sm text-gray-600">Maklumat Pembayaran</h3>
            {orderNumber && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Order Number:</span>
                <span className="font-mono font-semibold">{orderNumber}</span>
              </div>
            )}
            {amount && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Jumlah Dibayar:</span>
                <span className="font-bold text-green-600">RM {amount}</span>
              </div>
            )}
          </div>

          {/* Activation Status */}
          <div className="bg-white rounded-lg p-4">
            {isLoading ? (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Sedang mengaktifkan akaun anda...</span>
              </div>
            ) : activeSubscription ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">Akaun Telah Diaktifkan!</span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Langganan: <span className="font-semibold">{activeSubscription.planName}</span></p>
                  <p>Tempoh: <span className="font-semibold">{activeSubscription.durationMonths} bulan</span></p>
                </div>
                <div className="text-xs text-gray-500">
                  Redirect ke Subscription dalam {countdown} saat...
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menunggu pengesahan pembayaran...</span>
                </div>
                <p className="text-xs text-gray-500">
                  Sistem sedang memproses pembayaran anda. Ini mungkin mengambil masa 1-2 minit.
                  Akaun anda akan diaktifkan secara automatik.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => setLocation("/subscription")}
              className="flex-1"
              variant={activeSubscription ? "default" : "outline"}
            >
              {activeSubscription ? "Lihat Subscription" : "Semak Status"}
            </Button>
            <Button
              onClick={() => setLocation("/dashboard")}
              variant="outline"
              className="flex-1"
            >
              Ke Dashboard
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-center text-xs text-gray-500 space-y-1">
            <p>
              Jika akaun anda tidak diaktifkan dalam 5 minit, sila hubungi support.
            </p>
            <p className="font-mono text-gray-400">
              Ref: {orderNumber || "N/A"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
