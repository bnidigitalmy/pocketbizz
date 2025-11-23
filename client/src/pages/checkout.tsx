import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Check, Tag, ArrowLeft, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type SubscriptionPlan = {
  id: string;
  name: string;
  displayName: string;
  description: string;
  monthlyPrice: string;
  discount6Months: string | null;
  discount12Months: string | null;
  currency: string;
  features: string[];
  maxUsers: number;
  maxProducts: number;
};

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  
  // Get query params
  const params = new URLSearchParams(window.location.search);
  const planId = params.get("planId");
  const planName = params.get("planName");
  const duration = parseInt(params.get("duration") || "6") as 3 | 6 | 12;
  const isRenewal = params.get("renew") === "true";

  // Fetch plan details
  const { data: plans, isLoading: isPlanLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
    enabled: !!planId,
  });
  
  // Fetch user's early bird status
  const { data: earlyBirdData } = useQuery<{ hasSlot: boolean; slotNumber: number | null; hasSubscribed: boolean }>({
    queryKey: ["/api/auth/early-bird-status"],
  });
  
  const plan = plans?.find(p => p.id === planId);
  const hasEarlyBird = earlyBirdData?.hasSlot || false;

  // Create bill mutation (handles both new subscriptions and renewals)
  const createBillMutation = useMutation({
    mutationFn: async (data: { planId: string; durationMonths: number; promoCode?: string }) => {
      // Use renewal endpoint if this is a renewal
      const endpoint = isRenewal ? "/api/subscription/renew" : "/api/subscription/create-bill";
      
      const response = await apiRequest("POST", endpoint, data);
      
      // Parse JSON response
      const json = await response.json();
      return json as {
        billCode: string;
        billUrl: string;
        orderRef: string;
        totalAmount: number;
        planName: string;
        durationMonths: number;
        isRenewal?: boolean;
        subscriptionId?: string;
        promoApplied: any;
      };
    },
    onSuccess: (data: any) => {
      // Redirect to ToyyibPay payment page
      window.location.href = data.billUrl;
    },
    onError: (error: any) => {
      toast({
        title: "Ralat Pembayaran",
        description: error.message || "Gagal membuat bil pembayaran. Sila cuba lagi.",
        variant: "destructive",
      });
    },
  });

  // Calculate price (matches backend calculation)
  const calculatePrice = () => {
    if (!plan) return 0;
    
    const monthlyPrice = parseFloat(plan.monthlyPrice);
    let totalPrice = monthlyPrice * duration;
    
    // Apply duration discount
    if (duration === 6 && plan.discount6Months) {
      const discount = parseFloat(plan.discount6Months);
      totalPrice = totalPrice * (1 - discount / 100);
    } else if (duration === 12 && plan.discount12Months) {
      const discount = parseFloat(plan.discount12Months);
      totalPrice = totalPrice * (1 - discount / 100);
    }
    
    // Apply early bird discount (70% off for first 100 signups)
    if (hasEarlyBird && earlyBirdData && !earlyBirdData.hasSubscribed) {
      totalPrice = totalPrice * (1 - 70 / 100);
    }
    
    // Apply promo code discount if available
    if (appliedPromo) {
      if (appliedPromo.discountType === 'percentage') {
        totalPrice = totalPrice * (1 - parseFloat(appliedPromo.discountValue) / 100);
      } else {
        totalPrice = totalPrice - parseFloat(appliedPromo.discountValue);
      }
    }
    
    return Math.max(totalPrice, 1);
  };

  const handleApplyPromo = () => {
    if (!promoCode.trim()) return;
    
    // For now, simulate promo code validation
    // In reality, this would be validated server-side when creating the bill
    setAppliedPromo({
      code: promoCode,
      discountType: 'percentage',
      discountValue: '10',
    });
    
    toast({
      title: "Kod Promo Diguna",
      description: `Anda jimat 10% dengan kod ${promoCode}!`,
    });
  };

  const handleCheckout = () => {
    if (!plan) return;
    
    createBillMutation.mutate({
      planId: plan.id,
      durationMonths: duration,
      promoCode: appliedPromo?.code,
    });
  };

  if (isPlanLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Pelan tidak dijumpai. Sila pilih pelan dari halaman harga.</p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => setLocation("/pricing")} data-testid="button-back-pricing">
                Ke Halaman Harga
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPrice = calculatePrice();
  const monthlyEquivalent = (totalPrice / duration).toFixed(2);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => setLocation("/pricing")}
        className="mb-6"
        data-testid="button-back"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali ke Harga
      </Button>

      {/* Early Bird Banner */}
      {hasEarlyBird && earlyBirdData && !earlyBirdData.hasSubscribed && (
        <div className="bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-xl p-4 mb-6 border-2 border-primary" data-testid="banner-early-bird-checkout">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <p className="text-center font-semibold">
              Tahniah! Anda layak untuk <span className="text-primary text-xl">70% OFF</span> sebagai Early Bird #{earlyBirdData.slotNumber}
            </p>
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Order Summary */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Pesanan</CardTitle>
              <CardDescription>Semak butiran langganan anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Plan Details */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Pelan {plan.displayName}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <Badge variant="secondary">{duration} bulan</Badge>
              </div>

              <Separator />

              {/* Features */}
              <div>
                <h4 className="font-medium mb-3">Ciri-ciri Termasuk:</h4>
                <ul className="space-y-2">
                  {(typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features).slice(0, 5).map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              {/* Promo Code */}
              <div className="space-y-2">
                <Label htmlFor="promo-code">Kod Promo (Pilihan)</Label>
                <div className="flex gap-2">
                  <Input
                    id="promo-code"
                    placeholder="Masukkan kod promo"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    disabled={!!appliedPromo || createBillMutation.isPending}
                    data-testid="input-promo-code"
                  />
                  {!appliedPromo ? (
                    <Button
                      onClick={handleApplyPromo}
                      disabled={!promoCode.trim() || createBillMutation.isPending}
                      data-testid="button-apply-promo"
                    >
                      <Tag className="mr-2 h-4 w-4" />
                      Guna
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAppliedPromo(null);
                        setPromoCode("");
                      }}
                      data-testid="button-remove-promo"
                    >
                      Buang
                    </Button>
                  )}
                </div>
                {appliedPromo && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <Check className="h-4 w-4" />
                    Kod promo "{appliedPromo.code}" telah diguna!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Price Breakdown */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Butiran Harga</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Harga Bulanan</span>
                <span>RM{plan.monthlyPrice}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Tempoh</span>
                <span>{duration} bulan</span>
              </div>

              {(duration === 6 || duration === 12) && (
                <div className="flex justify-between text-green-600">
                  <span>Diskaun Tempoh</span>
                  <span>-{duration === 6 ? '10' : '20'}%</span>
                </div>
              )}

              {hasEarlyBird && earlyBirdData && !earlyBirdData.hasSubscribed && (
                <div className="flex justify-between text-primary font-semibold">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-4 w-4" />
                    Early Bird Diskaun
                  </span>
                  <span>-70%</span>
                </div>
              )}

              {appliedPromo && (
                <div className="flex justify-between text-green-600">
                  <span>Diskaun Promo</span>
                  <span>-{appliedPromo.discountValue}{appliedPromo.discountType === 'percentage' ? '%' : ' RM'}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Jumlah</span>
                <span data-testid="text-total-price">RM{totalPrice.toFixed(2)}</span>
              </div>

              <div className="text-sm text-muted-foreground text-center">
                RM{monthlyEquivalent}/bulan setara
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={createBillMutation.isPending}
                data-testid="button-proceed-payment"
              >
                {createBillMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Membuat pembayaran...
                  </>
                ) : (
                  "Teruskan Pembayaran"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
