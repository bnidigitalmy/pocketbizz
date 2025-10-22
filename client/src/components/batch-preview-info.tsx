import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Package, Calendar, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

interface BatchPreviewInfoProps {
  productId: string;
  quantity: number;
  productName?: string;
}

export function BatchPreviewInfo({ productId, quantity, productName }: BatchPreviewInfoProps) {
  const { data: preview, isLoading } = useQuery({
    queryKey: ["/api/batches/preview", productId, quantity],
    queryFn: async () => {
      if (!productId || quantity <= 0) return null;
      
      const response = await apiRequest("POST", "/api/batches/preview", {
        productId,
        quantity,
      });
      
      return await response.json();
    },
    enabled: !!productId && quantity > 0,
  });

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground flex items-center gap-2">
        <Package className="h-4 w-4" />
        <span>Menyemak stok batch...</span>
      </div>
    );
  }

  if (!preview || !preview.success) {
    if (preview && !preview.success) {
      return (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="p-3">
            <div className="flex items-start gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-destructive">Stok Tidak Mencukupi</p>
                <p className="text-muted-foreground mt-1">
                  Diperlukan: <strong>{quantity} unit</strong> • 
                  Tersedia: <strong>{preview.totalAvailable || 0} unit</strong>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
    return null;
  }

  const { deductions } = preview;

  if (!deductions || deductions.length === 0) {
    return null;
  }

  return (
    <Card className="bg-muted/50">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Package className="h-4 w-4" />
          <span>Batch Yang Akan Digunakan (FIFO)</span>
        </div>
        
        <div className="space-y-2">
          {deductions.map((batch: any, index: number) => {
            const daysUntilExpiry = batch.daysUntilExpiry;
            const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7;
            const isCritical = daysUntilExpiry !== null && daysUntilExpiry <= 3;
            
            return (
              <div 
                key={batch.batchId} 
                className={`flex items-start justify-between gap-2 p-2 rounded-md border ${
                  isCritical 
                    ? "bg-destructive/10 border-destructive/50" 
                    : isExpiringSoon 
                    ? "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-500/50" 
                    : "bg-card"
                }`}
                data-testid={`batch-preview-${index}`}
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      Batch #{index + 1}
                    </Badge>
                    <span className="text-sm font-medium">
                      {batch.deductedQty} unit
                    </span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Pengeluaran: {batch.batchDate ? format(new Date(batch.batchDate), 'dd/MM/yyyy') : '-'}
                      </span>
                    </div>
                    
                    {batch.expiryDate && (
                      <div className="flex items-center gap-1">
                        {isExpiringSoon && <AlertTriangle className={`h-3 w-3 ${isCritical ? 'text-destructive' : 'text-yellow-600 dark:text-yellow-500'}`} />}
                        <span className={isExpiringSoon ? (isCritical ? 'text-destructive font-medium' : 'text-yellow-600 dark:text-yellow-500 font-medium') : ''}>
                          Luput: {format(new Date(batch.expiryDate), 'dd/MM/yyyy')}
                          {daysUntilExpiry !== null && (
                            <span className="ml-1">
                              ({daysUntilExpiry <= 0 ? 'Sudah luput!' : `${daysUntilExpiry} hari lagi`})
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground text-right flex-shrink-0">
                  <div>Baki: {batch.remainingBefore}</div>
                  <div className="text-primary">→ {batch.remainingAfter}</div>
                </div>
              </div>
            );
          })}
        </div>
        
        {deductions.some((b: any) => b.daysUntilExpiry !== null && b.daysUntilExpiry <= 7) && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground pt-1 border-t">
            <AlertTriangle className="h-3 w-3 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
            <span>Sistem menggunakan batch paling lama dahulu (FIFO) untuk elakkan pembaziran.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
