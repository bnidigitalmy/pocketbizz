import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package, ShoppingCart } from "lucide-react";
import { Link } from "wouter";

interface StockItem {
  id: string;
  name: string;
  currentQuantity: string;
  lowStockThreshold: string;
  unit: string;
}

interface FinishedProduct {
  productId: string;
  productName: string;
  totalQuantity: string;
}

export function LowStockAlertWidget() {
  const { data: lowStockItems = [] } = useQuery<StockItem[]>({
    queryKey: ["/api/stock/low"],
  });

  const { data: lowFinishedProducts = [] } = useQuery<FinishedProduct[]>({
    queryKey: ["/api/finished-products/low"],
  });

  const totalAlerts = lowStockItems.length + lowFinishedProducts.length;

  if (totalAlerts === 0) {
    return null; // Don't show widget if no alerts
  }

  return (
    <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500" />
          <span>Amaran Stok Rendah</span>
        </CardTitle>
        <Badge variant="destructive" className="text-xs" data-testid="badge-low-stock-count">
          {totalAlerts}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Low Raw Materials */}
        {lowStockItems.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Package className="w-4 h-4" />
              <span>Bahan Mentah</span>
            </div>
            <div className="space-y-1.5">
              {lowStockItems.slice(0, 3).map((item) => {
                const currentQty = parseFloat(item.currentQuantity);
                const threshold = parseFloat(item.lowStockThreshold);
                const isVeryLow = currentQty < threshold / 2;
                
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-sm p-2 rounded-md bg-background/50"
                    data-testid={`alert-stock-${item.id}`}
                  >
                    <span className="font-medium truncate flex-1">{item.name}</span>
                    <Badge
                      variant={isVeryLow ? "destructive" : "secondary"}
                      className="text-xs ml-2"
                    >
                      {currentQty} {item.unit}
                    </Badge>
                  </div>
                );
              })}
              {lowStockItems.length > 3 && (
                <Link href="/stock">
                  <a className="text-xs text-primary hover:underline block text-center pt-1" data-testid="link-view-all-stock">
                    +{lowStockItems.length - 3} lagi...
                  </a>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Low Finished Products */}
        {lowFinishedProducts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ShoppingCart className="w-4 h-4" />
              <span>Produk Siap</span>
            </div>
            <div className="space-y-1.5">
              {lowFinishedProducts.slice(0, 3).map((product) => {
                const qty = parseFloat(product.totalQuantity);
                const isVeryLow = qty < 5;
                
                return (
                  <div
                    key={product.productId}
                    className="flex items-center justify-between text-sm p-2 rounded-md bg-background/50"
                    data-testid={`alert-finished-${product.productId}`}
                  >
                    <span className="font-medium truncate flex-1">{product.productName}</span>
                    <Badge
                      variant={isVeryLow ? "destructive" : "secondary"}
                      className="text-xs ml-2"
                    >
                      {qty} unit
                    </Badge>
                  </div>
                );
              })}
              {lowFinishedProducts.length > 3 && (
                <Link href="/finished-products">
                  <a className="text-xs text-primary hover:underline block text-center pt-1" data-testid="link-view-all-finished">
                    +{lowFinishedProducts.length - 3} lagi...
                  </a>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Quick Action */}
        <Link href="/shopping-cart">
          <a
            className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-md bg-primary text-primary-foreground hover-elevate active-elevate-2 text-sm font-medium"
            data-testid="button-restock-now"
          >
            <ShoppingCart className="w-4 h-4" />
            Senarai Beli-Belah
          </a>
        </Link>
      </CardContent>
    </Card>
  );
}
