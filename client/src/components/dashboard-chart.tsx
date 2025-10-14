import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

type TimeRange = "7d" | "30d" | "90d" | "6m";

const timeRangeLabels = {
  "7d": "7 Hari",
  "30d": "30 Hari",
  "90d": "90 Hari",
  "6m": "6 Bulan",
};

export function DashboardChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  const { data: monthlyData = [], isLoading } = useQuery({
    queryKey: ["/api/reports/monthly"],
  });

  const chartData = useMemo(() => {
    if (!monthlyData || monthlyData.length === 0) return [];

    // Filter by time range
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeRange) {
      case "7d":
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        cutoffDate.setDate(now.getDate() - 90);
        break;
      case "6m":
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
    }

    const filtered = monthlyData.filter((item: any) => {
      const itemDate = new Date(item.month);
      return itemDate >= cutoffDate;
    });

    return filtered.map((item: any) => ({
      month: new Date(item.month).toLocaleDateString('ms-MY', { 
        month: 'short', 
        day: 'numeric' 
      }),
      sales: parseFloat(item.totalSales || 0),
      profit: parseFloat(item.totalProfit || 0),
      expenses: parseFloat(item.totalExpenses || 0),
    }));
  }, [monthlyData, timeRange]);

  const trends = useMemo(() => {
    if (chartData.length < 2) return { sales: 0, profit: 0 };

    const latest = chartData[chartData.length - 1];
    const previous = chartData[chartData.length - 2];

    const salesTrend = previous.sales > 0 
      ? ((latest.sales - previous.sales) / previous.sales) * 100 
      : 0;
    
    const profitTrend = previous.profit > 0 
      ? ((latest.profit - previous.profit) / previous.profit) * 100 
      : 0;

    return {
      sales: salesTrend,
      profit: profitTrend,
    };
  }, [chartData]);

  const totalSales = useMemo(() => 
    chartData.reduce((sum, item) => sum + item.sales, 0),
    [chartData]
  );

  const totalProfit = useMemo(() => 
    chartData.reduce((sum, item) => sum + item.profit, 0),
    [chartData]
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="animate-pulse space-y-3">
            <div className="h-5 w-32 bg-muted rounded"></div>
            <div className="h-4 w-48 bg-muted rounded"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-muted rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Trend Jualan & Untung
          </CardTitle>
          <CardDescription>Tiada data untuk tempoh ini</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <div className="text-center text-muted-foreground">
            <p>Tiada rekod jualan lagi</p>
            <p className="text-sm mt-2">Mulakan dengan merekod jualan pertama</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Trend Jualan & Untung
            </CardTitle>
            <CardDescription>
              {timeRangeLabels[timeRange]} terakhir
            </CardDescription>
          </div>
          
          <div className="flex gap-2">
            {(Object.keys(timeRangeLabels) as TimeRange[]).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range)}
                data-testid={`button-range-${range}`}
              >
                {timeRangeLabels[range]}
              </Button>
            ))}
          </div>
        </div>

        {/* Trend Indicators */}
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Badge variant={trends.sales >= 0 ? "default" : "destructive"} className="gap-1">
              {trends.sales >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              Jualan {Math.abs(trends.sales).toFixed(1)}%
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={trends.profit >= 0 ? "default" : "destructive"} className="gap-1">
              {trends.profit >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              Untung {Math.abs(trends.profit).toFixed(1)}%
            </Badge>
          </div>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
          <div>
            <p className="text-sm text-muted-foreground">Jumlah Jualan</p>
            <p className="text-2xl font-bold">RM {totalSales.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Jumlah Untung</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              RM {totalProfit.toFixed(2)}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="hsl(var(--chart-1))"
              fill="url(#colorSales)"
              strokeWidth={2}
              name="Jualan (RM)"
            />
            <Area
              type="monotone"
              dataKey="profit"
              stroke="hsl(var(--chart-2))"
              fill="url(#colorProfit)"
              strokeWidth={2}
              name="Untung (RM)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
