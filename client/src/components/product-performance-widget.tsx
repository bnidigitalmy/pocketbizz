import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Package, AlertTriangle } from "lucide-react";

export function ProductPerformanceWidget() {
  const { data: performance, isLoading } = useQuery<any>({
    queryKey: ["/api/analytics/product-performance"],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!performance) return null;

  return (
    <div className="space-y-4">
      {/* Most Profitable Products */}
      {performance.mostProfitable?.length > 0 && (
        <Card className="border-l-4 border-l-green-500" data-testid="card-most-profitable">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Produk Paling Untung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {performance.mostProfitable.slice(0, 3).map((product: any, index: number) => (
              <div
                key={product.productId}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover-elevate"
                data-testid={`item-profitable-${product.productId}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium" data-testid={`text-product-name-${product.productId}`}>
                      {product.productName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {product.totalQtySold} unit terjual
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600" data-testid={`text-profit-${product.productId}`}>
                    RM {product.totalProfit}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {product.profitMargin}% margin
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Fastest Selling Products */}
      {performance.fastestSelling?.length > 0 && (
        <Card className="border-l-4 border-l-blue-500" data-testid="card-fastest-selling">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Produk Paling Laju Jual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {performance.fastestSelling.slice(0, 3).map((product: any, index: number) => (
              <div
                key={product.productId}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover-elevate"
                data-testid={`item-fastest-${product.productId}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium" data-testid={`text-product-name-${product.productId}`}>
                      {product.productName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {product.category}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-blue-600" data-testid={`text-quantity-${product.productId}`}>
                    {product.totalQtySold} unit
                  </p>
                  <p className="text-xs text-muted-foreground">
                    RM {product.totalRevenue}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Most Rejected Products */}
      {performance.mostRejected?.length > 0 && (
        <Card className="border-l-4 border-l-red-500" data-testid="card-most-rejected">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Produk Paling Banyak Reject
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {performance.mostRejected.slice(0, 3).map((product: any, index: number) => (
              <div
                key={product.productId}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover-elevate"
                data-testid={`item-rejected-${product.productId}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-700 font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium" data-testid={`text-product-name-${product.productId}`}>
                      {product.productName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {product.totalRejected} unit reject
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="destructive" data-testid={`badge-rejection-rate-${product.productId}`}>
                    {product.rejectionRate}%
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    kadar reject
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!performance.mostProfitable?.length && 
       !performance.fastestSelling?.length && 
       !performance.mostRejected?.length && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Belum ada data produk untuk dianalisis</p>
            <p className="text-sm mt-1">Mulakan jualan untuk lihat prestasi produk</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
