import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, CheckCircle2, Printer, ShoppingCart, Share2, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface StockItem {
  id: string;
  name: string;
  unit: string;
  currentQuantity: string;
  purchasePrice: string;
  lowStockThreshold: string;
  notes: string | null;
}

interface CartItem {
  id: string;
  stockItemId: string;
  stockItemName: string;
  shortageQty: string;
  unit: string;
  productionBatchId: string | null;
  productName: string | null;
  notes: string | null;
  createdAt: string;
}

export default function ShoppingList() {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [checkedCartItems, setCheckedCartItems] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const { data: lowStockItems = [], isLoading } = useQuery<StockItem[]>({
    queryKey: ["/api/stock/low"],
  });

  const { data: allStockItems = [] } = useQuery<StockItem[]>({
    queryKey: ["/api/stock"],
  });
  
  const { data: cartItems = [], isLoading: cartLoading } = useQuery<CartItem[]>({
    queryKey: ["/api/shopping-cart"],
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
  
  const handleToggleCartItem = (itemId: string) => {
    const newChecked = new Set(checkedCartItems);
    if (newChecked.has(itemId)) {
      newChecked.delete(itemId);
    } else {
      newChecked.add(itemId);
    }
    setCheckedCartItems(newChecked);
  };
  
  const handleSelectAllCart = () => {
    if (checkedCartItems.size === cartItems.length) {
      setCheckedCartItems(new Set());
    } else {
      setCheckedCartItems(new Set(cartItems.map(item => item.id)));
    }
  };
  
  const bulkPurchaseMutation = useMutation({
    mutationFn: async () => {
      const cartItemIds = Array.from(checkedCartItems);
      const response = await fetch("/api/shopping-cart/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItemIds }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to complete purchase");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Berjaya!",
        description: "Stok telah dikemaskini dan item dikeluarkan dari senarai",
      });
      setCheckedCartItems(new Set());
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock"] });
    },
    onError: (error: any) => {
      toast({
        title: "Ralat!",
        description: error.message || "Gagal mengemaskini stok",
        variant: "destructive",
      });
    },
  });

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    if (allItemsToBuy.length === 0 && cartItems.length === 0) {
      toast({
        title: "Tiada item untuk dikongsi",
        description: "Senarai belian kosong",
        variant: "destructive",
      });
      return;
    }

    // Format message for WhatsApp
    let message = "📋 *SENARAI BELIAN STOK*\n";
    message += `📅 ${new Date().toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}\n\n`;
    
    // Cart items (production shortages) - show first with production context
    if (cartItems.length > 0) {
      message += "🎯 *KEPERLUAN PRODUKSI*\n";
      cartItems.forEach((item, index) => {
        const shortage = parseFloat(item.shortageQty);
        message += `${index + 1}. 🔴 *${item.stockItemName}*\n`;
        message += `   • Kurang: ${shortage.toFixed(1)} ${item.unit}\n`;
        if (item.productName) {
          message += `   • Untuk: ${item.productName}\n`;
        }
        if (item.notes) {
          message += `   • Nota: ${item.notes}\n`;
        }
        message += `\n`;
      });
      message += `\n`;
    }
    
    // General low stock items
    if (allItemsToBuy.length > 0) {
      message += "📦 *STOK RENDAH/HABIS*\n";
      allItemsToBuy.forEach((item, index) => {
        const currentQty = parseFloat(item.currentQuantity);
        const threshold = parseFloat(item.lowStockThreshold);
        const qtyNeeded = Math.max(0, (threshold * 2) - currentQty);
        const isOutOfStock = currentQty <= 0;
        
        message += `${index + 1}. ${isOutOfStock ? '🔴 ' : '⚠️ '}*${item.name}*\n`;
        message += `   • Stok: ${currentQty.toFixed(1)} ${item.unit}\n`;
        message += `   • Beli: ${qtyNeeded.toFixed(1)} ${item.unit}\n`;
        message += `   • Harga: RM ${item.purchasePrice}/${item.unit}\n`;
        if (item.notes) {
          message += `   • Nota: ${item.notes}\n`;
        }
        message += `\n`;
      });
    }
    
    message += `\n💰 *JUMLAH ANGGARAN: RM ${totalEstimatedCost.toFixed(2)}*\n\n`;
    message += `📊 Ringkasan:\n`;
    message += `• Produksi: ${cartItems.length} item\n`;
    message += `• Habis stok: ${outOfStockItems.length} item\n`;
    message += `• Stok rendah: ${lowStockItems.length} item\n`;
    message += `• Jumlah: ${cartItems.length + allItemsToBuy.length} item`;

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');

    toast({
      title: "WhatsApp dibuka",
      description: "Senarai belian telah disediakan untuk dihantar",
    });
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
        <div className="flex gap-2">
          <Button 
            onClick={handleShareWhatsApp} 
            variant="default" 
            className="bg-green-600 hover:bg-green-700"
            data-testid="button-share-whatsapp"
          >
            <Share2 className="h-4 w-4 mr-2" />
            WhatsApp
          </Button>
          <Button onClick={handlePrint} variant="outline" data-testid="button-print-shopping-list">
            <Printer className="h-4 w-4 mr-2" />
            Cetak
          </Button>
        </div>
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

      {/* Production Shopping Cart */}
      {cartItems.length > 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Keperluan Produksi
                </CardTitle>
                <CardDescription>
                  Item yang kurang untuk produksi. Pilih dan sahkan bila dah beli!
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllCart}
                  data-testid="button-select-all-cart"
                >
                  {checkedCartItems.size === cartItems.length ? "Deselect All" : "Select All"}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => bulkPurchaseMutation.mutate()}
                  disabled={checkedCartItems.size === 0 || bulkPurchaseMutation.isPending}
                  data-testid="button-mark-purchased"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {bulkPurchaseMutation.isPending ? "Mengemaskini..." : `Sahkan Pembelian (${checkedCartItems.size})`}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cartItems.map((item) => {
                const shortage = parseFloat(item.shortageQty);
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-4 rounded-lg border ${
                      checkedCartItems.has(item.id)
                        ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300'
                        : 'bg-white dark:bg-card'
                    }`}
                    data-testid={`cart-item-${item.id}`}
                  >
                    <Checkbox
                      checked={checkedCartItems.has(item.id)}
                      onCheckedChange={() => handleToggleCartItem(item.id)}
                      data-testid={`checkbox-cart-${item.id}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{item.stockItemName}</h4>
                        {item.productName && (
                          <Badge variant="outline" className="text-xs">
                            {item.productName}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                        <div>Kurang: <span className="font-mono font-semibold text-destructive">{shortage.toFixed(1)} {item.unit}</span></div>
                        {item.notes && <div className="text-xs italic">{item.notes}</div>}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
        💡 Tip: Klik "Cetak" untuk dapatkan senarai dalam format yang cantik untuk dibawa pergi beli barang, atau "WhatsApp" untuk hantar ke pekerja
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 1.5cm;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .container {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Hide unnecessary elements */
          nav, header, footer, .print\\:hidden {
            display: none !important;
          }
          
          /* Optimize card spacing for print */
          .space-y-6 > * + * {
            margin-top: 1rem !important;
          }
          
          /* Make cards print-friendly - target actual card divs */
          .rounded-lg.border {
            break-inside: avoid;
            page-break-inside: avoid;
            border: 1px solid #ddd !important;
            box-shadow: none !important;
          }
          
          /* Shopping list item containers */
          .space-y-3 > div {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          
          /* Adjust text sizes for print */
          .text-3xl {
            font-size: 1.5rem !important;
          }
          
          .text-2xl {
            font-size: 1.25rem !important;
          }
          
          .text-lg {
            font-size: 1rem !important;
          }
          
          /* Ensure checkboxes print as boxes */
          .hidden.print\\:block {
            display: block !important;
          }
          
          /* Grid responsive for print */
          .grid {
            display: grid !important;
            gap: 0.5rem !important;
          }
          
          .md\\:grid-cols-3 {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          
          /* Shopping list items */
          .space-y-3 > * + * {
            margin-top: 0.5rem !important;
          }
          
          /* Preserve background colors for badges */
          [class*="bg-red"], [class*="bg-amber"], [class*="bg-green"] {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
