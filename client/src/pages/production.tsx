import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  ChefHat, 
  Calendar as CalendarIcon, 
  AlertTriangle, 
  CheckCircle2,
  XCircle,
  ShoppingCart,
  Package,
  ArrowRight
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type MaterialPreview = {
  stockItemId: string;
  stockItemName: string;
  quantityNeeded: number;
  usageUnit: string;
  currentStock: number;
  stockUnit: string;
  isSufficient: boolean;
  shortage: number;
  convertedQuantity: number;
};

type ProductionPlan = {
  product: {
    id: string;
    name: string;
    unitsPerBatch: number;
    totalCostPerBatch: string;
  };
  quantity: number;
  materialsNeeded: MaterialPreview[];
  allStockSufficient: boolean;
  totalProductionCost: number;
};

export default function Production() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [step, setStep] = useState<'select' | 'preview' | 'confirm'>('select');
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [batchDate, setBatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [productionPlan, setProductionPlan] = useState<ProductionPlan | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: batches = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/production"],
  });

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  // Preview production plan mutation
  const previewMutation = useMutation<ProductionPlan, Error, void>({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/production/plan-preview", {
        productId: selectedProductId,
        quantity
      });
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      setProductionPlan(data);
      setStep('preview');
    },
    onError: (error) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal mendapatkan preview produksi",
        variant: "destructive",
      });
    }
  });

  // Confirm production mutation
  const confirmMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/production/confirm", {
        productId: selectedProductId,
        quantity,
        batchDate,
        expiryDate: expiryDate || null,
        notes: notes || null,
        materialsNeeded: productionPlan?.materialsNeeded
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock/low"] });
      
      toast({
        title: "Berjaya! ✅",
        description: "Produksi telah direkod dan stok telah dikurangkan.",
      });
      
      resetDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal merekod produksi",
        variant: "destructive",
      });
    }
  });

  const resetDialog = () => {
    setDialogOpen(false);
    setStep('select');
    setSelectedProductId("");
    setQuantity(1);
    setBatchDate(new Date().toISOString().split('T')[0]);
    setExpiryDate("");
    setNotes("");
    setProductionPlan(null);
  };

  const handlePreview = () => {
    if (!selectedProductId || quantity < 1) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Sila pilih produk dan masukkan kuantiti",
        variant: "destructive",
      });
      return;
    }
    previewMutation.mutate();
  };

  const addToCartMutation = useMutation({
    mutationFn: async (items: any[]) => {
      // Add each item to shopping cart
      for (const item of items) {
        const response = await fetch("/api/shopping-cart", {
          method: "POST",
          body: JSON.stringify({
            stockItemId: item.stockItemId,
            stockItemName: item.stockItemName,
            shortageQty: item.shortage.toString(),
            unit: item.stockUnit,
            productionBatchId: null, // Will be set after production batch is created
            productName: productionPlan?.product?.name || null,
            notes: `Untuk produksi ${productionPlan?.product?.name}`,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to add item to cart");
        }
      }
    },
    onSuccess: () => {
      toast({
        title: "Berjaya!",
        description: "Item telah ditambah ke senarai belian",
      });
      // Navigate to shopping list
      setDialogOpen(false);
      setLocation("/stock?tab=shopping");
    },
    onError: (error: any) => {
      toast({
        title: "Ralat!",
        description: error.message || "Gagal menambah ke senarai belian",
        variant: "destructive",
      });
    },
  });

  const handleAddToShoppingList = () => {
    if (!productionPlan) return;
    
    const insufficientItems = productionPlan.materialsNeeded.filter(m => !m.isSufficient);
    
    if (insufficientItems.length === 0) return;
    
    addToCartMutation.mutate(insufficientItems);
  };

  const handleConfirm = () => {
    if (!productionPlan?.allStockSufficient) {
      toast({
        title: "Stok Tidak Mencukupi",
        description: "Sila beli bahan yang kurang terlebih dahulu",
        variant: "destructive",
      });
      return;
    }
    
    confirmMutation.mutate();
  };

  // Expiry tracking helpers
  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    return expiry < today;
  };

  const isExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const twoDaysFromNow = new Date(today);
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    return expiry >= today && expiry <= twoDaysFromNow;
  };

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    if (isExpired(expiryDate)) return "expired";
    if (isExpiringSoon(expiryDate)) return "expiring";
    return "fresh";
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold md:text-3xl">Produksi</h1>
          <p className="text-sm text-muted-foreground mt-1">Rancang dan rekod pengeluaran produk</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-plan-production">
              <Plus className="h-4 w-4 mr-2" />
              Rancang Produksi
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {step === 'select' && 'Rancang Produksi Baru'}
                {step === 'preview' && 'Preview Bahan Diperlukan'}
                {step === 'confirm' && 'Pengesahan Produksi'}
              </DialogTitle>
              <DialogDescription>
                {step === 'select' && 'Pilih produk dan kuantiti yang ingin dihasilkan'}
                {step === 'preview' && 'Semak keperluan bahan dan status stok'}
                {step === 'confirm' && 'Sahkan maklumat produksi'}
              </DialogDescription>
            </DialogHeader>

            {/* Step 1: Product Selection */}
            {step === 'select' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="product">Produk</Label>
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger id="product" data-testid="select-product">
                      <SelectValue placeholder="Pilih produk" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((product: any) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Kuantiti (unit)</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    data-testid="input-quantity"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={resetDialog}>
                    Batal
                  </Button>
                  <Button 
                    onClick={handlePreview}
                    disabled={previewMutation.isPending || !selectedProductId}
                    data-testid="button-preview"
                  >
                    {previewMutation.isPending ? "Mengira..." : "Preview Bahan"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Materials Preview */}
            {step === 'preview' && productionPlan && (
              <div className="space-y-4">
                {/* Production Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Maklumat Produksi</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Produk:</span>
                      <span className="font-medium">{productionPlan.product.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kuantiti:</span>
                      <span className="font-medium">{productionPlan.quantity} unit</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Anggaran Kos:</span>
                      <span className="font-mono font-semibold">
                        RM {productionPlan.totalProductionCost.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Stock Status Alert */}
                {!productionPlan.allStockSufficient && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Stok Tidak Mencukupi</AlertTitle>
                    <AlertDescription>
                      Terdapat bahan yang kurang. Sila beli bahan terlebih dahulu atau tambah ke senarai belian.
                    </AlertDescription>
                  </Alert>
                )}

                {productionPlan.allStockSufficient && (
                  <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-600">Stok Mencukupi</AlertTitle>
                    <AlertDescription className="text-green-600">
                      Semua bahan tersedia. Boleh teruskan produksi.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Materials List */}
                <div className="space-y-2">
                  <h3 className="font-medium text-sm">Bahan Diperlukan</h3>
                  <div className="space-y-2">
                    {productionPlan.materialsNeeded.map((material) => (
                      <Card key={material.stockItemId} className={
                        material.isSufficient ? "" : "border-destructive"
                      }>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <p className="font-medium truncate">{material.stockItemName}</p>
                              </div>
                              <div className="mt-2 space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Diperlukan:</span>
                                  <span className="font-mono">
                                    {material.quantityNeeded.toFixed(2)} {material.usageUnit}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Stok Semasa:</span>
                                  <span className={`font-mono ${material.isSufficient ? '' : 'text-destructive font-semibold'}`}>
                                    {material.currentStock.toFixed(2)} {material.stockUnit}
                                  </span>
                                </div>
                                {!material.isSufficient && (
                                  <div className="flex justify-between">
                                    <span className="text-destructive font-medium">Kurang:</span>
                                    <span className="font-mono text-destructive font-semibold">
                                      {material.shortage.toFixed(2)} {material.stockUnit}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              {material.isSufficient ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ) : (
                                <XCircle className="h-5 w-5 text-destructive" />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between gap-2 pt-4">
                  <Button variant="outline" onClick={() => setStep('select')}>
                    Kembali
                  </Button>
                  <div className="flex gap-2">
                    {!productionPlan.allStockSufficient && (
                      <Button 
                        variant="outline" 
                        onClick={handleAddToShoppingList}
                        data-testid="button-add-to-shopping"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Tambah ke Senarai Belian
                      </Button>
                    )}
                    <Button 
                      onClick={() => setStep('confirm')}
                      disabled={!productionPlan.allStockSufficient}
                      data-testid="button-next-confirm"
                    >
                      Teruskan
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 'confirm' && productionPlan && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="batch-date">Tarikh Produksi</Label>
                  <Input
                    id="batch-date"
                    type="date"
                    value={batchDate}
                    onChange={(e) => setBatchDate(e.target.value)}
                    data-testid="input-batch-date"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiry-date">Tarikh Luput (Optional)</Label>
                  <Input
                    id="expiry-date"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    data-testid="input-expiry-date"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Nota (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Catatan tambahan untuk batch ini..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    data-testid="input-notes"
                  />
                </div>

                {/* Summary */}
                <Card className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Ringkasan</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Produk:</span>
                      <span className="font-medium">{productionPlan.product.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kuantiti:</span>
                      <span className="font-medium">{productionPlan.quantity} unit</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Jumlah Kos:</span>
                      <span className="font-mono font-semibold">
                        RM {productionPlan.totalProductionCost.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bahan:</span>
                      <span className="font-medium">
                        {productionPlan.materialsNeeded.length} item
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Pengesahan</AlertTitle>
                  <AlertDescription>
                    Stok bahan akan dikurangkan secara automatik selepas pengesahan.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-between gap-2 pt-4">
                  <Button variant="outline" onClick={() => setStep('preview')}>
                    Kembali
                  </Button>
                  <Button 
                    onClick={handleConfirm}
                    disabled={confirmMutation.isPending}
                    data-testid="button-confirm-production"
                  >
                    {confirmMutation.isPending ? "Merekod..." : "Sahkan Produksi"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Production History */}
      {!batches || batches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <ChefHat className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-medium mb-1">Tiada Rekod Produksi</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Mulakan dengan merancang produksi pertama
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Sejarah Produksi</h2>
          {batches.map((batch: any) => {
            const expiryStatus = getExpiryStatus(batch.expiryDate);
            return (
              <Card key={batch.id} className="hover-elevate" data-testid={`batch-card-${batch.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="truncate text-base">{batch.productName}</CardTitle>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="secondary">
                          {batch.quantity} unit
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(batch.batchDate).toLocaleDateString('ms-MY')}
                        </span>
                        {expiryStatus === "expired" && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Luput
                          </Badge>
                        )}
                        {expiryStatus === "expiring" && (
                          <Badge variant="outline" className="gap-1 border-orange-500 text-orange-600 dark:text-orange-400">
                            <AlertTriangle className="h-3 w-3" />
                            Hampir Luput
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Kos</p>
                      <p className="font-mono font-semibold text-lg">RM {batch.totalCost}</p>
                    </div>
                  </div>
                </CardHeader>
                {(batch.expiryDate || batch.notes) && (
                  <CardContent className="pt-0 space-y-2">
                    {batch.expiryDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Luput:</span>
                        <span className={
                          expiryStatus === "expired" 
                            ? "text-destructive font-medium"
                            : expiryStatus === "expiring"
                            ? "text-orange-600 dark:text-orange-400 font-medium"
                            : ""
                        }>
                          {new Date(batch.expiryDate).toLocaleDateString('ms-MY')}
                        </span>
                      </div>
                    )}
                    {batch.notes && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Nota:</span> {batch.notes}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
