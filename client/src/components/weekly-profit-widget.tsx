import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ms } from "date-fns/locale";

interface WeeklySummary {
  currentWeek: {
    revenue: string;
    costs: string;
    profit: string;
    profitMargin: string;
  };
  lastWeek: {
    revenue: string;
    costs: string;
    profit: string;
  };
  comparison: {
    revenueChange: string;
    profitChange: string;
    isGrowth: boolean;
  };
  weekRange: {
    start: string;
    end: string;
  };
}

export function WeeklyProfitWidget() {
  const { data: summary, isLoading } = useQuery<WeeklySummary>({
    queryKey: ["/api/reports/weekly-summary"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  const profit = parseFloat(summary.currentWeek.profit);
  const profitChange = parseFloat(summary.comparison.profitChange);
  const isPositive = profitChange >= 0;
  const isProfit = profit > 0;

  // Motivational message based on performance
  const getMotivationalMessage = () => {
    if (profitChange >= 20) {
      return "Luar biasa! Untung meningkat mendadak! 🔥";
    } else if (profitChange >= 10) {
      return "Syabas! Pertumbuhan sangat baik! 💪";
    } else if (profitChange >= 5) {
      return "Bagus! Teruskan momentum ini! 📈";
    } else if (profitChange > 0) {
      return "Baik! Untung meningkat sedikit.";
    } else if (profitChange === 0) {
      return "Konsisten. Teruskan usaha!";
    } else if (profitChange >= -5) {
      return "Sedikit menurun. Fokus pada kos.";
    } else {
      return "Perlu perhatian. Semak strategi.";
    }
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <DollarSign className="w-5 h-5 text-primary" />
            Ringkasan Minggu Ini
          </CardTitle>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>
              {format(new Date(summary.weekRange.start), "dd MMM", { locale: ms })} - {format(new Date(summary.weekRange.end), "dd MMM yyyy", { locale: ms })}
            </span>
          </div>
        </div>
        <Badge
          variant={isPositive ? "default" : "secondary"}
          className="flex items-center gap-1"
          data-testid="badge-profit-change"
        >
          {isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {isPositive ? "+" : ""}{profitChange}%
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Profit Display */}
        <div className="text-center p-4 bg-background/50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Untung Bersih</p>
          <p
            className={`text-3xl font-bold font-mono ${
              isProfit ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"
            }`}
            data-testid="text-weekly-profit"
          >
            RM {profit.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Margin: {summary.currentWeek.profitMargin}%
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-background/50 rounded-md">
            <p className="text-xs text-muted-foreground mb-1">Jualan</p>
            <p className="text-lg font-semibold font-mono">
              RM {parseFloat(summary.currentWeek.revenue).toFixed(2)}
            </p>
          </div>
          <div className="p-3 bg-background/50 rounded-md">
            <p className="text-xs text-muted-foreground mb-1">Kos</p>
            <p className="text-lg font-semibold font-mono">
              RM {parseFloat(summary.currentWeek.costs).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Motivational Message */}
        <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-md border border-primary/20">
          <p className="text-sm font-medium text-center" data-testid="text-motivation">
            {getMotivationalMessage()}
          </p>
        </div>

        {/* Comparison vs Last Week */}
        {parseFloat(summary.lastWeek.profit) > 0 && (
          <div className="pt-3 border-t text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Minggu lepas:</span>
              <span className="font-mono">RM {parseFloat(summary.lastWeek.profit).toFixed(2)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
