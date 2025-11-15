import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Sparkles, 
  Check, 
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
}

interface DurationPackage {
  months: number;
  price: number;
  monthlyRate: number;
  savings: string;
  isPopular?: boolean;
}

export function PlanRecommendation() {
  const { data: usageStats, isLoading } = useQuery<UsageStats>({
    queryKey: ["/api/user/usage-stats"],
    retry: 1,
  });

  if (isLoading || !usageStats) return null;

  const { usage } = usageStats;

  // Duration packages with pricing
  const packages: DurationPackage[] = [
    { months: 1, price: 27, monthlyRate: 27, savings: '' },
    { months: 3, price: 79, monthlyRate: 26.33, savings: 'Jimat 3%' },
    { months: 6, price: 146, monthlyRate: 24.33, savings: 'Jimat 10%', isPopular: true },
    { months: 12, price: 259, monthlyRate: 21.58, savings: 'Jimat 20%' },
  ];

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

      {/* Single Plan - PocketBizz */}
      <Card className="border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Crown className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-3xl">PocketBizz</CardTitle>
          <CardDescription className="text-base">
            Satu plan, semua features. Pilih tempoh yang sesuai.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Features included */}
          <div className="bg-white rounded-lg p-4 space-y-2">
            <p className="font-semibold text-sm flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              Yang Anda Dapat:
            </p>
            <ul className="text-sm space-y-1 pl-6 text-muted-foreground">
              <li>✅ Unlimited products, vendors, resellers</li>
              <li>✅ Unlimited customers & stock items</li>
              <li>✅ Semua features premium termasuk</li>
              <li>✅ Data anda selamat & tidak diarkib</li>
            </ul>
          </div>

          {/* Duration packages */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {packages.map((pkg) => (
              <Link key={pkg.months} href="/subscription" className="block">
                <div className={`relative p-4 border-2 rounded-lg hover:shadow-lg transition-all cursor-pointer ${
                  pkg.isPopular 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}>
                  {pkg.savings && (
                    <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs">
                      {pkg.savings}
                    </Badge>
                  )}
                  {pkg.isPopular && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs">
                      Popular
                    </Badge>
                  )}
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">{pkg.months} Bulan</div>
                    <div className="text-2xl font-bold text-blue-600">RM{pkg.price}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      RM{pkg.monthlyRate.toFixed(2)}/bulan
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <Alert className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-sm text-green-800">
              <strong>Semua data anda selamat!</strong> Dengan PocketBizz, tiada had untuk products, vendors, atau customers. Semua yang anda dah masukkan akan kekal.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Link href="/subscription" className="w-full">
            <Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
              Lihat Pakej & Bayar
            </Button>
          </Link>
        </CardFooter>
      </Card>

      {/* Important Notice */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>💡 Penting:</strong> Pilih tempoh langganan untuk teruskan menggunakan PocketBizz selepas trial tamat. Semakin lama tempoh, lebih banyak anda jimat!
        </AlertDescription>
      </Alert>
    </div>
  );
}
