import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, CheckCircle2, Printer, ShoppingCart, Share2, Plus, X, FileText, Minus } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";

// Thermal Printer Styles
const thermalPrintStyles = `
@media print {
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  @page {
    size: 80mm auto;
    margin: 0;
  }
  
  html, body {
    width: 80mm;
    margin: 0;
    padding: 0;
  }
  
  body {
    font-family: 'Courier New', monospace;
    font-size: 9pt;
    line-height: 1.4;
    color: #000;
    background: #fff;
  }
  
  /* Hide all screen content */
  .no-print, .no-print * {
    display: none !important;
  }
  
  /* Show only print content */
  .print-only {
    display: block !important;
    width: 80mm;
    padding: 3mm 4mm;
    margin: 0;
  }
  
  .print-header {
    text-align: center;
    border-bottom: 2px dashed #000;
    padding-bottom: 4mm;
    margin-bottom: 4mm;
  }
  
  .print-header-title {
    font-size: 12pt;
    font-weight: bold;
    margin-bottom: 2mm;
  }
  
  .print-header-date {
    font-size: 8pt;
  }
  
  .print-item {
    margin-bottom: 3mm;
    page-break-inside: avoid;
  }
  
  .print-item-name {
    font-weight: bold;
    font-size: 9pt;
    margin-bottom: 1mm;
  }
  
  .print-item-qty {
    padding-left: 5mm;
    font-size: 8pt;
  }
  
  .print-divider {
    border-top: 1px dashed #000;
    margin: 2mm 0;
  }
  
  .print-footer {
    border-top: 2px dashed #000;
    padding-top: 3mm;
    margin-top: 4mm;
    text-align: center;
  }
  
  .print-footer-total {
    font-weight: bold;
    font-size: 10pt;
    margin-bottom: 1mm;
  }
  
  .print-footer-amount {
    font-size: 8pt;
  }
}
`;

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

interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}

