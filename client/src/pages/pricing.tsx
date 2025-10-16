import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Crown, Star, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  isActive: number;
  sortOrder: number;
  createdAt: Date;
};

export default function Pricing() {
  const [, setLocation] = useLocation();
  const [selectedDuration, setSelectedDuration] = useState<3 | 6 | 12>(6);
  
  // Check if this is a renewal flow
  const urlParams = new URLSearchParams(window.location.search);
  const isRenewal = urlParams.get('renew') === 'true';
  
  const { data: plans, isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
  });
  
  const { data: earlyBirdData } = useQuery<{ remaining: number, total: number }>({
    queryKey: ["/api/subscription/early-bird-slots"],
  });

  const earlyBirdSlotsRemaining = earlyBirdData?.remaining ?? 0;
  const earlyBirdDiscount = 70; // 70% off early bird discount
  
  const handleSelectPlan = (plan: SubscriptionPlan) => {
    // Navigate to checkout with plan details and renewal flag
    const params = new URLSearchParams({
      planId: plan.id,
      planName: plan.name,
      duration: selectedDuration.toString(),
    });
    
    if (isRenewal) {
      params.set('renew', 'true');
    }
    
    setLocation(`/checkout?${params.toString()}`);
  };

  const planIcons = {
    basic: Star,
    pro: Zap,
    premium: Crown,
  };

  const planColors = {
    basic: "bg-background",
    pro: "bg-accent/10 border-accent",
    premium: "bg-primary/10 border-primary",
  };
  
  // Calculate price for a plan based on selected duration
  const calculatePrice = (plan: SubscriptionPlan, isEarlyBird: boolean = false) => {
    const monthlyPrice = parseFloat(plan.monthlyPrice);
    let totalPrice = monthlyPrice * selectedDuration;
    
    // Apply duration discount
    if (selectedDuration === 6 && plan.discount6Months) {
      const discount = parseFloat(plan.discount6Months);
      totalPrice = totalPrice * (1 - discount / 100);
    } else if (selectedDuration === 12 && plan.discount12Months) {
      const discount = parseFloat(plan.discount12Months);
      totalPrice = totalPrice * (1 - discount / 100);
    }
    
    // Apply early bird discount if applicable
    if (isEarlyBird && earlyBirdSlotsRemaining > 0) {
      totalPrice = totalPrice * (1 - earlyBirdDiscount / 100);
    }
    
    return totalPrice.toFixed(2);
  };
  
  // Calculate savings vs monthly (accounts for early bird)
  const calculateSavings = (plan: SubscriptionPlan, isEarlyBird: boolean = false) => {
    const monthlyPrice = parseFloat(plan.monthlyPrice);
    const fullPrice = monthlyPrice * selectedDuration;
    const discountedPrice = parseFloat(calculatePrice(plan, isEarlyBird));
    const savings = fullPrice - discountedPrice;
    const percentage = (savings / fullPrice) * 100;
    
    return { amount: savings.toFixed(2), percentage: percentage.toFixed(0) };
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-12">
          <Skeleton className="h-12 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[500px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Early Bird Banner */}
      {earlyBirdSlotsRemaining > 0 && (
        <div className="bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-xl p-6 mb-8 border-2 border-accent" data-testid="banner-early-bird">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Sparkles className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold text-primary">Early Bird Special!</h2>
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg">
              First 100 subscribers get{" "}
              <span className="font-bold text-primary text-2xl">{earlyBirdDiscount}% OFF</span>
              {" "}any plan for their first subscription
            </p>
            <div className="flex items-center justify-center gap-4 mt-4">
              <div className="bg-background rounded-lg px-4 py-2">
                <p className="text-sm text-muted-foreground">Slots Remaining</p>
                <p className="text-3xl font-bold font-mono text-primary" data-testid="text-slots-remaining">
                  {earlyBirdSlotsRemaining}/100
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Lock in your early bird discount now! Limited to first 100 subscribers only.
            </p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Choose Your Perfect Plan
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Streamline your small business operations with PocketBizz. Flexible duration-based pricing designed for your growth.
        </p>
      </div>
      
      {/* Duration Selector */}
      <div className="flex justify-center mb-8">
        <Tabs value={selectedDuration.toString()} onValueChange={(v) => setSelectedDuration(parseInt(v) as 3 | 6 | 12)}>
          <TabsList className="grid w-full max-w-md grid-cols-3" data-testid="tabs-duration">
            <TabsTrigger value="3" data-testid="tab-3months">
              3 Months
            </TabsTrigger>
            <TabsTrigger value="6" data-testid="tab-6months">
              <div className="flex flex-col items-center">
                <span>6 Months</span>
                <Badge variant="secondary" className="mt-1 text-xs">Save 10%</Badge>
              </div>
            </TabsTrigger>
            <TabsTrigger value="12" data-testid="tab-12months">
              <div className="flex flex-col items-center">
                <span>12 Months</span>
                <Badge variant="secondary" className="mt-1 text-xs">Save 20%</Badge>
              </div>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {plans?.sort((a, b) => a.sortOrder - b.sortOrder).map((plan) => {
          const Icon = planIcons[plan.name as keyof typeof planIcons] || Star;
          const colorClass = planColors[plan.name as keyof typeof planColors] || "bg-background";
          const isPro = plan.name === "pro";
          const hasEarlyBird = earlyBirdSlotsRemaining > 0;
          const price = calculatePrice(plan);
          const earlyBirdPrice = calculatePrice(plan, true);
          const savings = calculateSavings(plan, hasEarlyBird);

          return (
            <Card
              key={plan.id}
              className={`relative ${colorClass} ${isPro ? "md:scale-105 md:shadow-xl" : ""}`}
              data-testid={`card-plan-${plan.name}`}
            >
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-accent text-accent-foreground">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-6 w-6 text-primary" />
                  <CardTitle className="text-2xl">{plan.displayName}</CardTitle>
                </div>
                <CardDescription>{plan.description}</CardDescription>
                
                {/* Pricing Display */}
                <div className="mt-4 space-y-2">
                  {hasEarlyBird ? (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm text-muted-foreground line-through">
                          RM{price}
                        </span>
                        <Badge variant="default" className="bg-primary">
                          {earlyBirdDiscount}% OFF
                        </Badge>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold font-mono text-primary" data-testid={`price-${plan.name}`}>
                          RM{earlyBirdPrice}
                        </span>
                        <span className="text-muted-foreground">/{selectedDuration} months</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold font-mono" data-testid={`price-${plan.name}`}>
                        RM{price}
                      </span>
                      <span className="text-muted-foreground">/{selectedDuration} months</span>
                    </div>
                  )}
                  
                  {/* Savings Badge */}
                  {parseFloat(savings.amount) > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Save RM{savings.amount} ({savings.percentage}%)
                    </p>
                  )}
                  
                  {/* Monthly Breakdown */}
                  <p className="text-sm text-muted-foreground">
                    RM{(parseFloat(hasEarlyBird ? earlyBirdPrice : price) / selectedDuration).toFixed(2)}/month
                  </p>
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {(typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features).map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 pt-6 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Max Products:</span>
                    <span className="font-semibold">
                      {plan.maxProducts >= 999999 ? "Unlimited" : plan.maxProducts}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Max Users:</span>
                    <span className="font-semibold">
                      {plan.maxUsers >= 999 ? "Unlimited" : plan.maxUsers}
                    </span>
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={isPro ? "default" : "outline"}
                  size="lg"
                  data-testid={`button-choose-${plan.name}`}
                  onClick={() => handleSelectPlan(plan)}
                >
                  Choose {plan.displayName}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-center mb-8">Feature Comparison</h2>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-semibold">Features</th>
                    <th className="text-center p-4 font-semibold">Basic</th>
                    <th className="text-center p-4 font-semibold">Pro</th>
                    <th className="text-center p-4 font-semibold">Premium</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="p-4">Products</td>
                    <td className="text-center p-4">50</td>
                    <td className="text-center p-4">200</td>
                    <td className="text-center p-4">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="p-4">Users</td>
                    <td className="text-center p-4">1</td>
                    <td className="text-center p-4">3</td>
                    <td className="text-center p-4">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="p-4">Inventory Tracking</td>
                    <td className="text-center p-4"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                    <td className="text-center p-4"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                    <td className="text-center p-4"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4">Sales & Delivery Management</td>
                    <td className="text-center p-4"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                    <td className="text-center p-4"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                    <td className="text-center p-4"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4">Financial Reports</td>
                    <td className="text-center p-4"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                    <td className="text-center p-4"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                    <td className="text-center p-4"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4">Production Planning</td>
                    <td className="text-center p-4 text-muted-foreground">-</td>
                    <td className="text-center p-4"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                    <td className="text-center p-4"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4">FIFO Batch Tracking</td>
                    <td className="text-center p-4 text-muted-foreground">-</td>
                    <td className="text-center p-4"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                    <td className="text-center p-4"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4">Commission Management</td>
                    <td className="text-center p-4 text-muted-foreground">-</td>
                    <td className="text-center p-4"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                    <td className="text-center p-4"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4">Google Drive Auto-sync</td>
                    <td className="text-center p-4 text-muted-foreground">-</td>
                    <td className="text-center p-4"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                    <td className="text-center p-4"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4">WhatsApp Integration</td>
                    <td className="text-center p-4 text-muted-foreground">-</td>
                    <td className="text-center p-4 text-muted-foreground">-</td>
                    <td className="text-center p-4"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4">API Access</td>
                    <td className="text-center p-4 text-muted-foreground">-</td>
                    <td className="text-center p-4 text-muted-foreground">-</td>
                    <td className="text-center p-4"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4">Support Level</td>
                    <td className="text-center p-4">Email</td>
                    <td className="text-center p-4">Priority</td>
                    <td className="text-center p-4">Dedicated</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4 text-left">
          <div className="bg-card p-4 rounded-lg border" data-testid="faq-duration">
            <h3 className="font-semibold mb-2">How does duration-based pricing work?</h3>
            <p className="text-sm text-muted-foreground">
              Pay upfront for 3, 6, or 12 months and save! Get 10% off on 6-month plans and 20% off on 12-month plans. 
              No recurring charges - you're in control of when to renew.
            </p>
          </div>
          <div className="bg-card p-4 rounded-lg border" data-testid="faq-early-bird">
            <h3 className="font-semibold mb-2">What is the early bird special?</h3>
            <p className="text-sm text-muted-foreground">
              The first 100 subscribers get an additional 70% off their first subscription, regardless of plan or duration. 
              This discount applies on top of any duration discounts!
            </p>
          </div>
          <div className="bg-card p-4 rounded-lg border" data-testid="faq-renewal">
            <h3 className="font-semibold mb-2">What happens when my subscription expires?</h3>
            <p className="text-sm text-muted-foreground">
              You'll receive reminders before expiry. Simply renew by choosing your next duration - your data stays safe. 
              You can upgrade, downgrade, or choose a different duration when renewing.
            </p>
          </div>
          <div className="bg-card p-4 rounded-lg border" data-testid="faq-data-safety">
            <h3 className="font-semibold mb-2">Is my data safe?</h3>
            <p className="text-sm text-muted-foreground">
              Absolutely. We use industry-standard encryption and security practices. Your data is backed up 
              regularly and stored securely in the cloud.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
