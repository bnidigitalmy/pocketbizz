import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, CheckCircle2, Printer, ShoppingCart, Share2, Plus, X, FileText } from "lucide-react";
import { useState } from "react";
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

    let message = "📋 *SENARAI BELIAN*\n";
    message += `📅 ${new Date().toLocaleDateString('ms-MY')}\n\n`;
    
    cartItems.forEach((item, index) => {
      const qty = editableCartItems[item.id] || item.shortageQty;
      message += `${index + 1}. *${item.stockItemName}*\n`;
      message += `   📦 ${parseFloat(qty).toFixed(1)} ${item.unit}\n`;
      if (item.notes) {
        message += `   📝 ${item.notes}\n`;
      }
      message += `\n`;
    });

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');

    toast({
      title: "WhatsApp dibuka",
      description: "Senarai belian telah disediakan",
    });
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
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">🛒 Shopping Cart</h1>
          <p className="text-muted-foreground">Atur pesanan pembelian untuk supplier</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setLocation("/purchase-orders")}
            variant="outline"
            data-testid="button-view-po-history"
          >
            <FileText className="h-4 w-4 mr-2" />
            Sejarah PO
          </Button>
          <Button 
            onClick={handleShareWhatsApp} 
            variant="default" 
            className="bg-green-600 hover:bg-green-700"
            disabled={cartItems.length === 0}
            data-testid="button-share-whatsapp"
          >
            <Share2 className="h-4 w-4 mr-2" />
            WhatsApp
          </Button>
          <Button 
            onClick={handlePrint} 
            variant="outline"
            disabled={cartItems.length === 0}
            data-testid="button-print-cart"
          >
            <Printer className="h-4 w-4 mr-2" />
            Cetak
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-blue-600" />
              Item dalam Cart
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{cartItems.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Sedia untuk PO</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Stok Rendah
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Perlu tambah ke cart</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-green-600" />
              Anggaran Kos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">RM {totalEstimated.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Jumlah cart</p>
          </CardContent>
        </Card>
      </div>

      {/* Shopping Cart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Shopping Cart
              </CardTitle>
              <CardDescription>
                {cartItems.length > 0 
                  ? `${cartItems.length} item. Klik 'Buat Purchase Order' bila sedia.` 
                  : "Cart kosong. Tambah item untuk buat PO."}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={manualAddOpen} onOpenChange={setManualAddOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" data-testid="button-add-manual-item">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tambah Item Manual</DialogTitle>
                    <DialogDescription>
                      Pilih item dari stok dan masukkan kuantiti yang diperlukan
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="stock-select">Item Stok</Label>
                      <Select value={selectedStockId} onValueChange={setSelectedStockId}>
                        <SelectTrigger id="stock-select" data-testid="select-stock-item">
                          <SelectValue placeholder="Pilih item stok..." />
                        </SelectTrigger>
                        <SelectContent>
                          {allStockItems.map(item => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} ({item.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="manual-qty">Kuantiti</Label>
                      <Input
                        id="manual-qty"
                        type="number"
                        step="0.1"
                        min="0"
                        value={manualQty}
                        onChange={(e) => setManualQty(e.target.value)}
                        placeholder="Masukkan kuantiti..."
                        data-testid="input-manual-qty"
                      />
                    </div>
                    <div>
                      <Label htmlFor="manual-notes">Nota (Opsional)</Label>
                      <Textarea
                        id="manual-notes"
                        value={manualNotes}
                        onChange={(e) => setManualNotes(e.target.value)}
                        placeholder="Tambah nota jika perlu..."
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
                    <Button variant="default" size="sm" data-testid="button-create-po">
                      <FileText className="h-4 w-4 mr-2" />
                      Buat Purchase Order
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Pilih Supplier</DialogTitle>
                      <DialogDescription>
                        Pilih supplier dari senarai atau masukkan nama baru
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="supplier-select">Supplier Sedia Ada</Label>
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
                          <SelectTrigger id="supplier-select" data-testid="select-supplier">
                            <SelectValue placeholder="Pilih supplier..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="custom">+ Supplier Baru (Manual)</SelectItem>
                            {suppliers.map(supplier => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {!selectedSupplierId && (
                        <>
                          <div>
                            <Label htmlFor="custom-supplier-name">Nama Supplier</Label>
                            <Input
                              id="custom-supplier-name"
                              value={customSupplierName}
                              onChange={(e) => setCustomSupplierName(e.target.value)}
                              placeholder="Masukkan nama supplier..."
                              data-testid="input-custom-supplier-name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="custom-supplier-phone">Telefon (Opsional)</Label>
                            <Input
                              id="custom-supplier-phone"
                              value={customSupplierPhone}
                              onChange={(e) => setCustomSupplierPhone(e.target.value)}
                              placeholder="012-3456789"
                              data-testid="input-custom-supplier-phone"
                            />
                          </div>
                        </>
                      )}

                      <div>
                        <Label htmlFor="po-notes">Nota PO (Opsional)</Label>
                        <Textarea
                          id="po-notes"
                          value={poNotes}
                          onChange={(e) => setPoNotes(e.target.value)}
                          placeholder="Tambah nota untuk purchase order..."
                          data-testid="textarea-po-notes"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={() => createPOMutation.mutate()}
                        disabled={createPOMutation.isPending || (!selectedSupplierId && !customSupplierName.trim())}
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
        <CardContent>
          {cartItems.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Cart Kosong</p>
              <p className="text-sm text-muted-foreground mt-2">
                Klik 'Tambah Item' untuk mulakan pesanan
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item) => {
                const stockItem = allStockItems.find(s => s.id === item.stockItemId);
                const qty = editableCartItems[item.id] || item.shortageQty;
                const estimatedCost = stockItem 
                  ? parseFloat(qty) * parseFloat(stockItem.purchasePrice)
                  : 0;

                return (
                  <div 
                    key={item.id}
                    className="flex items-center gap-3 p-4 rounded-lg border bg-card"
                    data-testid={`cart-item-${item.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{item.stockItemName}</span>
                        {item.productName && (
                          <Badge variant="default" className="text-xs">
                            Produksi: {item.productName}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`qty-${item.id}`} className="text-sm text-muted-foreground">
                            Kuantiti:
                          </Label>
                          <Input
                            id={`qty-${item.id}`}
                            type="number"
                            step="0.1"
                            min="0"
                            value={qty}
                            onChange={(e) => handleQtyChange(item.id, e.target.value)}
                            className="w-24"
                            data-testid={`input-qty-${item.id}`}
                          />
                          <span className="text-sm text-muted-foreground">{item.unit}</span>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          Anggaran: <span className="font-medium">RM {estimatedCost.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      {item.notes && (
                        <div className="text-xs text-muted-foreground mt-1 italic">
                          Nota: {item.notes}
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCartItemMutation.mutate(item.id)}
                      disabled={removeCartItemMutation.isPending}
                      data-testid={`button-remove-${item.id}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}

              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Jumlah Anggaran Kos</p>
                    <p className="text-xs text-muted-foreground">
                      ({cartItems.length} item)
                    </p>
                  </div>
                  <div className="text-2xl font-bold">
                    RM {totalEstimated.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Low Stock Suggestions */}
      {lowStockItems.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
              Cadangan: Item Stok Rendah
            </CardTitle>
            <CardDescription>
              Item ini perlu tambah stok. Klik untuk tambah ke cart.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {lowStockItems.slice(0, 5).map((item) => {
                const currentQty = parseFloat(item.currentQuantity);
                const threshold = parseFloat(item.lowStockThreshold);
                const suggested = Math.max(0, (threshold * 2) - currentQty);

                return (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-amber-50 dark:bg-amber-950/20"
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Stok semasa: {currentQty.toFixed(1)} {item.unit} • 
                        Cadangan beli: {suggested.toFixed(1)} {item.unit}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedStockId(item.id);
                        setManualQty(suggested.toFixed(1));
                        setManualAddOpen(true);
                      }}
                      data-testid={`button-suggest-${item.id}`}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
