import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, TrendingUp, AlertCircle, CheckCircle, Clock, Package, Sun, Cloud, Moon } from "lucide-react";
import { format } from "date-fns";
import { ms } from "date-fns/locale";

export function AIGreetingWidget() {
  const { data: stats, isLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: claimsData } = useQuery<any>({
    queryKey: ["/api/claims"],
  });

  const { data: lowStockItems = [] } = useQuery<any[]>({
    queryKey: ["/api/stock/low"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <Skeleton className="h-6 w-64 mb-2" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Selamat Pagi";
    if (hour < 15) return "Selamat Tengah Hari";
    if (hour < 18) return "Selamat Petang";
    return "Selamat Malam";
  };

  // Get icon based on time of day
  const getGreetingIcon = () => {
    const hour = new Date().getHours();
    if (hour < 12) return <Sun className="h-5 w-5 text-yellow-500" />;
    if (hour < 18) return <Cloud className="h-5 w-5 text-blue-500" />;
    return <Moon className="h-5 w-5 text-indigo-500" />;
  };

  // Generate AI insights based on data
  const getInsights = () => {
    const insights = [];
    
    // Weekly growth insight
    const weeklyGrowth = parseFloat(stats?.weeklyGrowth || "0");
    if (weeklyGrowth > 0) {
      insights.push({
        type: "success",
        icon: <TrendingUp className="h-4 w-4" />,
        message: `Jualan naik ${weeklyGrowth.toFixed(1)}% minggu ini. Tahniah!`,
      });
    } else if (weeklyGrowth < 0) {
      insights.push({
        type: "warning",
        icon: <AlertCircle className="h-4 w-4" />,
        message: `Jualan turun ${Math.abs(weeklyGrowth).toFixed(1)}%. Cuba promosi produk terlaris anda.`,
      });
    }

    // Outstanding claims insight
    const outstandingClaims = claimsData?.data?.filter((c: any) => 
      parseFloat(c.pendingAmount || "0") > 0 || parseFloat(c.partialAmount || "0") > 0
    ).length || 0;
    
    if (outstandingClaims > 0) {
      insights.push({
        type: "info",
        icon: <Clock className="h-4 w-4" />,
        message: `${outstandingClaims} vendor belum settle bayaran. Hantar reminder!`,
      });
    } else if (claimsData?.data?.length > 0) {
      insights.push({
        type: "success",
        icon: <CheckCircle className="h-4 w-4" />,
        message: "Semua claim sudah selesai. Kerja yang hebat!",
      });
    }

    // Low stock insight
    if (lowStockItems.length > 0) {
      insights.push({
        type: "warning",
        icon: <Package className="h-4 w-4" />,
        message: `${lowStockItems.length} bahan stok rendah. Masa untuk restock.`,
      });
    }

    // Production insight
    const todayProduction = parseFloat(stats?.todayProduction || "0");
    if (todayProduction > 0) {
      insights.push({
        type: "success",
        icon: <Sparkles className="h-4 w-4" />,
        message: `RM${todayProduction.toFixed(0)} produksi hari ini. Teruskan!`,
      });
    }

    return insights.slice(0, 3); // Show max 3 insights
  };

  const insights = getInsights();
  const currentDate = format(new Date(), "EEEE, dd MMMM yyyy", { locale: ms });

  const getInsightColor = (type: string) => {
    switch (type) {
      case "success": return "border-green-200 bg-green-50";
      case "warning": return "border-yellow-200 bg-yellow-50";
      case "info": return "border-blue-200 bg-blue-50";
      default: return "border-border bg-muted/50";
    }
  };

  const getInsightBadgeVariant = (type: string) => {
    switch (type) {
      case "success": return "default";
      case "warning": return "secondary";
      case "info": return "outline";
      default: return "outline";
    }
  };

  return (
    <Card className="border-l-4 border-l-primary" data-testid="card-ai-greeting">
      <CardContent className="py-6 space-y-4">
        {/* Personalized Greeting */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-semibold" data-testid="text-greeting">
              {getGreeting()}
            </h2>
            {getGreetingIcon()}
          </div>
          <p className="text-sm text-muted-foreground" data-testid="text-date">
            {currentDate}
          </p>
        </div>

        {/* AI Insights */}
        {insights.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium">Insight Hari Ini</h3>
            </div>
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg border ${getInsightColor(insight.type)}`}
                data-testid={`item-insight-${index}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {insight.icon}
                </div>
                <p className="text-sm flex-1" data-testid={`text-insight-message-${index}`}>
                  {insight.message}
                </p>
                <Badge variant={getInsightBadgeVariant(insight.type) as any} className="text-xs">
                  AI
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Fallback encouragement if no insights */}
        {insights.length === 0 && (
          <div className="text-center py-4">
            <Sparkles className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              Selamat bekerja hari ini! Mulakan dengan rekod produksi atau jualan.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
