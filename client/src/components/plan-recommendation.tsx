import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Sparkles, 
  TrendingUp, 
  Archive, 
  Check, 
  X,
  AlertTriangle,
  Crown,
  Zap,
  Download
} from "lucide-react";

interface UsageStats {
  usage: {
    products: number;
    customers: number;
    vendors: number;
    resellers: number;
    stockItems: number;
  };
  currentPlan: string;
  recommendedPlan: string;
  limits: {
    basic: Record<string, number>;
    pro: Record<string, number>;
    premium: Record<string, string | number>;
  };
}

interface PlanDetails {
  name: string;
  displayName: string;
  price: string;
  icon: typeof Sparkles;
  color: string;
  limits: Record<string, string | number>;
}

export function PlanRecommendation() {
  const { data: usageStats, isLoading } = useQuery<UsageStats>({
    queryKey: ["/api/user/usage-stats"],
    retry: 1,
  });

  if (isLoading || !usageStats) return null;

  const { usage, recommendedPlan, limits } = usageStats;

  const plans: Record<string, PlanDetails> = {
    basic: {
      name: 'basic',
      displayName: '🥉 BASIC',
      price: 'RM39/bulan',
      icon: Sparkles,
      color: 'border-blue-200 bg-blue-50',
      limits: limits.basic,
    },
    pro: {
      name: 'pro',
      displayName: '🥈 PRO',
      price: 'RM89/bulan',
      icon: TrendingUp,
      color: 'border-orange-200 bg-orange-50',
      limits: limits.pro,
    },
    premium: {
      name: 'premium',
      displayName: '🥇 PREMIUM',
      price: 'RM159/bulan',
      icon: Crown,
      color: 'border-purple-200 bg-purple-50',
      limits: limits.premium,
    },
  };

  const recommended = plans[recommendedPlan];

  // Calculate what will be archived for each plan
  const getArchiveCount = (planName: string) => {
    const planLimits = limits[planName as keyof typeof limits];
    return {
      products: Math.max(0, usage.products - (planLimits.products as number || 0)),
      vendors: Math.max(0, usage.vendors - (planLimits.vendors as number || 0)),
      resellers: Math.max(0, usage.resellers - (planLimits.resellers as number || 0)),
      customers: Math.max(0, usage.customers - (planLimits.customers as number || 0)),
      stockItems: Math.max(0, usage.stockItems - (planLimits.stockItems as number || 0)),
    };
  };

  const basicArchive = getArchiveCount('basic');
  const proArchive = getArchiveCount('pro');

  // Export functions
  const handleExport = (type: string) => {
    window.open(`/api/export/${type}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Current Usage Summary */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <CardTitle>Penggunaan Semasa Anda</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleExport('products')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Products
              </Button>
              {usage.vendors > 0 && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleExport('vendors')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Vendors
                </Button>
              )}
              {usage.customers > 0 && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleExport('customers')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Customers
                </Button>
              )}
              {usage.resellers > 0 && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleExport('resellers')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Resellers
                </Button>
              )}
            </div>
          </div>
          <CardDescription>Data yang anda dah masukkan semasa trial - Export sebelum downgrade!</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">{usage.products}</div>
            <div className="text-xs text-muted-foreground">Produk</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">{usage.vendors}</div>
            <div className="text-xs text-muted-foreground">Vendor</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">{usage.resellers}</div>
            <div className="text-xs text-muted-foreground">Reseller</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">{usage.customers}</div>
            <div className="text-xs text-muted-foreground">Pelanggan</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">{usage.stockItems}</div>
            <div className="text-xs text-muted-foreground">Stok Item</div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <div className="grid md:grid-cols-3 gap-4">
        {Object.entries(plans).map(([key, plan]) => {
          const isRecommended = key === recommendedPlan;
          const archive = key === 'basic' ? basicArchive : key === 'pro' ? proArchive : { products: 0, vendors: 0, resellers: 0, customers: 0, stockItems: 0 };
          const totalArchived = Object.values(archive).reduce((a, b) => a + b, 0);

          return (
            <Card 
              key={key}
              className={`relative ${plan.color} ${isRecommended ? 'ring-2 ring-primary shadow-lg' : ''}`}
            >
              {isRecommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Disyorkan
                  </Badge>
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <plan.icon className="h-5 w-5" />
                  {plan.displayName}
                </CardTitle>
                <CardDescription>
                  <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* What you keep */}
                <div className="space-y-2">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Yang Anda Keep:
                  </p>
                  <ul className="text-sm space-y-1 pl-6">
                    <li>{plan.limits.products} products</li>
                    <li>{plan.limits.vendors} vendors</li>
                    {typeof plan.limits.resellers === 'number' && plan.limits.resellers > 0 && <li>{plan.limits.resellers} resellers</li>}
                    <li>{plan.limits.customers} customers</li>
                  </ul>
                </div>

                {/* What gets archived */}
                {totalArchived > 0 && (
                  <Alert variant="destructive" className="py-2">
                    <Archive className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <strong>{totalArchived} item akan diarkib:</strong>
                      <ul className="mt-1 space-y-0.5">
                        {archive.products > 0 && <li>• {archive.products} produk</li>}
                        {archive.vendors > 0 && <li>• {archive.vendors} vendor</li>}
                        {archive.resellers > 0 && <li>• {archive.resellers} reseller</li>}
                        {archive.customers > 0 && <li>• {archive.customers} pelanggan</li>}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {totalArchived === 0 && (
                  <Alert className="py-2 bg-green-50 border-green-200">
                    <Check className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-xs text-green-800">
                      <strong>Semua data anda selamat!</strong>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>

              <CardFooter>
                <Link href="/pricing" className="w-full">
                  <Button 
                    className="w-full" 
                    variant={isRecommended ? "default" : "outline"}
                  >
                    {isRecommended ? 'Pilih Plan Ini' : 'Lihat Detail'}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Important Notice */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>💡 Penting:</strong> Data yang diarkib tidak akan dipadam. Anda boleh restore semula bila upgrade ke plan lebih tinggi.
        </AlertDescription>
      </Alert>
    </div>
  );
}
