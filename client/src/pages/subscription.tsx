import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Crown, 
  Calendar, 
  CreditCard, 
  Package, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
  RefreshCw
} from "lucide-react";
import { formatDistanceToNow, differenceInDays, format } from "date-fns";
import { ms } from "date-fns/locale";

export default function Subscription() {
  const [, setLocation] = useLocation();

  // Fetch user data and subscription info
  const { data: userData } = useQuery<{ user: any }>({
    queryKey: ["/api/auth/me"],
  });

  const { data: subscriptions, isLoading } = useQuery<any[]>({
    queryKey: ["/api/user/subscriptions"],
    refetchInterval: 5000, // Auto-refresh every 5 seconds to catch new payments
  });

  const { data: planLimits } = useQuery({
    queryKey: ["/api/user/plan-limits"],
    refetchInterval: 5000, // Auto-refresh limits too
  });

  const user = userData?.user;
  const activeSubscription = subscriptions?.find((s: any) => s.status === "active");
  const isOnTrial = user?.isOnTrial === 1;
  const trialEndsAt = user?.trialEndsAt ? new Date(user.trialEndsAt) : null;
  const graceEndsAt = user?.graceEndsAt ? new Date(user.graceEndsAt) : null;

  // Calculate days remaining
  const getDaysRemaining = () => {
    if (activeSubscription) {
      const endsAt = new Date(activeSubscription.subscriptionEndsAt);
      return differenceInDays(endsAt, new Date());
    }
    if (trialEndsAt) {
      return differenceInDays(trialEndsAt, new Date());
    }
    if (graceEndsAt) {
      return differenceInDays(graceEndsAt, new Date());
    }
    return 0;
  };

  const daysRemaining = getDaysRemaining();
  const isExpiringSoon = daysRemaining <= 7;

  // Get current plan name
  const getPlanName = () => {
    if (activeSubscription) return activeSubscription.planName;
    if (isOnTrial) return "Free Trial";
    if (graceEndsAt) return "Grace Period";
    return "No Active Plan";
  };

  // Get plan color
  const getPlanColor = () => {
    const planName = getPlanName().toLowerCase();
    if (planName.includes("premium")) return "text-purple-600 bg-purple-100";
    if (planName.includes("pro")) return "text-blue-600 bg-blue-100";
    if (planName.includes("basic")) return "text-green-600 bg-green-100";
    return "text-gray-600 bg-gray-100";
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // BCL.my single-plan payment form URLs
  const BCL_SINGLE_PLAN_URL: Record<1|3|6|12, string> = {
    1: "https://bnidigital.bcl.my/form/1-bulan",
    3: "https://bnidigital.bcl.my/form/3-bulan",
    6: "https://bnidigital.bcl.my/form/6-bulan",
    12: "https://bnidigital.bcl.my/form/12-bulan",
  } as const;

  // Calculated prices per duration (whole MYR)
  const PRICES: Record<1|3|6|12, number> = {
    1: 27,
    3: 79,
    6: 146,
    12: 259,
  } as const;

  const handlePay = (months: 1|3|6|12) => {
    const url = BCL_SINGLE_PLAN_URL[months];
    if (!url) return;

    // If not logged in, redirect to register
    if (!user) {
      const params = new URLSearchParams({
        plan: 'standard',
        duration: months.toString(),
        returnTo: '/subscription',
      });
      setLocation(`/auth/register?${params.toString()}`);
      return;
    }

    // BCL.my doesn't support hidden fields or URL param persistence
    // User will need to enter their email manually in the form
    // Webhook will match by email to activate subscription
    window.location.href = url;
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Subscription</h1>
        <p className="text-muted-foreground">Urus langganan anda</p>
      </div>

      {/* Expiring Soon Alert */}
      {isExpiringSoon && daysRemaining > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="flex items-center gap-4 pt-6">
            <AlertCircle className="h-8 w-8 text-orange-600" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900">
                {isOnTrial ? "Trial Hampir Tamat" : "Langganan Hampir Tamat"}
              </h3>
              <p className="text-sm text-orange-700">
                {isOnTrial 
                  ? `Trial percuma anda akan tamat dalam ${daysRemaining} hari. Pilih pakej untuk teruskan.`
                  : `Langganan anda akan tamat dalam ${daysRemaining} hari. Renew sekarang.`
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl">{getPlanName()}</CardTitle>
                <CardDescription>
                  {activeSubscription 
                    ? `Bermula ${format(new Date(activeSubscription.subscriptionStartsAt), "dd MMM yyyy", { locale: ms })}`
                    : isOnTrial 
                      ? "Trial percuma 7 hari"
                      : "Tiada langganan aktif"
                  }
                </CardDescription>
              </div>
            </div>
            <Badge className={getPlanColor()}>
              {activeSubscription ? "Aktif" : isOnTrial ? "Trial" : graceEndsAt ? "Grace Period" : "Tidak Aktif"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Subscription Timeline */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {activeSubscription ? "Tempoh Langganan" : isOnTrial ? "Tempoh Trial" : "Grace Period"}
              </span>
              <span className="font-semibold">
                {daysRemaining > 0 ? `${daysRemaining} hari lagi` : "Tamat tempoh"}
              </span>
            </div>
            <Progress 
              value={daysRemaining > 0 ? Math.min((daysRemaining / (activeSubscription?.durationMonths * 30 || 14)) * 100, 100) : 0} 
              className="h-2"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {activeSubscription 
                  ? format(new Date(activeSubscription.subscriptionStartsAt), "dd MMM yyyy", { locale: ms })
                  : user?.createdAt ? format(new Date(user.createdAt), "dd MMM yyyy", { locale: ms }) : "-"
                }
              </span>
              <span>
                {activeSubscription 
                  ? format(new Date(activeSubscription.subscriptionEndsAt), "dd MMM yyyy", { locale: ms })
                  : trialEndsAt ? format(trialEndsAt, "dd MMM yyyy", { locale: ms }) 
                  : graceEndsAt ? format(graceEndsAt, "dd MMM yyyy", { locale: ms })
                  : "-"
                }
              </span>
            </div>
          </div>

          {/* Show extension notice if subscription was extended */}
          {activeSubscription?.previousSubscriptionId && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-green-900">Langganan Dipanjangkan</p>
                  <p className="text-green-700">
                    Tempoh langganan anda telah dilanjutkan sebanyak {activeSubscription.durationMonths} bulan. 
                    Terima kasih kerana terus menyokong PocketBizz!
                  </p>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Plan Features & Limits */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Package className="h-4 w-4" />
                Products
              </div>
              <div className="text-2xl font-bold">
                {planLimits?.products?.current || 0} / {planLimits?.products?.max >= 999999 ? "∞" : planLimits?.products?.max || 0}
              </div>
              <Progress 
                value={planLimits?.products?.max ? (planLimits.products.current / planLimits.products.max) * 100 : 0}
                className="h-1"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="h-4 w-4" />
                Stock Items
              </div>
              <div className="text-2xl font-bold">
                {planLimits?.stockItems?.current || 0} / {planLimits?.stockItems?.max >= 999999 ? "∞" : planLimits?.stockItems?.max || 0}
              </div>
              <Progress 
                value={planLimits?.stockItems?.max ? (planLimits.stockItems.current / planLimits.stockItems.max) * 100 : 0}
                className="h-1"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                Transactions
              </div>
              <div className="text-2xl font-bold">
                {planLimits?.transactions?.current || 0} / {planLimits?.transactions?.max >= 999999 ? "∞" : planLimits?.transactions?.max || 0}
              </div>
              <Progress 
                value={planLimits?.transactions?.max ? (planLimits.transactions.current / planLimits.transactions.max) * 100 : 0}
                className="h-1"
              />
            </div>
          </div>
        </CardContent>

        {!activeSubscription && (
          <CardFooter className="bg-muted/50 flex-col items-stretch gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              {isOnTrial 
                ? "Trial aktif. Pilih tempoh langganan untuk teruskan selepas trial tamat."
                : "Tiada langganan aktif. Pilih tempoh dan bayar untuk aktifkan akaun."
              }
            </div>

            {/* Quick duration options */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
              {[1,3,6,12].map((m) => {
                const savings = m === 3 ? "Jimat 3%" : m === 6 ? "Jimat 10%" : m === 12 ? "Jimat 20%" : null;
                return (
                  <Button
                    key={m}
                    variant={m === 12 ? "default" : "outline"}
                    className="w-full flex-col h-auto py-4 relative"
                    onClick={() => handlePay(m as 1|3|6|12)}
                  >
                    {savings && (
                      <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2">
                        {savings}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{m} Bulan</span>
                    <span className="text-xl font-bold mt-1">RM{PRICES[m as 1|3|6|12]}</span>
                    {m === 1 && <span className="text-xs text-muted-foreground mt-1">RM27/bulan</span>}
                    {m === 3 && <span className="text-xs text-muted-foreground mt-1">RM26/bulan</span>}
                    {m === 6 && <span className="text-xs text-muted-foreground mt-1">RM24/bulan</span>}
                    {m === 12 && <span className="text-xs text-muted-foreground mt-1">RM22/bulan</span>}
                  </Button>
                );
              })}
            </div>

            <div className="text-xs text-muted-foreground text-center w-full space-y-1">
              <p className="font-semibold text-orange-600">
                ⚠️ PENTING: Gunakan email yang sama ({user?.email}) semasa isi borang pembayaran
              </p>
              <p>Bayaran diproses melalui BCL.my. Akaun akan aktif automatik lepas pembayaran berjaya.</p>
            </div>
          </CardFooter>
        )}

        {activeSubscription && (
          <CardFooter className="flex gap-3">
            <Button 
              onClick={() => handlePay(activeSubscription.durationMonths as 1|3|6|12)} 
              variant="default"
              className="flex-1"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Renew ({activeSubscription.durationMonths} Bulan)
            </Button>
            <Button 
              onClick={() => setLocation("/settings")} 
              variant="outline"
            >
              Settings
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Subscription History */}
      {subscriptions && subscriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription History</CardTitle>
            <CardDescription>All your past and current subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subscriptions.map((subscription: any) => (
                <div 
                  key={subscription.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      subscription.status === "active" ? "bg-green-100" : "bg-gray-100"
                    }`}>
                      {subscription.status === "active" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold">{subscription.planName}</div>
                      <div className="text-sm text-muted-foreground">
                        {subscription.durationMonths} months • 
                        {format(new Date(subscription.subscriptionStartsAt), " dd MMM yyyy")} - 
                        {format(new Date(subscription.subscriptionEndsAt), " dd MMM yyyy")}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">RM {subscription.totalPaid}</div>
                    <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                      {subscription.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing Information */}
      {activeSubscription && (
        <Card>
          <CardHeader>
            <CardTitle>Billing Information</CardTitle>
            <CardDescription>Payment details for your current subscription</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Payment Method</div>
                <div className="font-semibold">{activeSubscription.paymentMethod || "N/A"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Payment Provider</div>
                <div className="font-semibold capitalize">
                  {activeSubscription.paymentProvider?.replace("_", " ") || "N/A"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Transaction ID</div>
                <div className="font-mono text-sm">{activeSubscription.externalTransactionId || "N/A"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Amount Paid</div>
                <div className="font-bold text-lg">RM {activeSubscription.totalPaid}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
