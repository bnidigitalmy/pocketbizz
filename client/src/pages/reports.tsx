import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Package,
  Store,
  Download
} from "lucide-react";
import { generateProfitLossReport } from "@/lib/pdf-utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

export default function Reports() {
  const { data: profitLoss, isLoading: plLoading } = useQuery({
    queryKey: ["/api/reports/profit-loss"],
  });

  const { data: topProducts } = useQuery({
    queryKey: ["/api/reports/top-products"],
  });

  const { data: topVendors } = useQuery({
    queryKey: ["/api/reports/top-vendors"],
  });

  const { data: monthlyData } = useQuery({
    queryKey: ["/api/reports/monthly"],
  });

  if (plLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat laporan...</p>
        </div>
      </div>
    );
  }

  const handleExportPDF = () => {
    if (profitLoss) {
      generateProfitLossReport(profitLoss, topProducts || [], topVendors || []);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold md:text-3xl">Laporan & Analitik</h1>
          <p className="text-sm text-muted-foreground mt-1">Analisis prestasi perniagaan anda</p>
        </div>
        <Button onClick={handleExportPDF} data-testid="button-export-pdf">
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Ringkasan</TabsTrigger>
          <TabsTrigger value="products" data-testid="tab-products">Produk</TabsTrigger>
          <TabsTrigger value="vendors" data-testid="tab-vendors">Vendor</TabsTrigger>
          <TabsTrigger value="trends" data-testid="tab-trends">Trend</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Profit/Loss Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Jumlah Jualan
                </CardTitle>
                <DollarSign className="h-4 w-4 text-chart-3" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold font-mono" data-testid="text-total-sales">
                  RM {profitLoss?.totalSales || "0.00"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Bulan ini
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Jumlah Kos
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-chart-2" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold font-mono text-destructive" data-testid="text-total-costs">
                  RM {profitLoss?.totalCosts || "0.00"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Produksi & Perbelanjaan
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Untung Bersih
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold font-mono text-primary" data-testid="text-net-profit">
                  RM {profitLoss?.netProfit || "0.00"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Margin: {profitLoss?.profitMargin || "0"}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trend Chart */}
          {monthlyData && monthlyData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Trend Jualan & Kos</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      className="text-xs"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="hsl(var(--chart-3))" 
                      strokeWidth={2}
                      name="Jualan"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="costs" 
                      stroke="hsl(var(--chart-2))" 
                      strokeWidth={2}
                      name="Kos"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Produk Paling Untung</CardTitle>
            </CardHeader>
            <CardContent>
              {!topProducts || topProducts.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">Tiada data produk</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topProducts.map((product: any, index: number) => (
                    <div 
                      key={product.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover-elevate"
                      data-testid={`top-product-${index}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.totalSold || 0} terjual
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-semibold text-primary">
                          RM {product.totalProfit || "0.00"}
                        </p>
                        <p className="text-xs text-muted-foreground">Untung</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {topProducts && topProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Perbandingan Produk</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProducts}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="name" 
                      className="text-xs"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                    />
                    <Bar dataKey="totalProfit" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="vendors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Paling Aktif</CardTitle>
            </CardHeader>
            <CardContent>
              {!topVendors || topVendors.length === 0 ? (
                <div className="text-center py-8">
                  <Store className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">Tiada data vendor</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topVendors.map((vendor: any, index: number) => (
                    <div 
                      key={vendor.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover-elevate"
                      data-testid={`top-vendor-${index}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{vendor.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {vendor.totalDeliveries || 0} penghantaran
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-semibold">
                          RM {vendor.totalAmount || "0.00"}
                        </p>
                        <p className="text-xs text-muted-foreground">Jumlah</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analisis Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-medium mb-2">Trend Bulanan</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Grafik trend akan memaparkan prestasi perniagaan anda setelah terdapat lebih banyak data transaksi.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
