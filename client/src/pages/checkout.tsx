import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Check, Tag, ArrowLeft } from "lucide-react";
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

  // Fetch plan details
  const { data: plans, isLoading: isPlanLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
    enabled: !!planId,
  });
  
  const plan = plans?.find(p => p.id === planId);

  // Create bill mutation
  const createBillMutation = useMutation({
    mutationFn: async (data: { planId: string; durationMonths: number; promoCode?: string }) => {
      const response = await apiRequest("/api/subscription/create-bill", {
        method: "POST",
        body: JSON.stringify(data),
      });
      
      // Parse JSON response
      const json = await response.json();
      return json as {
        billCode: string;
        billUrl: string;
        orderRef: string;
        totalAmount: number;
        planName: string;
        durationMonths: number;
        promoApplied: any;
      };
    },
    onSuccess: (data: any) => {
      // Redirect to ToyyibPay payment page
      window.location.href = data.billUrl;
    },
    onError: (error: any) => {
      toast({
        title: "Payment Error",
        description: error.message || "Failed to create payment bill. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Calculate price
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
      title: "Promo Code Applied",
      description: `You saved 10% with code ${promoCode}!`,
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
            <p className="text-center text-muted-foreground">Plan not found. Please select a plan from the pricing page.</p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => setLocation("/pricing")} data-testid="button-back-pricing">
                Go to Pricing
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
        Back to Pricing
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Order Summary */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>Review your subscription details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Plan Details */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{plan.displayName} Plan</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <Badge variant="secondary">{duration} months</Badge>
              </div>

              <Separator />

              {/* Features */}
              <div>
                <h4 className="font-medium mb-3">Included Features:</h4>
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
                <Label htmlFor="promo-code">Promo Code (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="promo-code"
                    placeholder="Enter promo code"
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
                      Apply
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
                      Remove
                    </Button>
                  )}
                </div>
                {appliedPromo && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <Check className="h-4 w-4" />
                    Promo code "{appliedPromo.code}" applied!
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
              <CardTitle>Price Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Price</span>
                <span>RM{plan.monthlyPrice}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span>{duration} months</span>
              </div>

              {(duration === 6 || duration === 12) && (
                <div className="flex justify-between text-green-600">
                  <span>Duration Discount</span>
                  <span>-{duration === 6 ? '10' : '20'}%</span>
                </div>
              )}

              {appliedPromo && (
                <div className="flex justify-between text-green-600">
                  <span>Promo Discount</span>
                  <span>-{appliedPromo.discountValue}{appliedPromo.discountType === 'percentage' ? '%' : ' RM'}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span data-testid="text-total-price">RM{totalPrice.toFixed(2)}</span>
              </div>

              <div className="text-sm text-muted-foreground text-center">
                RM{monthlyEquivalent}/month equivalent
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
                    Creating payment...
                  </>
                ) : (
                  "Proceed to Payment"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
