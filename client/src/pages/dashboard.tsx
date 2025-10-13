import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  AlertCircle
} from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentDeliveries } = useQuery({
    queryKey: ["/api/deliveries/recent"],
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
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
      <div>
        <h1 className="text-2xl font-semibold md:text-3xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Ringkasan perniagaan anda hari ini</p>
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
    </div>
  );
}
