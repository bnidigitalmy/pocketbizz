import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Minus, Trash2, ShoppingCart, CreditCard, DollarSign, Receipt, Package } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
  unitCost: string;
  totalPrice: number;
}

export default function POSPage() {
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"tunai" | "online" | "kredit">("tunai");
  const [searchQuery, setSearchQuery] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any>(null);

  // Fetch products for selection
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Filter products based on search
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Add product to cart
  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      // Increase quantity
      setCart(cart.map(item =>
        item.productId === product.id
          ? {
              ...item,
              quantity: item.quantity + 1,
              totalPrice: (item.quantity + 1) * parseFloat(item.unitPrice),
            }
          : item
      ));
    } else {
      // Add new item
      setCart([
        ...cart,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.sellingPrice,
          unitCost: product.costPerUnit,
          totalPrice: parseFloat(product.sellingPrice),
        },
      ]);
    }

    toast({
      title: "Ditambah ke Troli",
      description: `${product.name} ditambah`,
    });
  };

  // Update quantity
  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return {
          ...item,
          quantity: newQty,
          totalPrice: newQty * parseFloat(item.unitPrice),
        };
      }
      return item;
    }));
  };

  // Remove from cart
  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  // Create sale mutation
  const createSaleMutation = useMutation({
    mutationFn: async (saleData: any) => {
      return await apiRequest("POST", "/api/sales", saleData);
    },
    onSuccess: (sale: any) => {
      toast({
        title: "Jualan Berjaya",
        description: `Resit: ${sale.receiptNumber}`,
      });
      
      setLastReceipt(sale);
      setShowReceipt(true);
      
      // Clear cart
      setCart([]);
      setCustomerName("");
      setPaymentMethod("tunai");
      setSearchQuery("");
      
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal membuat jualan",
        variant: "destructive",
      });
    },
  });

  // Handle checkout
  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Troli Kosong",
        description: "Sila tambah produk dahulu",
        variant: "destructive",
      });
      return;
    }

    if (!customerName.trim()) {
      toast({
        title: "Nama Pelanggan Diperlukan",
        description: "Sila masukkan nama pelanggan",
        variant: "destructive",
      });
      return;
    }

    const saleData = {
      sale: {
        customerName: customerName.trim(),
        paymentMethod,
        totalAmount: subtotal.toFixed(2),
        saleDate: new Date().toISOString().split('T')[0],
      },
      items: cart.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitCost: item.unitCost,
        totalPrice: item.totalPrice.toFixed(2),
        totalCost: (item.quantity * parseFloat(item.unitCost)).toFixed(2),
        profitAmount: ((parseFloat(item.unitPrice) - parseFloat(item.unitCost)) * item.quantity).toFixed(2),
      })),
    };

    createSaleMutation.mutate(saleData);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-foreground">POS - Point of Sale</h1>
          <p className="text-muted-foreground">Sistem Jualan Kaunter</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Selection - Left Side */}
          <div className="lg:col-span-2 space-y-4">
            <Card data-testid="card-product-selection">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Pilih Produk
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  data-testid="input-product-search"
                  type="text"
                  placeholder="Cari produk..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto">
                  {productsLoading ? (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      Memuatkan produk...
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      Tiada produk dijumpai
                    </div>
                  ) : (
                    filteredProducts.map((product) => (
                      <Button
                        key={product.id}
                        data-testid={`button-add-product-${product.id}`}
                        onClick={() => addToCart(product)}
                        variant="outline"
                        className="h-24 flex flex-col items-center justify-center gap-2 hover-elevate active-elevate-2"
                      >
                        <Package className="w-6 h-6" />
                        <span className="font-medium text-sm">{product.name}</span>
                        <span className="text-xs text-muted-foreground">
                          RM {parseFloat(product.sellingPrice).toFixed(2)}
                        </span>
                      </Button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cart & Checkout - Right Side */}
          <div className="space-y-4">
            {/* Cart Items */}
            <Card data-testid="card-shopping-cart">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    Troli
                  </span>
                  <Badge variant="secondary" data-testid="badge-item-count">
                    {totalItems} item
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[300px] overflow-y-auto mb-4">
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Troli kosong
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div
                        key={item.productId}
                        data-testid={`cart-item-${item.productId}`}
                        className="flex items-center justify-between gap-2 p-3 rounded-lg bg-muted"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm" data-testid={`text-product-name-${item.productId}`}>
                            {item.productName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            RM {parseFloat(item.unitPrice).toFixed(2)} x {item.quantity}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            data-testid={`button-decrease-qty-${item.productId}`}
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.productId, -1)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          
                          <span className="w-8 text-center font-medium" data-testid={`text-quantity-${item.productId}`}>
                            {item.quantity}
                          </span>
                          
                          <Button
                            data-testid={`button-increase-qty-${item.productId}`}
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.productId, 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="text-right">
                          <p className="font-medium" data-testid={`text-item-total-${item.productId}`}>
                            RM {item.totalPrice.toFixed(2)}
                          </p>
                          <Button
                            data-testid={`button-remove-${item.productId}`}
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => removeFromCart(item.productId)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Customer & Payment Details */}
                <div className="space-y-4 border-t pt-4">
                  <div>
                    <Label htmlFor="customer-name">Nama Pelanggan</Label>
                    <Input
                      id="customer-name"
                      data-testid="input-customer-name"
                      type="text"
                      placeholder="Nama pelanggan..."
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="payment-method">Kaedah Bayaran</Label>
                    <Select
                      value={paymentMethod}
                      onValueChange={(value: any) => setPaymentMethod(value)}
                    >
                      <SelectTrigger id="payment-method" data-testid="select-payment-method" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tunai" data-testid="option-tunai">
                          <span className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Tunai
                          </span>
                        </SelectItem>
                        <SelectItem value="online" data-testid="option-online">
                          <span className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            Online Transfer
                          </span>
                        </SelectItem>
                        <SelectItem value="kredit" data-testid="option-kredit">
                          <span className="flex items-center gap-2">
                            <Receipt className="w-4 h-4" />
                            Kredit
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Total */}
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Jumlah Item:</span>
                      <span className="font-medium" data-testid="text-total-items">{totalItems}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">JUMLAH:</span>
                      <span className="text-2xl font-bold text-primary" data-testid="text-total-amount">
                        RM {subtotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Button
                    data-testid="button-checkout"
                    onClick={handleCheckout}
                    disabled={cart.length === 0 || createSaleMutation.isPending}
                    className="w-full h-14 text-lg"
                  >
                    {createSaleMutation.isPending ? "Memproses..." : "Proses Jualan"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent data-testid="dialog-receipt">
          <DialogHeader>
            <DialogTitle>Resit Jualan</DialogTitle>
          </DialogHeader>
          
          {lastReceipt && (
            <div className="space-y-4">
              <div className="text-center border-b pb-4">
                <p className="font-bold text-lg">PocketBizz</p>
                <p className="text-sm text-muted-foreground">Resit No: {lastReceipt.receiptNumber}</p>
                <p className="text-xs text-muted-foreground">{new Date().toLocaleString('ms-MY')}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Pelanggan:</span>
                  <span className="font-medium">{lastReceipt.customerName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Bayaran:</span>
                  <span className="font-medium capitalize">{lastReceipt.paymentMethod}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">JUMLAH:</span>
                  <span className="text-2xl font-bold text-primary">
                    RM {parseFloat(lastReceipt.totalAmount).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4 text-center text-sm text-muted-foreground">
                Terima kasih!
              </div>

              <Button
                data-testid="button-close-receipt"
                onClick={() => setShowReceipt(false)}
                className="w-full"
              >
                Tutup
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
