import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, CheckCircle2, Printer, ShoppingCart } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

interface StockItem {
  id: string;
  name: string;
  unit: string;
  currentQuantity: string;
  purchasePrice: string;
  lowStockThreshold: string;
  notes: string | null;
}

export default function ShoppingList() {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const { data: lowStockItems = [], isLoading } = useQuery<StockItem[]>({
    queryKey: ["/api/stock/low"],
  });

  const { data: allStockItems = [] } = useQuery<StockItem[]>({
    queryKey: ["/api/stock"],
  });

  // Find out of stock items (quantity = 0 or negative)
  const outOfStockItems = allStockItems.filter(item => parseFloat(item.currentQuantity) <= 0);

  // Combine and deduplicate (in case item is both low and out of stock)
  const combinedItems = [...outOfStockItems, ...lowStockItems];
  const uniqueIds = new Set(combinedItems.map(item => item.id));
  const allItemsToBuy = combinedItems.filter((item, index, self) => 
    self.findIndex(i => i.id === item.id) === index
  );

  const handleToggleItem = (itemId: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemId)) {
      newChecked.delete(itemId);
    } else {
      newChecked.add(itemId);
    }
    setCheckedItems(newChecked);
  };

  const handlePrint = () => {
    window.print();
  };

  const totalEstimatedCost = allItemsToBuy.reduce((total, item) => {
    const pricePerUnit = parseFloat(item.purchasePrice) || 0;
    const currentQty = parseFloat(item.currentQuantity);
    const threshold = parseFloat(item.lowStockThreshold);
    // Estimate: buy enough to reach 2x threshold
    const qtyNeeded = Math.max(0, (threshold * 2) - currentQty);
    return total + (qtyNeeded * pricePerUnit);
  }, 0);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat senarai belian...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-3xl font-bold">📋 Senarai Belian</h1>
          <p className="text-muted-foreground">Item yang perlu dibeli untuk stok gudang</p>
        </div>
        <Button onClick={handlePrint} variant="outline" data-testid="button-print-shopping-list">
          <Printer className="h-4 w-4 mr-2" />
          Cetak
        </Button>
      </div>

      {/* Print Header - Only visible when printing */}
      <div className="hidden print:block mb-6">
        <h1 className="text-3xl font-bold mb-2">📋 Senarai Belian Stok</h1>
        <p className="text-sm text-muted-foreground">
          Tarikh: {new Date().toLocaleDateString('ms-MY', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
        <hr className="my-4" />
      </div>

      {/* Summary Card */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Out of Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{outOfStockItems.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Habis stok</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-amber-600" />
              Stok Rendah
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Perlu tambah</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-green-600" />
              Anggaran Kos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">RM {totalEstimatedCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Untuk beli semua</p>
          </CardContent>
        </Card>
      </div>

      {/* Shopping List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Senarai Item
          </CardTitle>
          <CardDescription>
            {allItemsToBuy.length > 0 
              ? `${allItemsToBuy.length} item perlu dibeli. Tick bila dah beli!` 
              : "Tiada item yang perlu dibeli. Stok mencukupi! 🎉"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allItemsToBuy.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-16 w-16 mx-auto text-green-600 dark:text-green-400 mb-4" />
              <p className="text-lg font-medium">Semua Stok Mencukupi!</p>
              <p className="text-sm text-muted-foreground mt-2">
                Tiada item yang perlu dibeli pada masa ini
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {allItemsToBuy.map((item) => {
                const currentQty = parseFloat(item.currentQuantity);
                const threshold = parseFloat(item.lowStockThreshold);
                const isOutOfStock = currentQty <= 0;
                const qtyNeeded = Math.max(0, (threshold * 2) - currentQty);
                const estimatedCost = qtyNeeded * parseFloat(item.purchasePrice);

                return (
                  <div 
                    key={item.id}
                    className={`flex items-center gap-3 p-4 rounded-lg border ${
                      checkedItems.has(item.id) 
                        ? 'bg-green-50 dark:bg-green-950/20 border-green-200' 
                        : 'bg-card'
                    }`}
                    data-testid={`shopping-item-${item.id}`}
                  >
                    <Checkbox
                      checked={checkedItems.has(item.id)}
                      onCheckedChange={() => handleToggleItem(item.id)}
                      className="print:hidden"
                      data-testid={`checkbox-${item.id}`}
                    />
                    
                    <div className="hidden print:block mr-3">☐</div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-medium ${checkedItems.has(item.id) ? 'line-through text-muted-foreground' : ''}`}>
                          {item.name}
                        </span>
                        {isOutOfStock && (
                          <Badge variant="destructive" className="print:text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Habis
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Stok Semasa: <span className="font-medium">{currentQty.toFixed(1)} {item.unit}</span></div>
                        <div>Cadangan Beli: <span className="font-medium text-primary">{qtyNeeded.toFixed(1)} {item.unit}</span></div>
                        <div>Harga: <span className="font-medium">RM {item.purchasePrice}/{item.unit}</span></div>
                        {item.notes && (
                          <div className="text-xs italic">Nota: {item.notes}</div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        RM {estimatedCost.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">anggaran</div>
                    </div>
                  </div>
                );
              })}

              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Jumlah Anggaran Kos</p>
                    <p className="text-xs text-muted-foreground">
                      ({checkedItems.size} daripada {allItemsToBuy.length} item dibeli)
                    </p>
                  </div>
                  <div className="text-2xl font-bold">
                    RM {totalEstimatedCost.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Print Instructions */}
      <div className="text-center text-sm text-muted-foreground print:hidden">
        💡 Tip: Klik "Cetak" untuk dapatkan senarai dalam format yang cantik untuk dibawa pergi beli barang
      </div>
    </div>
  );
}