export default function ShoppingList() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [editableCartItems, setEditableCartItems] = useState<Record<string, string>>({});
  const [manualAddOpen, setManualAddOpen] = useState(false);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [selectedStockId, setSelectedStockId] = useState("");
  const [manualQty, setManualQty] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  
  // Supplier selection state
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [customSupplierName, setCustomSupplierName] = useState("");
  const [customSupplierPhone, setCustomSupplierPhone] = useState("");
  const [poNotes, setPoNotes] = useState("");

  const { data: lowStockItems = [], isLoading } = useQuery<StockItem[]>({
    queryKey: ["/api/stock/low"],
  });

  const { data: allStockItems = [] } = useQuery<StockItem[]>({
    queryKey: ["/api/stock"],
  });
  
  const { data: cartItems = [], isLoading: cartLoading } = useQuery<CartItem[]>({
    queryKey: ["/api/shopping-cart"],
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  // Auto-open PO dialog if autoPO parameter is present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("autoPO") === "true" && cartItems.length > 0) {
      setSupplierDialogOpen(true);
      // Clean URL after opening dialog
      window.history.replaceState({}, "", "/stock?tab=shopping");
    }
  }, [cartItems.length]);

  // Initialize editable quantities when cart loads
  if (cartItems.length > 0 && Object.keys(editableCartItems).length === 0) {
    const initialQtys: Record<string, string> = {};
    cartItems.forEach(item => {
      initialQtys[item.id] = item.shortageQty;
    });
    setEditableCartItems(initialQtys);
  }

  const removeCartItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await apiRequest("DELETE", `/api/shopping-cart/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-cart"] });
      toast({
        title: "Item dipadam",
        description: "Item telah dikeluarkan dari cart",
      });
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: async (data: { stockItemId: string; quantity: string; notes: string }) => {
      const stockItem = allStockItems.find(s => s.id === data.stockItemId);
      if (!stockItem) throw new Error("Stock item not found");

      await apiRequest("POST", "/api/shopping-cart", {
        stockItemId: data.stockItemId,
        stockItemName: stockItem.name,
        shortageQty: data.quantity,
        unit: stockItem.unit,
        notes: data.notes || null,
        productionBatchId: null,
        productName: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-cart"] });
      setManualAddOpen(false);
      setSelectedStockId("");
      setManualQty("");
      setManualNotes("");
      toast({
        title: "Berjaya!",
        description: "Item ditambah ke cart",
      });
    },
  });

  const createPOMutation = useMutation({
    mutationFn: async () => {
      if (cartItems.length === 0) {
        throw new Error("Cart kosong");
      }

      // Determine supplier name and phone
      let supplierName = "Supplier Manual";
      let supplierPhone: string | null = null;
      
      if (selectedSupplierId) {
        const supplier = suppliers.find(s => s.id === selectedSupplierId);
        if (supplier) {
          supplierName = supplier.name;
          supplierPhone = supplier.phone;
        }
      } else if (customSupplierName.trim()) {
        supplierName = customSupplierName.trim();
        supplierPhone = customSupplierPhone.trim() || null;
      }

      // Use editable quantities for cart items
      const updatedCartItemIds = cartItems.map(item => item.id);

      // Update cart quantities first if changed
      for (const item of cartItems) {
        const newQty = editableCartItems[item.id];
        if (newQty && newQty !== item.shortageQty) {
          // Remove old item
          await apiRequest("DELETE", `/api/shopping-cart/${item.id}`);
          
          // Add updated item
          await apiRequest("POST", "/api/shopping-cart", {
            stockItemId: item.stockItemId,
            stockItemName: item.stockItemName,
            shortageQty: newQty,
            unit: item.unit,
            notes: item.notes,
            productionBatchId: item.productionBatchId,
            productName: item.productName,
          });
        }
      }

      // Refresh cart to get updated IDs
      await queryClient.invalidateQueries({ queryKey: ["/api/shopping-cart"] });
      const freshCart = await fetch("/api/shopping-cart").then(r => r.json());
      const freshCartIds = freshCart.map((item: CartItem) => item.id);

      const response = await apiRequest("POST", "/api/purchase-orders/from-cart", {
        supplierId: selectedSupplierId,
        supplierName,
        supplierPhone,
        notes: poNotes || null,
        cartItemIds: freshCartIds,
      });

      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Purchase Order Dibuat! 🎉",
        description: `PO ${data.poNumber} telah berjaya dibuat`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      setSupplierDialogOpen(false);
      setSelectedSupplierId(null);
      setCustomSupplierName("");
      setCustomSupplierPhone("");
      setPoNotes("");
      setEditableCartItems({});
      
      // Navigate to PO page
      setLocation("/purchase-orders");
    },
    onError: (error: any) => {
      toast({
        title: "Ralat!",
        description: error.message || "Gagal membuat purchase order",
        variant: "destructive",
      });
    },
  });

  const handleQtyChange = (itemId: string, newQty: string) => {
    setEditableCartItems(prev => ({
      ...prev,
      [itemId]: newQty,
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Cart kosong",
        description: "Tiada item untuk dikongsi",
        variant: "destructive",
      });
      return;
    }

    // Simple clean format - numbering, no icons, no production notes
    let message = "*SENARAI BELIAN*\n";
    message += `Tarikh: ${new Date().toLocaleDateString('ms-MY')}\n\n`;
    
    cartItems.forEach((item, index) => {
      const qty = editableCartItems[item.id] || item.shortageQty;
      message += `${index + 1}. ${item.stockItemName}\n`;
      message += `   Kuantiti: ${parseFloat(qty).toFixed(1)} ${item.unit}\n`;
      message += `\n`;
    });

    message += `\nJumlah: ${cartItems.length} item`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');

    toast({
      title: "WhatsApp dibuka",
      description: "Senarai belian telah disediakan",
    });
  };

  // Quick Add Low Stock Item - One Click!
  const quickAddLowStock = async (item: StockItem) => {
    const currentQty = parseFloat(item.currentQuantity);
    const threshold = parseFloat(item.lowStockThreshold);
    const suggested = Math.max(0, (threshold * 2) - currentQty);

    try {
      await apiRequest("POST", "/api/shopping-cart", {
        stockItemId: item.id,
        stockItemName: item.name,
        shortageQty: suggested.toFixed(1),
        unit: item.unit,
        notes: null,
        productionBatchId: null,
        productName: null,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/shopping-cart"] });
      
      toast({
        title: "✅ Ditambah!",
        description: `${item.name} (${suggested.toFixed(1)} ${item.unit}) ditambah ke cart`,
      });
    } catch (error) {
      toast({
        title: "Ralat",
        description: "Gagal menambah item ke cart",
        variant: "destructive",
      });
    }
  };

  // Quick Add ALL Low Stock Items (excluding those already in cart)
  const quickAddAllLowStock = async () => {
    if (lowStockItems.length === 0) return;

    // Filter out items already in cart
    const itemsToAdd = lowStockItems.filter(
      item => !cartItems.some(ci => ci.stockItemId === item.id)
    );

    if (itemsToAdd.length === 0) {
      toast({
        title: "Tiada item baru",
        description: "Semua item stok rendah sudah dalam cart",
      });
      return;
    }

    try {
      const promises = itemsToAdd.map(async (item) => {
        const currentQty = parseFloat(item.currentQuantity);
        const threshold = parseFloat(item.lowStockThreshold);
        const suggested = Math.max(0, (threshold * 2) - currentQty);

        return apiRequest("POST", "/api/shopping-cart", {
          stockItemId: item.id,
          stockItemName: item.name,
          shortageQty: suggested.toFixed(1),
          unit: item.unit,
          notes: null,
          productionBatchId: null,
          productName: null,
        });
      });

      await Promise.all(promises);
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-cart"] });

      toast({
        title: "🎉 Semua item ditambah!",
        description: `${itemsToAdd.length} item stok rendah ditambah ke cart`,
      });
    } catch (error) {
      toast({
        title: "Ralat",
        description: "Gagal menambah beberapa item",
        variant: "destructive",
      });
    }
  };

  if (isLoading || cartLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  const totalEstimated = cartItems.reduce((sum, item) => {
    const stockItem = allStockItems.find(s => s.id === item.stockItemId);
    if (!stockItem) return sum;
    const qty = parseFloat(editableCartItems[item.id] || item.shortageQty);
    const price = parseFloat(stockItem.purchasePrice);
    return sum + (qty * price);
  }, 0);

  return (
    <>
      <style>{thermalPrintStyles}</style>
      
      {/* Print-only content - Thermal Receipt Format */}
      <div className="print-only" style={{ display: 'none' }}>
        <div className="print-header">
          <div className="print-header-title">SENARAI BELIAN</div>
          <div className="print-header-date">
            {new Date().toLocaleDateString('ms-MY', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
        
        {cartItems.map((item, index) => {
          const qty = editableCartItems[item.id] || item.shortageQty;
          return (
            <div key={item.id} className="print-item">
              <div className="print-item-name">
                {index + 1}. {item.stockItemName}
              </div>
              <div className="print-item-qty">
                Kuantiti: {parseFloat(qty).toFixed(1)} {item.unit}
              </div>
              {index < cartItems.length - 1 && <div className="print-divider" />}
            </div>
          );
        })}
        
        <div className="print-footer">
          <div className="print-footer-total">JUMLAH: {cartItems.length} ITEM</div>
          <div className="print-footer-amount">
            Anggaran: RM {totalEstimated.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Screen content */}
      <div className="no-print container mx-auto py-3 sm:py-6 px-3 sm:px-4 space-y-4 sm:space-y-6">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">🛒 Senarai Belian</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Atur pesanan pembelian untuk supplier</p>
        </div>
        
        {/* Action Buttons - Mobile Responsive */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => setLocation("/purchase-orders")}
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none text-xs sm:text-sm"
            data-testid="button-view-po-history"
          >
            <FileText className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">Sejarah PO</span>
            <span className="sm:hidden ml-1">PO</span>
          </Button>
          <Button 
            onClick={handleShareWhatsApp} 
            variant="default" 
            size="sm"
            className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
            disabled={cartItems.length === 0}
            data-testid="button-share-whatsapp"
          >
            <Share2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="ml-1">WhatsApp</span>
          </Button>
          <Button 
            onClick={handlePrint} 
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none text-xs sm:text-sm"
            disabled={cartItems.length === 0}
            data-testid="button-print-cart"
          >
            <Printer className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="ml-1">Cetak</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards - Mobile Responsive */}
      <div className="grid gap-3 sm:gap-4 grid-cols-3 sm:grid-cols-3">
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
              <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
              <span className="hidden sm:inline">Item dalam Cart</span>
              <span className="sm:hidden">Item</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-3xl font-bold">{cartItems.length}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Sedia PO</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />
              <span className="hidden sm:inline">Stok Rendah</span>
              <span className="sm:hidden">Rendah</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-3xl font-bold">{lowStockItems.length}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              <span className="hidden sm:inline">Perlu tambah</span>
              <span className="sm:hidden">Tambah</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
              <Package className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
              <span className="hidden sm:inline">Anggaran</span>
              <span className="sm:hidden">Kos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-base sm:text-3xl font-bold">RM {totalEstimated.toFixed(2)}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              <span className="hidden sm:inline">Jumlah cart</span>
              <span className="sm:hidden">Jumlah</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Shopping Cart - Mobile Responsive */}
      <Card>
        <CardHeader className="px-3 sm:px-6 py-3 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                Senarai Belian
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                {cartItems.length > 0 
                  ? `${cartItems.length} item. Klik 'Buat PO' bila sedia.` 
                  : "Cart kosong. Tambah item untuk buat PO."}
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Dialog open={manualAddOpen} onOpenChange={setManualAddOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm flex-1 sm:flex-none" data-testid="button-add-manual-item">
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="ml-1">Tambah Item</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-md mx-auto">
                  <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg">Tambah Item Manual</DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                      Pilih item dari stok dan masukkan kuantiti yang diperlukan
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="stock-select" className="text-xs sm:text-sm">Item Stok</Label>
                      <Select value={selectedStockId} onValueChange={setSelectedStockId}>
                        <SelectTrigger id="stock-select" data-testid="select-stock-item" className="text-xs sm:text-sm">
                          <SelectValue placeholder="Pilih item stok..." />
                        </SelectTrigger>
                        <SelectContent>
                          {allStockItems.map(item => (
                            <SelectItem key={item.id} value={item.id} className="text-xs sm:text-sm">
                              {item.name} ({item.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="manual-qty" className="text-xs sm:text-sm">Kuantiti</Label>
                      <Input
                        id="manual-qty"
                        type="number"
                        step="0.1"
                        min="0"
                        value={manualQty}
                        onChange={(e) => setManualQty(e.target.value)}
                        placeholder="Masukkan kuantiti..."
                        className="text-xs sm:text-sm"
                        data-testid="input-manual-qty"
                      />
                    </div>
                    <div>
                      <Label htmlFor="manual-notes" className="text-xs sm:text-sm">Nota (Opsional)</Label>
                      <Textarea
                        id="manual-notes"
                        value={manualNotes}
                        onChange={(e) => setManualNotes(e.target.value)}
                        placeholder="Tambah nota jika perlu..."
                        className="text-xs sm:text-sm"
                        data-testid="textarea-manual-notes"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => {
                        if (!selectedStockId || !manualQty || parseFloat(manualQty) <= 0) {
                          toast({
                            title: "Ralat",
                            description: "Sila pilih item dan masukkan kuantiti",
                            variant: "destructive",
                          });
                          return;
                        }
                        addToCartMutation.mutate({
                          stockItemId: selectedStockId,
                          quantity: manualQty,
                          notes: manualNotes,
                        });
                      }}
                      disabled={addToCartMutation.isPending}
                      className="text-xs sm:text-sm"
                      data-testid="button-confirm-add-item"
                    >
                      {addToCartMutation.isPending ? "Menambah..." : "Tambah ke Cart"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {cartItems.length > 0 && (
                <Dialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default" size="sm" className="text-xs sm:text-sm flex-1 sm:flex-none" data-testid="button-create-po">
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                      <span className="ml-1">Buat PO</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] max-w-md mx-auto">
                    <DialogHeader>
                      <DialogTitle className="text-base sm:text-lg">Pilih Supplier</DialogTitle>
                      <DialogDescription className="text-xs sm:text-sm">
                        Pilih supplier dari senarai atau masukkan nama baru
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="supplier-select" className="text-xs sm:text-sm">Supplier Sedia Ada</Label>
                        <Select 
                          value={selectedSupplierId || "custom"} 
                          onValueChange={(val) => {
                            if (val === "custom") {
                              setSelectedSupplierId(null);
                            } else {
                              setSelectedSupplierId(val);
                            }
                          }}
                        >
                          <SelectTrigger id="supplier-select" data-testid="select-supplier" className="text-xs sm:text-sm">
                            <SelectValue placeholder="Pilih supplier..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="custom" className="text-xs sm:text-sm">+ Supplier Baru (Manual)</SelectItem>
                            {suppliers.map(supplier => (
                              <SelectItem key={supplier.id} value={supplier.id} className="text-xs sm:text-sm">
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {!selectedSupplierId && (
                        <>
                          <div>
                            <Label htmlFor="custom-supplier-name" className="text-xs sm:text-sm">Nama Supplier</Label>
                            <Input
                              id="custom-supplier-name"
                              value={customSupplierName}
                              onChange={(e) => setCustomSupplierName(e.target.value)}
                              placeholder="Masukkan nama supplier..."
                              className="text-xs sm:text-sm"
                              data-testid="input-custom-supplier-name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="custom-supplier-phone" className="text-xs sm:text-sm">Telefon (Opsional)</Label>
                            <Input
                              id="custom-supplier-phone"
                              value={customSupplierPhone}
                              onChange={(e) => setCustomSupplierPhone(e.target.value)}
                              placeholder="012-3456789"
                              className="text-xs sm:text-sm"
                              data-testid="input-custom-supplier-phone"
                            />
                          </div>
                        </>
                      )}

                      <div>
                        <Label htmlFor="po-notes" className="text-xs sm:text-sm">Nota PO (Opsional)</Label>
                        <Textarea
                          id="po-notes"
                          value={poNotes}
                          onChange={(e) => setPoNotes(e.target.value)}
                          placeholder="Tambah nota untuk purchase order..."
                          className="text-xs sm:text-sm"
                          data-testid="textarea-po-notes"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={() => createPOMutation.mutate()}
                        disabled={createPOMutation.isPending || (!selectedSupplierId && !customSupplierName.trim())}
                        className="text-xs sm:text-sm"
                        data-testid="button-confirm-create-po"
                      >
                        {createPOMutation.isPending ? "Mencipta PO..." : "Buat PO"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          {cartItems.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <ShoppingCart className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-base sm:text-lg font-medium">Cart Kosong</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                Klik 'Tambah Item' untuk mulakan pesanan
              </p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {cartItems.map((item) => {
                const stockItem = allStockItems.find(s => s.id === item.stockItemId);
                const qty = editableCartItems[item.id] || item.shortageQty;
                const estimatedCost = stockItem 
                  ? parseFloat(qty) * parseFloat(stockItem.purchasePrice)
                  : 0;

                return (
                  <div 
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border bg-card"
                    data-testid={`cart-item-${item.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-medium text-sm sm:text-base">{item.stockItemName}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="sm:hidden h-8 w-8"
                          onClick={() => removeCartItemMutation.mutate(item.id)}
                          disabled={removeCartItemMutation.isPending}
                          data-testid={`button-remove-${item.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`qty-${item.id}`} className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                            Kuantiti:
                          </Label>
                          <div className="flex items-center gap-1 border rounded-md">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-none"
                              onClick={() => {
                                const currentQty = parseFloat(qty) || 0;
                                const newQty = Math.max(0, currentQty - 1);
                                handleQtyChange(item.id, newQty.toString());
                              }}
                              disabled={parseFloat(qty) <= 0}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              id={`qty-${item.id}`}
                              type="number"
                              step="0.1"
                              min="0"
                              value={qty}
                              onChange={(e) => handleQtyChange(item.id, e.target.value)}
                              className="w-16 sm:w-20 h-8 border-0 text-center text-xs sm:text-sm p-0 focus-visible:ring-0"
                              data-testid={`input-qty-${item.id}`}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-none"
                              onClick={() => {
                                const currentQty = parseFloat(qty) || 0;
                                const newQty = currentQty + 1;
                                handleQtyChange(item.id, newQty.toString());
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <span className="text-xs sm:text-sm text-muted-foreground">{item.unit}</span>
                        </div>
                        
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          Anggaran: <span className="font-medium text-foreground">RM {estimatedCost.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      {item.notes && (
                        <div className="text-[11px] sm:text-xs text-muted-foreground mt-1 italic">
                          Nota: {item.notes}
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="hidden sm:flex"
                      onClick={() => removeCartItemMutation.mutate(item.id)}
                      disabled={removeCartItemMutation.isPending}
                      data-testid={`button-remove-${item.id}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}

              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Jumlah Anggaran Kos</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      ({cartItems.length} item)
                    </p>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold">
                    RM {totalEstimated.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Low Stock Suggestions - Mobile Responsive with Quick Add */}
      {lowStockItems.length > 0 && (() => {
        // Filter out items already in cart
        const availableLowStockItems = lowStockItems.filter(
          item => !cartItems.some(ci => ci.stockItemId === item.id)
        );
        
        if (availableLowStockItems.length === 0) return null;
        
        return (
        <Card className="border-amber-200">
          <CardHeader className="px-3 sm:px-6 py-3 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-amber-700 text-base sm:text-lg">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
                  Cadangan: Item Stok Rendah
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Klik sekali untuk tambah terus ke cart dengan kuantiti cadangan
                </CardDescription>
              </div>
              {availableLowStockItems.length > 1 && (
                <Button
                  variant="default"
                  size="sm"
                  className="text-xs sm:text-sm bg-amber-600 hover:bg-amber-700 w-full sm:w-auto"
                  onClick={quickAddAllLowStock}
                  data-testid="button-add-all-low-stock"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="ml-1">Tambah Semua ({availableLowStockItems.length})</span>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="grid gap-2">
              {availableLowStockItems.slice(0, 5).map((item) => {
                const currentQty = parseFloat(item.currentQuantity);
                const threshold = parseFloat(item.lowStockThreshold);
                const suggested = Math.max(0, (threshold * 2) - currentQty);

                return (
                  <div 
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg border bg-amber-50 dark:bg-amber-950/20"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm sm:text-base">{item.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Stok: {currentQty.toFixed(1)} {item.unit} • 
                        Cadangan: {suggested.toFixed(1)} {item.unit}
                      </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        variant="default"
                        size="sm"
                        className="text-xs sm:text-sm flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
                        onClick={() => quickAddLowStock(item)}
                        data-testid={`button-quick-add-${item.id}`}
                      >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                        <span className="ml-1">Quick Add</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs sm:text-sm"
                        onClick={() => {
                          setSelectedStockId(item.id);
                          setManualQty(suggested.toFixed(1));
                          setManualAddOpen(true);
                        }}
                        data-testid={`button-custom-add-${item.id}`}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        );
      })()}
    </div>
    </>
  );
}
