import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { QuickActionsFab } from "@/components/quick-actions-fab";
import { DashboardChart } from "@/components/dashboard-chart";
import { 
  Package, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Plus,
  Truck,
  Receipt,
  BarChart3,
  Wallet,
  TrendingDown,
  AlertCircle,
  ShoppingCart,
  Box,
  ArrowRight
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { ms } from "date-fns/locale";

interface StockItem {
  id: string;
  name: string;
  unit: string;
  currentQuantity: string;
  purchasePrice: string;
  lowStockThreshold: string;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  
  const { data: stats, isLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentDeliveries } = useQuery<any>({
    queryKey: ["/api/deliveries/recent"],
  });

  const { data: lowStockItems = [] } = useQuery<StockItem[]>({
    queryKey: ["/api/stock/low"],
  });

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Selamat Pagi";
    if (hour < 15) return "Selamat Tengah Hari";
    if (hour < 18) return "Selamat Petang";
    return "Selamat Malam";
  };

  // Format current date
  const currentDate = format(new Date(), "EEEE, dd MMMM yyyy", { locale: ms });

  const quickActions = [
    {
      id: "add-sale",
      label: "Rekod Jualan",
      icon: <Receipt className="h-5 w-5" />,
      onClick: () => setLocation("/sales"),
    },
    {
      id: "add-product",
      label: "Tambah Produk",
      icon: <Package className="h-5 w-5" />,
      onClick: () => setLocation("/products"),
    },
    {
      id: "add-stock",
      label: "Tambah Stok",
      icon: <Box className="h-5 w-5" />,
      onClick: () => setLocation("/stock"),
    },
    {
      id: "add-delivery",
      label: "Rekod Penghantaran",
      icon: <Truck className="h-5 w-5" />,
      onClick: () => setLocation("/deliveries"),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Stats Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-5 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions Skeleton */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="hover-elevate active-elevate-2">
              <CardContent className="p-6">
                <Skeleton className="h-8 w-8 rounded-full mx-auto mb-3" />
                <Skeleton className="h-4 w-24 mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 pb-3 border-b last:border-0">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    {
      title: "Produk Siap Hari Ini",
      value: stats?.todayProduction || 0,
      icon: Package,
      color: "text-chart-1",
      testId: "stat-production"
    },
    {
      title: "Jualan Hari Ini",
      value: `RM ${stats?.todaySales || "0.00"}`,
      icon: DollarSign,
      color: "text-chart-3",
      testId: "stat-sales-today"
    },
    {
      title: "Modal Hari Ini",
      value: `RM ${stats?.todayExpenses || "0.00"}`,
      icon: Wallet,
      color: "text-orange-600 dark:text-orange-400",
      testId: "stat-expenses-today"
    },
    {
      title: "Untung Hari Ini",
      value: `RM ${stats?.todayProfit || "0.00"}`,
      icon: TrendingUp,
      color: "text-green-600 dark:text-green-400",
      testId: "stat-profit-today"
    },
    {
      title: "Produk Reject Hari Ini",
      value: `${stats?.todayRejectionsCount || 0} unit`,
      subtitle: `RM ${stats?.todayRejectionsValue || "0.00"}`,
      icon: AlertCircle,
      color: "text-destructive",
      testId: "stat-rejections-today"
    },
    {
      title: "Untung Bersih (Keseluruhan)",
      value: `RM ${stats?.netProfit || "0.00"}`,
      icon: BarChart3,
      color: "text-chart-4",
      testId: "stat-profit"
    },
  ];

  const shortcuts = [
    {
      title: "Tambah Produk",
      icon: Plus,
      href: "/products",
      testId: "button-add-product"
    },
    {
      title: "Hantar ke Vendor",
      icon: Truck,
      href: "/deliveries",
      testId: "button-deliver"
    },
    {
      title: "Rekod Jualan",
      icon: Receipt,
      href: "/sales",
      testId: "button-record-sale"
    },
    {
      title: "Lihat Laporan",
      icon: BarChart3,
      href: "/reports",
      testId: "button-view-reports"
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold md:text-3xl" data-testid="dashboard-greeting">
          {getGreeting()} 👋
        </h1>
        <p className="text-sm text-muted-foreground" data-testid="dashboard-date">
          {currentDate}
        </p>
        <p className="text-sm text-muted-foreground">
          Ringkasan perniagaan anda hari ini
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold font-mono" data-testid={stat.testId}>
                {stat.value}
              </div>
              {stat.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.subtitle}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Production Flow */}
      {stats && (stats.todayProductionQty > 0 || stats.todayDeliveredQty > 0 || stats.todaySoldQty > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Aliran Produksi Hari Ini
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Dari produksi hingga jualan
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              {/* Production */}
              <div className="flex flex-col items-center justify-center p-4 bg-chart-1/10 rounded-lg">
                <Package className="h-8 w-8 text-chart-1 mb-2" />
                <p className="text-2xl font-bold font-mono text-chart-1">
                  {stats.todayProductionQty}
                </p>
                <p className="text-xs text-muted-foreground text-center mt-1">
                  Dihasilkan
                </p>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex items-center justify-center">
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
              </div>

              {/* Delivered */}
              <div className="flex flex-col items-center justify-center p-4 bg-chart-2/10 rounded-lg">
                <Truck className="h-8 w-8 text-chart-2 mb-2" />
                <p className="text-2xl font-bold font-mono text-chart-2">
                  {stats.todayDeliveredQty}
                </p>
                <p className="text-xs text-muted-foreground text-center mt-1">
                  Dihantar
                </p>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex items-center justify-center">
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
              </div>

              {/* Sold */}
              <div className="flex flex-col items-center justify-center p-4 bg-chart-3/10 rounded-lg">
                <Receipt className="h-8 w-8 text-chart-3 mb-2" />
                <p className="text-2xl font-bold font-mono text-chart-3">
                  {stats.todaySoldQty}
                </p>
                <p className="text-xs text-muted-foreground text-center mt-1">
                  Terjual
                </p>
              </div>

              {/* Balance */}
              <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                <Box className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-2xl font-bold font-mono">
                  {stats.todayBalanceQty}
                </p>
                <p className="text-xs text-muted-foreground text-center mt-1">
                  Baki (Produksi - Hantar)
                </p>
              </div>
            </div>

            {/* Additional insights */}
            {stats.todayBalanceQty < 0 && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      Penghantaran melebihi produksi
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      {Math.abs(stats.todayBalanceQty)} unit dihantar dari stok sedia ada
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Interactive Chart */}
      <DashboardChart />

      {/* Finished Goods Inventory */}
      {stats && stats.totalReadyStock > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Box className="h-5 w-5 text-primary" />
                Inventori Stok Siap
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Produk siap untuk dijual
              </p>
            </div>
            <Link href="/finished-products">
              <Button variant="outline" size="sm" data-testid="button-view-finished-products">
                Lihat Stok Siap
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Stok Siap</p>
                <p className="text-3xl font-bold font-mono" data-testid="stat-ready-stock">
                  {stats.totalReadyStock}
                </p>
                <p className="text-xs text-muted-foreground mt-1">unit tersedia</p>
              </div>
              
              {stats.expiringSoonCount > 0 && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-md">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                        {stats.expiringSoonCount} batch hampir expired
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        3 hari atau kurang
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20" data-testid="alert-low-stock">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div>
                  <CardTitle className="text-lg">⚠️ Amaran Stok Rendah!</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {lowStockItems.length} item perlu dibeli segera
                  </p>
                </div>
              </div>
              <Link href="/stock">
                <Button variant="outline" size="sm" data-testid="button-view-stock">
                  Lihat Stok
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.slice(0, 3).map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between py-2 px-3 bg-background/50 rounded-md"
                  data-testid={`low-stock-item-${item.id}`}
                >
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <Badge variant="destructive">
                    {parseFloat(item.currentQuantity).toFixed(0)} {item.unit} sahaja
                  </Badge>
                </div>
              ))}
              {lowStockItems.length > 3 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  ...dan {lowStockItems.length - 3} item lagi
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shortcut Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Aksi Pantas</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 grid-cols-2 md:grid-cols-4">
          {shortcuts.map((shortcut) => (
            <Link key={shortcut.title} href={shortcut.href}>
              <Button 
                variant="outline" 
                className="w-full h-auto flex-col gap-2 py-4"
                data-testid={shortcut.testId}
              >
                <shortcut.icon className="h-6 w-6" />
                <span className="text-xs">{shortcut.title}</span>
              </Button>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Recent Deliveries */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle>Status Vendor Terkini</CardTitle>
          <Link href="/deliveries">
            <Button variant="ghost" size="sm" data-testid="button-view-all-deliveries">
              Lihat Semua
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {!recentDeliveries || recentDeliveries.length === 0 ? (
            <div className="text-center py-8">
              <Truck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                Tiada penghantaran terkini
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentDeliveries.slice(0, 5).map((delivery: any) => (
                <div 
                  key={delivery.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover-elevate"
                  data-testid={`delivery-${delivery.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{delivery.vendorName}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(delivery.deliveryDate).toLocaleDateString('ms-MY')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-mono font-medium">RM {delivery.totalAmount}</p>
                    <Badge 
                      variant={
                        delivery.status === "claimed" ? "default" :
                        delivery.status === "pending" ? "secondary" :
                        delivery.status === "rejected" ? "destructive" : "outline"
                      }
                      data-testid={`status-${delivery.id}`}
                    >
                      {delivery.status === "claimed" ? "Dibayar" :
                       delivery.status === "pending" ? "Pending" :
                       delivery.status === "rejected" ? "Ditolak" : "Dihantar"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alerts */}
      {stats?.alerts && stats.alerts.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Notis Penting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {stats.alerts.map((alert: string, index: number) => (
                <li key={index} className="text-sm" data-testid={`alert-${index}`}>
                  • {alert}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <QuickActionsFab actions={quickActions} />
    </div>
  );
}
