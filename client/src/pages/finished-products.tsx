import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Package, 
  Calendar, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Box
} from "lucide-react";
import { useState } from "react";
import { format, differenceInDays, parseISO } from "date-fns";
import { ms } from "date-fns/locale";

interface FinishedProduct {
  productId: string;
  productName: string;
  totalRemaining: string;
  nearestExpiry: string | null;
  batchCount: string;
}

interface ProductBatch {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  remainingQty: string;
  batchDate: string;
  expiryDate: string | null;
  totalCost: string;
  notes: string | null;
  createdAt: string;
}

export default function FinishedProducts() {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const { data: products, isLoading: productsLoading } = useQuery<FinishedProduct[]>({
    queryKey: ["/api/finished-products"],
  });

  const { data: batches, isLoading: batchesLoading } = useQuery<ProductBatch[]>({
    queryKey: ["/api/finished-products", selectedProduct, "batches"],
    enabled: !!selectedProduct,
  });

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return { status: "unknown", label: "Tiada Expiry", color: "bg-muted" };
    
    const days = differenceInDays(parseISO(expiryDate), new Date());
    
    if (days < 0) {
      return { status: "expired", label: "Expired", color: "bg-destructive/10 text-destructive" };
    } else if (days <= 3) {
      return { status: "warning", label: `${days} hari lagi`, color: "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300" };
    } else if (days <= 7) {
      return { status: "soon", label: `${days} hari lagi`, color: "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300" };
    } else {
      return { status: "fresh", label: "Fresh", color: "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300" };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "expired":
        return <AlertTriangle className="h-4 w-4" />;
      case "warning":
        return <Clock className="h-4 w-4" />;
      case "fresh":
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <Box className="h-4 w-4" />;
    }
  };

  if (productsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading">Stok Siap</h1>
          <p className="text-muted-foreground mt-1">
            Inventori produk siap untuk dijual
          </p>
        </div>
      </div>

      {/* Products Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products?.map((product) => {
          const expiryStatus = getExpiryStatus(product.nearestExpiry);
          const totalRemaining = parseFloat(product.totalRemaining);
          
          return (
            <Card
              key={product.productId}
              className="hover-elevate active-elevate-2 cursor-pointer transition-all"
              onClick={() => setSelectedProduct(product.productId)}
              data-testid={`card-finished-product-${product.productId}`}
            >
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-lg font-medium line-clamp-1">
                  {product.productName}
                </CardTitle>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-mono">{totalRemaining}</span>
                  <span className="text-sm text-muted-foreground">unit</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {product.batchCount} batch
                  </Badge>
                  {product.nearestExpiry && (
                    <Badge className={`text-xs ${expiryStatus.color} flex items-center gap-1`}>
                      {getStatusIcon(expiryStatus.status)}
                      {expiryStatus.label}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {products?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tiada Stok Siap</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Buat produksi untuk menambah stok siap
            </p>
          </CardContent>
        </Card>
      )}

      {/* Batch Details Modal/Sheet */}
      {selectedProduct && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Batch Details - {products?.find(p => p.productId === selectedProduct)?.productName}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedProduct(null)}
                data-testid="button-close-batch-details"
              >
                Tutup
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {batchesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {batches?.map((batch, index) => {
                  const expiryStatus = getExpiryStatus(batch.expiryDate);
                  const remaining = parseFloat(batch.remainingQty);
                  const percentage = (remaining / batch.quantity) * 100;
                  
                  return (
                    <div
                      key={batch.id}
                      className="p-4 rounded-lg border bg-card hover-elevate"
                      data-testid={`batch-item-${batch.id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              FIFO #{index + 1}
                            </Badge>
                            <Badge className={`text-xs ${expiryStatus.color} flex items-center gap-1`}>
                              {getStatusIcon(expiryStatus.status)}
                              {expiryStatus.label}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Tarikh Produksi:</span>
                              <p className="font-medium">
                                {format(parseISO(batch.batchDate), "dd MMM yyyy", { locale: ms })}
                              </p>
                            </div>
                            {batch.expiryDate && (
                              <div>
                                <span className="text-muted-foreground">Expiry Date:</span>
                                <p className="font-medium">
                                  {format(parseISO(batch.expiryDate), "dd MMM yyyy", { locale: ms })}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-4">
                            <div>
                              <span className="text-sm text-muted-foreground">Baki:</span>
                              <p className="text-lg font-bold font-mono">
                                {remaining} / {batch.quantity}
                              </p>
                            </div>
                            <div className="flex-1">
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary transition-all"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {batch.notes && (
                            <p className="text-sm text-muted-foreground italic">
                              {batch.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {batches?.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Tiada batch untuk produk ini
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
