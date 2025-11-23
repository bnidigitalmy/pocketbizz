import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp, Calendar } from "lucide-react";
import { format } from "date-fns";

interface SalesTrendChartProps {
  days?: number;
}

export function SalesTrendChart({ days = 14 }: SalesTrendChartProps) {
  const { data: trendData, isLoading } = useQuery<any[]>({
    queryKey: ["/api/analytics/sales-trend", days],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/sales-trend?days=${days}`);
      if (!response.ok) throw new Error("Failed to fetch trend data");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64" />
        </CardContent>
      </Card>
    );
  }

  if (!trendData || trendData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trend Jualan {days} Hari
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Belum ada data untuk tempoh ini</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate summary stats
  const totalRevenue = trendData.reduce((sum, d) => sum + parseFloat(d.revenue), 0);
  const totalProfit = trendData.reduce((sum, d) => sum + parseFloat(d.profit), 0);
  const avgDailyRevenue = totalRevenue / trendData.length;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Format data for chart
  const chartData = trendData.map((item) => ({
    ...item,
    date: format(new Date(item.date), "dd MMM"),
    revenue: parseFloat(item.revenue),
    profit: parseFloat(item.profit),
    costs: parseFloat(item.costs),
  }));

  return (
    <Card data-testid="card-sales-trend">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trend Jualan & Untung
          </CardTitle>
          <Badge variant="outline">
            {days} hari lepas
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Jumlah Hasil</p>
            <p className="text-lg font-semibold text-primary" data-testid="text-total-revenue">
              RM {totalRevenue.toFixed(0)}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Purata Harian</p>
            <p className="text-lg font-semibold text-blue-600" data-testid="text-avg-revenue">
              RM {avgDailyRevenue.toFixed(0)}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Margin Untung</p>
            <p className="text-lg font-semibold text-green-600" data-testid="text-profit-margin">
              {profitMargin.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="h-64" data-testid="chart-sales-trend">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="text-sm font-medium mb-2">{payload[0].payload.date}</p>
                        <div className="space-y-1">
                          <p className="text-sm">
                            <span className="text-primary font-medium">Hasil:</span> RM {payload[0].payload.revenue.toFixed(2)}
                          </p>
                          <p className="text-sm">
                            <span className="text-green-600 font-medium">Untung:</span> RM {payload[0].payload.profit.toFixed(2)}
                          </p>
                          <p className="text-sm">
                            <span className="text-muted-foreground">Kos:</span> RM {payload[0].payload.costs.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Hasil"
              />
              <Area
                type="monotone"
                dataKey="profit"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorProfit)"
                name="Untung"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Trend Insight */}
        {trendData.length >= 7 && (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-900">
              <TrendingUp className="h-4 w-4 inline mr-2" />
              {totalProfit > 0 ? 
                `Prestasi konsisten dengan untung bersih RM${totalProfit.toFixed(0)} dalam ${days} hari.` :
                `Fokus pada pengurusan kos untuk tingkatkan keuntungan.`
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
