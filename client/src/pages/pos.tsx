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
import { Plus, Minus, Trash2, ShoppingCart, CreditCard, DollarSign, Receipt, Package, Printer, Share2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BatchPreviewInfo } from "@/components/batch-preview-info";

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

  // Fetch business profile for receipt header
  const { data: businessProfile } = useQuery<any>({
    queryKey: ["/api/business-profile"],
  });

  // Fetch sale details with items when receipt is shown
  const { data: saleDetails } = useQuery<any>({
    queryKey: ["/api/sales", lastReceipt?.id],
    enabled: !!lastReceipt?.id && showReceipt,
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

  // Generate PDF receipt
  const generatePDF = () => {
    if (!lastReceipt || !saleDetails) return;

    const doc = new jsPDF();
    
    // Business Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(businessProfile?.businessName || "PocketBizz", 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    if (businessProfile?.address) {
      doc.text(businessProfile.address, 105, 28, { align: "center" });
    }
    if (businessProfile?.phone) {
      doc.text(`Tel: ${businessProfile.phone}`, 105, 34, { align: "center" });
    }
    
    // Receipt Info
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("RESIT JUALAN", 105, 45, { align: "center" });
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`No: ${lastReceipt.receiptNumber}`, 20, 55);
    doc.text(`Tarikh: ${new Date(lastReceipt.saleDate).toLocaleDateString('ms-MY')}`, 20, 60);
    doc.text(`Pelanggan: ${lastReceipt.customerName}`, 20, 65);
    doc.text(`Bayaran: ${lastReceipt.paymentMethod.toUpperCase()}`, 20, 70);
    
    // Items Table
    const tableData = (saleDetails.items || []).map((item: any) => [
      item.productName,
      item.quantity,
      `RM ${parseFloat(item.unitPrice).toFixed(2)}`,
      `RM ${parseFloat(item.totalPrice).toFixed(2)}`,
    ]);
    
    autoTable(doc, {
      startY: 80,
      head: [['Produk', 'Kuantiti', 'Harga', 'Jumlah']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [251, 146, 60], textColor: 255 },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' },
      },
    });
    
    // Total
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`JUMLAH: RM ${parseFloat(lastReceipt.totalAmount).toFixed(2)}`, 190, finalY, { align: "right" });
    
    // Footer
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Terima kasih atas pembelian anda!", 105, finalY + 15, { align: "center" });
    
    return doc;
  };

  // Handle Print
  const handlePrint = () => {
    const doc = generatePDF();
    if (doc) {
      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank');
      
      toast({
        title: "Cetak Resit",
        description: "Dialog cetak dibuka",
      });
    }
  };

  // Handle WhatsApp Share
  const handleWhatsAppShare = () => {
    if (!lastReceipt || !saleDetails) return;

    const items = (saleDetails.items || [])
      .map((item: any) => `- ${item.productName} x${item.quantity} = RM${parseFloat(item.totalPrice).toFixed(2)}`)
      .join('\n');

    const message = `*RESIT JUALAN*\n\n` +
      `No: ${lastReceipt.receiptNumber}\n` +
      `Tarikh: ${new Date(lastReceipt.saleDate).toLocaleDateString('ms-MY')}\n` +
      `Pelanggan: ${lastReceipt.customerName}\n\n` +
      `*Produk:*\n${items}\n\n` +
      `*JUMLAH: RM ${parseFloat(lastReceipt.totalAmount).toFixed(2)}*\n\n` +
      `Bayaran: ${lastReceipt.paymentMethod.toUpperCase()}\n\n` +
      `Terima kasih! - ${businessProfile?.businessName || 'PocketBizz'}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "WhatsApp Dibuka",
      description: "Kongsi resit melalui WhatsApp",
    });
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
                        className="min-h-32 md:h-28 flex flex-col items-center justify-center gap-2 hover-elevate active-elevate-2 p-3"
                      >
                        <Package className="w-7 h-7 md:w-6 md:h-6" />
                        <span className="font-medium text-sm md:text-sm text-center leading-tight">{product.name}</span>
                        <span className="text-sm md:text-xs text-muted-foreground font-semibold">
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
                      <div key={item.productId} className="space-y-2">
                        <div
                          data-testid={`cart-item-${item.productId}`}
                          className="flex flex-col md:flex-row md:items-center gap-3 p-4 md:p-3 rounded-lg bg-muted"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-base md:text-sm" data-testid={`text-product-name-${item.productId}`}>
                              {item.productName}
                            </p>
                            <p className="text-sm md:text-xs text-muted-foreground">
                              RM {parseFloat(item.unitPrice).toFixed(2)} x {item.quantity}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              data-testid={`button-decrease-qty-${item.productId}`}
                              size="icon"
                              variant="outline"
                              className="h-10 w-10 md:h-8 md:w-8"
                              onClick={() => updateQuantity(item.productId, -1)}
                            >
                              <Minus className="w-5 h-5 md:w-4 md:h-4" />
                            </Button>
                            
                            <span className="w-10 md:w-8 text-center font-medium text-base md:text-sm" data-testid={`text-quantity-${item.productId}`}>
                              {item.quantity}
                            </span>
                            
                            <Button
                              data-testid={`button-increase-qty-${item.productId}`}
                              size="icon"
                              variant="outline"
                              className="h-10 w-10 md:h-8 md:w-8"
                              onClick={() => updateQuantity(item.productId, 1)}
                            >
                              <Plus className="w-5 h-5 md:w-4 md:h-4" />
                            </Button>
                          </div>

                          <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-2">
                            <p className="font-medium text-lg md:text-base" data-testid={`text-item-total-${item.productId}`}>
                              RM {item.totalPrice.toFixed(2)}
                            </p>
                            <Button
                              data-testid={`button-remove-${item.productId}`}
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 md:h-6 md:w-6"
                              onClick={() => removeFromCart(item.productId)}
                            >
                              <Trash2 className="w-5 h-5 md:w-4 md:h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Batch Preview - Show which batches will be used (FIFO) */}
                        {item.productId && item.quantity > 0 && (
                          <BatchPreviewInfo 
                            productId={item.productId}
                            quantity={item.quantity}
                            productName={item.productName}
                          />
                        )}
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
                  <div className="bg-primary/10 p-5 md:p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-3 md:mb-2">
                      <span className="text-base md:text-sm text-muted-foreground">Jumlah Item:</span>
                      <span className="font-medium text-base md:text-sm" data-testid="text-total-items">{totalItems}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xl md:text-lg font-semibold">JUMLAH:</span>
                      <span className="text-3xl md:text-2xl font-bold text-primary" data-testid="text-total-amount">
                        RM {subtotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Button
                    data-testid="button-checkout"
                    onClick={handleCheckout}
                    disabled={cart.length === 0 || createSaleMutation.isPending}
                    className="w-full h-16 md:h-14 text-xl md:text-lg font-semibold"
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

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  data-testid="button-print-receipt"
                  onClick={handlePrint}
                  variant="outline"
                  disabled={!saleDetails}
                  className="flex items-center justify-center gap-2 h-12 md:h-10"
                >
                  <Printer className="w-5 h-5 md:w-4 md:h-4" />
                  Cetak
                </Button>

                <Button
                  data-testid="button-whatsapp-share"
                  onClick={handleWhatsAppShare}
                  variant="outline"
                  disabled={!saleDetails}
                  className="flex items-center justify-center gap-2 h-12 md:h-10"
                >
                  <Share2 className="w-5 h-5 md:w-4 md:h-4" />
                  WhatsApp
                </Button>
              </div>

              <Button
                data-testid="button-close-receipt"
                onClick={() => setShowReceipt(false)}
                className="w-full"
                variant="secondary"
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
