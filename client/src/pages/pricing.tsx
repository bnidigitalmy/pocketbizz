import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Crown, Star, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type SubscriptionPlan = {
  id: string;
  name: string;
  displayName: string;
  description: string;
  price: string;
  currency: string;
  interval: string;
  features: string[];
  maxUsers: number;
  maxProducts: number;
  isActive: number;
  sortOrder: number;
  createdAt: Date;
};

export default function Pricing() {
  const { data: plans, isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
  });

  // Mock early bird data - will be replaced with real API later
  const earlyBirdSlotsRemaining = 73; // Out of 100
  const earlyBirdPrice = 27;
  const regularPrice = 99;

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
      <div className="bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-xl p-6 mb-12 border-2 border-accent">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Sparkles className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold text-primary">Early Bird Special!</h2>
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-lg">
            First 100 subscribers get{" "}
            <span className="font-bold text-primary text-2xl">RM{earlyBirdPrice}/month</span>
            {" "}instead of RM{regularPrice}/month
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="bg-background rounded-lg px-4 py-2">
              <p className="text-sm text-muted-foreground">Slots Remaining</p>
              <p className="text-3xl font-bold font-mono text-primary">{earlyBirdSlotsRemaining}/100</p>
            </div>
            <div className="bg-background rounded-lg px-4 py-2">
              <p className="text-sm text-muted-foreground">After 3 months</p>
              <p className="text-lg font-semibold text-accent">RM79 Loyalty Rate</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Lock in your early bird price now! Auto-transitions to RM79 loyalty rate after 3 months.
          </p>
        </div>
      </div>

      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Choose Your Perfect Plan
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Streamline your small business operations with PocketBizz. Start with our flexible plans designed for your growth.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {plans?.sort((a, b) => a.sortOrder - b.sortOrder).map((plan) => {
          const Icon = planIcons[plan.name as keyof typeof planIcons] || Star;
          const colorClass = planColors[plan.name as keyof typeof planColors] || "bg-background";
          const isPro = plan.name === "pro";

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
                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold font-mono">RM{plan.price}</span>
                    <span className="text-muted-foreground">/{plan.interval}</span>
                  </div>
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
          <div className="bg-card p-4 rounded-lg border" data-testid="faq-early-bird">
            <h3 className="font-semibold mb-2">What happens after the early bird period?</h3>
            <p className="text-sm text-muted-foreground">
              Early bird subscribers will automatically transition to a loyalty rate of RM79/month after 3 months, 
              significantly lower than the regular RM99 Pro rate.
            </p>
          </div>
          <div className="bg-card p-4 rounded-lg border" data-testid="faq-plan-changes">
            <h3 className="font-semibold mb-2">Can I upgrade or downgrade my plan?</h3>
            <p className="text-sm text-muted-foreground">
              Yes! You can change your plan at any time. Upgrades take effect immediately, while downgrades 
              take effect at the start of your next billing cycle.
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
