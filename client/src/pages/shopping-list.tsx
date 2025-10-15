import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, CheckCircle2, Printer, ShoppingCart, Share2, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { type BusinessProfile } from "@shared/schema";

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

type UnifiedItem = {
  id: string;
  type: 'cart' | 'stock';
  name: string;
  quantity: string;
  unit: string;
  tag?: string; // For production context
  notes?: string | null;
  estimatedCost?: number;
};

export default function ShoppingList() {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
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

  const { data: businessProfile } = useQuery<BusinessProfile | null>({
    queryKey: ["/api/business-profile"],
  });

  // Find out of stock items (quantity = 0 or negative)
  const outOfStockItems = allStockItems.filter(item => parseFloat(item.currentQuantity) <= 0);

  // Combine and deduplicate (in case item is both low and out of stock)
  const combinedItems = [...outOfStockItems, ...lowStockItems];
  const uniqueIds = new Set(combinedItems.map(item => item.id));
  const allItemsToBuy = combinedItems.filter((item, index, self) => 
    self.findIndex(i => i.id === item.id) === index
  );

  // Create unified list for selection, WhatsApp, and print
  const unifiedItems: UnifiedItem[] = [
    // Cart items (production)
    ...cartItems.map(item => ({
      id: `cart-${item.id}`,
      type: 'cart' as const,
      name: item.stockItemName,
      quantity: item.shortageQty,
      unit: item.unit,
      tag: item.productName ? `Produksi: ${item.productName}` : 'Produksi',
      notes: item.notes,
    })),
    // Low stock items
    ...allItemsToBuy.map(item => {
      const currentQty = parseFloat(item.currentQuantity);
      const threshold = parseFloat(item.lowStockThreshold);
      const qtyNeeded = Math.max(0, (threshold * 2) - currentQty);
      const isOutOfStock = currentQty <= 0;
      return {
        id: `stock-${item.id}`,
        type: 'stock' as const,
        name: item.name,
        quantity: qtyNeeded.toFixed(1),
        unit: item.unit,
        tag: isOutOfStock ? 'Habis Stok' : 'Stok Rendah',
        notes: item.notes,
        estimatedCost: qtyNeeded * parseFloat(item.purchasePrice),
      };
    }),
  ];

  const handleToggleItem = (itemId: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemId)) {
      newChecked.delete(itemId);
    } else {
      newChecked.add(itemId);
    }
    setCheckedItems(newChecked);
  };
  
  const handleSelectAll = () => {
    if (checkedItems.size === unifiedItems.length) {
      setCheckedItems(new Set());
    } else {
      setCheckedItems(new Set(unifiedItems.map(item => item.id)));
    }
  };
  
  const bulkPurchaseMutation = useMutation({
    mutationFn: async () => {
      // Separate cart items and stock items from checked items
      const cartItemIds: string[] = [];
      const stockItemsToUpdate: Array<{id: string, quantity: string}> = [];
      
      checkedItems.forEach(itemId => {
        if (itemId.startsWith('cart-')) {
          cartItemIds.push(itemId.replace('cart-', ''));
        } else if (itemId.startsWith('stock-')) {
          const stockId = itemId.replace('stock-', '');
          const stockItem = allItemsToBuy.find(s => s.id === stockId);
          if (stockItem) {
            const currentQty = parseFloat(stockItem.currentQuantity);
            const threshold = parseFloat(stockItem.lowStockThreshold);
            const qtyNeeded = Math.max(0, (threshold * 2) - currentQty);
            stockItemsToUpdate.push({
              id: stockId,
              quantity: qtyNeeded.toFixed(1),
            });
          }
        }
      });

      // Update cart items if any
      if (cartItemIds.length > 0) {
        const response = await fetch("/api/shopping-cart/purchase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cartItemIds }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to complete cart purchase");
        }
      }

      // Update stock items if any
      if (stockItemsToUpdate.length > 0) {
        for (const item of stockItemsToUpdate) {
          const stockItem = allItemsToBuy.find(s => s.id === item.id);
          if (stockItem) {
            const newQty = parseFloat(stockItem.currentQuantity) + parseFloat(item.quantity);
            const response = await fetch(`/api/stock/${item.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                currentQuantity: newQty.toString(),
              }),
            });
            
            if (!response.ok) {
              throw new Error(`Failed to update ${stockItem.name}`);
            }
          }
        }
      }
      
      return { cartItemIds, stockItemsToUpdate };
    },
    onSuccess: (data) => {
      const totalUpdated = data.cartItemIds.length + data.stockItemsToUpdate.length;
      toast({
        title: "Berjaya!",
        description: `${totalUpdated} item telah dikemaskini`,
      });
      setCheckedItems(new Set());
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock/low"] });
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
    if (unifiedItems.length === 0) {
      toast({
        title: "Tiada item untuk dikongsi",
        description: "Senarai belian kosong",
        variant: "destructive",
      });
      return;
    }

    // Format message for WhatsApp - Unified list with tags
    let message = "";
    
    // Add business header if available
    if (businessProfile) {
      message += `*${businessProfile.businessName}*\n`;
      if (businessProfile.address) message += `${businessProfile.address}\n`;
      if (businessProfile.phone) message += `📞 ${businessProfile.phone}\n`;
      if (businessProfile.email) message += `📧 ${businessProfile.email}\n`;
      message += `\n${"=".repeat(30)}\n\n`;
    }
    
    message += "📋 *PESANAN PEMBELIAN STOK*\n";
    message += `📅 ${new Date().toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}\n\n`;
    
    unifiedItems.forEach((item, index) => {
      const qty = parseFloat(item.quantity);
      const icon = item.tag?.includes('Produksi') ? '🎯' : 
                   item.tag?.includes('Habis') ? '🔴' : '⚠️';
      
      message += `${index + 1}. ${icon} *${item.name}*\n`;
      message += `   📦 Beli: ${qty.toFixed(1)} ${item.unit}\n`;
      message += `   🏷️ ${item.tag}\n`;
      if (item.estimatedCost) {
        message += `   💰 RM ${item.estimatedCost.toFixed(2)}\n`;
      }
      if (item.notes) {
        message += `   📝 ${item.notes}\n`;
      }
      message += `\n`;
    });
    
    const totalCost = unifiedItems.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
    message += `\n${"=".repeat(30)}\n`;
    message += `💰 *JUMLAH ANGGARAN: RM ${totalCost.toFixed(2)}*\n`;
    message += `📊 *JUMLAH ITEM: ${unifiedItems.length}*`;

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
        {businessProfile && (
          <div className="mb-6 pb-4 border-b-2 border-dashed">
            <h2 className="text-2xl font-bold">{businessProfile.businessName}</h2>
            {businessProfile.registrationNumber && (
              <p className="text-sm text-muted-foreground">No. Pendaftaran: {businessProfile.registrationNumber}</p>
            )}
            {businessProfile.address && (
              <p className="text-sm">{businessProfile.address}</p>
            )}
            <div className="flex gap-4 mt-1">
              {businessProfile.phone && <p className="text-sm">Tel: {businessProfile.phone}</p>}
              {businessProfile.email && <p className="text-sm">Email: {businessProfile.email}</p>}
            </div>
          </div>
        )}
        <h1 className="text-3xl font-bold mb-2">📋 PESANAN PEMBELIAN STOK</h1>
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

      {/* Info Reminder */}
      {unifiedItems.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 print:hidden">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                💡 Arahan Penggunaan
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>PENTING:</strong> Klik butang <strong>WhatsApp</strong> atau <strong>Cetak</strong> dahulu untuk hantar ke pekerja/supplier. Lepas sahkan pembelian, senarai akan dikosongkan.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Unified Shopping List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Senarai Belian
              </CardTitle>
              <CardDescription>
                {unifiedItems.length > 0 
                  ? `${unifiedItems.length} item perlu dibeli. Pilih dan sahkan bila dah beli!` 
                  : "Tiada item yang perlu dibeli. Stok mencukupi! 🎉"}
              </CardDescription>
            </div>
            {unifiedItems.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  data-testid="button-select-all"
                >
                  {checkedItems.size === unifiedItems.length ? "Deselect All" : "Select All"}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => bulkPurchaseMutation.mutate()}
                  disabled={checkedItems.size === 0 || bulkPurchaseMutation.isPending}
                  data-testid="button-mark-purchased"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {bulkPurchaseMutation.isPending ? "Mengemaskini..." : `Sahkan Pembelian (${checkedItems.size})`}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {unifiedItems.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-16 w-16 mx-auto text-green-600 dark:text-green-400 mb-4" />
              <p className="text-lg font-medium">Semua Stok Mencukupi!</p>
              <p className="text-sm text-muted-foreground mt-2">
                Tiada item yang perlu dibeli pada masa ini
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {unifiedItems.map((item) => {
                const qty = parseFloat(item.quantity);
                const isProduction = item.type === 'cart';
                const isOutOfStock = item.tag?.includes('Habis');

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
                        <Badge 
                          variant={isProduction ? "default" : isOutOfStock ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {item.tag}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Beli: <span className="font-medium text-primary">{qty.toFixed(1)} {item.unit}</span></div>
                        {item.estimatedCost && (
                          <div>Anggaran: <span className="font-medium">RM {item.estimatedCost.toFixed(2)}</span></div>
                        )}
                        {item.notes && (
                          <div className="text-xs italic">Nota: {item.notes}</div>
                        )}
                      </div>
                    </div>

                    {item.estimatedCost && (
                      <div className="text-right">
                        <div className="text-lg font-semibold">
                          RM {item.estimatedCost.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">kos</div>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Jumlah Anggaran Kos</p>
                    <p className="text-xs text-muted-foreground">
                      ({checkedItems.size} daripada {unifiedItems.length} item dipilih)
                    </p>
                  </div>
                  <div className="text-2xl font-bold">
                    RM {unifiedItems.reduce((sum, item) => sum + (item.estimatedCost || 0), 0).toFixed(2)}
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

      {/* Print Styles - Thermal Printer Optimized */}
      <style>{`
        @media print {
          @page {
            size: 80mm auto; /* Thermal printer width */
            margin: 5mm;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            font-size: 12px;
            line-height: 1.4;
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
          
          /* Thermal printer header */
          .hidden.print\\:block {
            display: block !important;
            text-align: center;
            border-bottom: 2px dashed #333;
            padding-bottom: 8px;
            margin-bottom: 12px;
          }
          
          .hidden.print\\:block h1 {
            font-size: 18px !important;
            font-weight: bold;
            margin-bottom: 4px;
          }
          
          .hidden.print\\:block p {
            font-size: 11px !important;
          }
          
          /* Summary cards - stacked for thermal */
          .grid.md\\:grid-cols-3 {
            display: block !important;
          }
          
          .grid.md\\:grid-cols-3 > * {
            margin-bottom: 8px !important;
            padding: 6px !important;
            border: 1px solid #333 !important;
          }
          
          /* Shopping list items - compact thermal format */
          .space-y-3 > div {
            break-inside: avoid;
            page-break-inside: avoid;
            border-bottom: 1px dashed #ccc !important;
            padding: 8px 0 !important;
            margin: 0 !important;
            background: white !important;
          }
          
          .space-y-3 > div:last-child {
            border-bottom: 2px solid #333 !important;
          }
          
          /* Checkbox area */
          .space-y-3 .hidden.print\\:block {
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            font-size: 16px;
            display: inline-block !important;
            width: 20px;
          }
          
          /* Item text */
          .space-y-3 .flex-1 {
            font-size: 12px !important;
          }
          
          .space-y-3 .flex-1 > div:first-child {
            font-size: 13px !important;
            font-weight: bold;
            margin-bottom: 4px;
          }
          
          /* Badge in thermal */
          .space-y-3 .text-xs {
            font-size: 10px !important;
            padding: 2px 6px !important;
            border: 1px solid #333 !important;
            border-radius: 3px !important;
            background: white !important;
            color: #333 !important;
          }
          
          /* Cost display */
          .space-y-3 .text-right {
            font-size: 13px !important;
            font-weight: bold;
          }
          
          .space-y-3 .text-right .text-xs {
            font-size: 9px !important;
            border: none !important;
          }
          
          /* Total section */
          .border-t {
            border-top: 2px double #333 !important;
            padding-top: 12px !important;
            margin-top: 8px !important;
          }
          
          .border-t .text-2xl {
            font-size: 20px !important;
            font-weight: bold !important;
          }
          
          .border-t .text-sm {
            font-size: 11px !important;
          }
          
          .border-t .text-xs {
            font-size: 10px !important;
          }
          
          /* Remove card styling for thermal */
          .rounded-lg.border {
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          
          /* Footer separator */
          .text-center.text-sm.text-muted-foreground {
            display: block !important;
            border-top: 2px dashed #333;
            padding-top: 8px;
            margin-top: 12px;
            font-size: 10px !important;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
