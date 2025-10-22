import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Target, TrendingUp, CheckCircle2, Sparkles } from "lucide-react";

export function AchievementWidget() {
  const { data: stats } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: claimsData } = useQuery<any>({
    queryKey: ["/api/claims"],
  });

  const { data: performance } = useQuery<any>({
    queryKey: ["/api/analytics/product-performance"],
  });

  if (!stats || !claimsData) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32" />
        </CardContent>
      </Card>
    );
  }

  // Calculate achievements from existing data
  const achievements = [];

  // Weekly Sales Achievement (RM 1,000)
  const weeklySalesTarget = 1000;
  const currentWeeklySales = parseFloat(stats.weekProduction || "0") + parseFloat(stats.weekSales || "0");
  const salesProgress = Math.min((currentWeeklySales / weeklySalesTarget) * 100, 100);
  
  if (salesProgress >= 100) {
    achievements.push({
      id: "weekly-sales-1k",
      title: "Jualan Cemerlang!",
      description: "Capai RM1,000 jualan minggu ini",
      icon: <Trophy className="h-5 w-5 text-yellow-500" />,
      achieved: true,
      progress: 100,
    });
  } else if (salesProgress > 50) {
    achievements.push({
      id: "weekly-sales-1k",
      title: "Hampir Cecah Sasaran",
      description: `RM${currentWeeklySales.toFixed(0)} / RM${weeklySalesTarget}`,
      icon: <Target className="h-5 w-5 text-blue-500" />,
      achieved: false,
      progress: salesProgress,
    });
  }

  // Vendor Delivery Achievement (10 vendors)
  const vendorCount = claimsData?.data?.length || 0;
  const vendorTarget = 10;
  const vendorProgress = Math.min((vendorCount / vendorTarget) * 100, 100);

  if (vendorProgress >= 100) {
    achievements.push({
      id: "vendor-10",
      title: "Vendor Champion!",
      description: "Hantar ke 10 vendor",
      icon: <Trophy className="h-5 w-5 text-yellow-500" />,
      achieved: true,
      progress: 100,
    });
  }

  // Claims Completion Achievement (100% settled)
  const totalClaims = claimsData?.data?.length || 0;
  const settledClaims = claimsData?.data?.filter((c: any) => 
    parseFloat(c.pendingAmount || "0") === 0 && parseFloat(c.partialAmount || "0") === 0
  ).length || 0;
  const claimsProgress = totalClaims > 0 ? (settledClaims / totalClaims) * 100 : 0;

  if (claimsProgress === 100 && totalClaims > 0) {
    achievements.push({
      id: "claims-100",
      title: "Bayaran Lengkap!",
      description: "100% claim minggu ni selesai",
      icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      achieved: true,
      progress: 100,
    });
  }

  // Product Diversity Achievement (5+ products sold)
  const productsSold = performance?.fastestSelling?.length || 0;
  const productTarget = 5;
  const productProgress = Math.min((productsSold / productTarget) * 100, 100);

  if (productProgress >= 100) {
    achievements.push({
      id: "products-5",
      title: "Variasi Hebat!",
      description: "5 jenis produk berjaya dijual",
      icon: <Sparkles className="h-5 w-5 text-purple-500" />,
      achieved: true,
      progress: 100,
    });
  }

  // Growth Achievement (week-over-week growth)
  const weeklyGrowth = parseFloat(stats.weeklyGrowth || "0");
  if (weeklyGrowth > 10) {
    achievements.push({
      id: "growth-10",
      title: "Trend Menaik!",
      description: `+${weeklyGrowth.toFixed(1)}% berbanding minggu lepas`,
      icon: <TrendingUp className="h-5 w-5 text-green-500" />,
      achieved: true,
      progress: 100,
    });
  }

  if (achievements.length === 0) {
    return null;
  }

  return (
    <Card className="border-t-4 border-t-yellow-500" data-testid="card-achievements">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Pencapaian
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`p-4 rounded-lg border ${
              achievement.achieved
                ? "bg-yellow-50 border-yellow-200"
                : "bg-muted/50 border-border"
            } hover-elevate`}
            data-testid={`item-achievement-${achievement.id}`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex-shrink-0 ${
                  achievement.achieved ? "animate-bounce" : ""
                }`}
              >
                {achievement.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold" data-testid={`text-achievement-title-${achievement.id}`}>
                    {achievement.title}
                  </h4>
                  {achievement.achieved && (
                    <Badge className="bg-yellow-500 text-white">
                      Tercapai!
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-3" data-testid={`text-achievement-desc-${achievement.id}`}>
                  {achievement.description}
                </p>
                {!achievement.achieved && achievement.progress > 0 && (
                  <div className="space-y-1">
                    <Progress value={achievement.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {achievement.progress.toFixed(0)}% selesai
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Celebration Message for All Achievements */}
        {achievements.every((a) => a.achieved) && achievements.length > 0 && (
          <div className="text-center p-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <p className="font-semibold text-lg">Tahniah! Anda cemerlang minggu ini!</p>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Teruskan momentum yang hebat ini!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
