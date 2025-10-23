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
import { Plus, Minus, Trash2, ShoppingCart, CreditCard, DollarSign, Receipt, Package, Printer, Share2, Download, QrCode } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BatchPreviewInfo } from "@/components/batch-preview-info";
import { generateThermalReceipt58mm, generateThermalReceipt80mm } from "@/lib/pdf-utils";

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
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"tunai" | "online" | "qr" | "kredit">("tunai");
  const [searchQuery, setSearchQuery] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  const [thermalFormat, setThermalFormat] = useState<"58mm" | "80mm">("80mm");

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

  // Customer lookup mutation
  const lookupCustomerMutation = useMutation({
    mutationFn: async (phone: string) => {
      const res = await fetch(`/api/loyalty/customer/${encodeURIComponent(phone)}`);
      if (!res.ok) throw new Error("Failed to lookup customer");
      return res.json();
    },
    onSuccess: (customer) => {
      if (customer) {
        setSelectedCustomer(customer);
        setCustomerName(customer.name);
        toast({
          title: "Pelanggan Dijumpai",
          description: `${customer.name} - ${customer.loyaltyPoints || 0} mata ganjaran`,
        });
      } else {
        setSelectedCustomer(null);
        toast({
          title: "Pelanggan Baru",
          description: "Nombor ini belum didaftarkan. Masukkan nama untuk daftar.",
        });
      }
    },
  });

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (data: { name: string; phone: string }) => {
      return await apiRequest("POST", "/api/loyalty/customer", data);
    },
    onSuccess: (customer: any) => {
      setSelectedCustomer(customer);
      toast({
        title: "Pelanggan Berdaftar",
        description: `${customer.name} berjaya didaftarkan!`,
      });
    },
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
      const pointsEarned = Math.floor(parseFloat(sale.totalAmount || "0"));
      const message = selectedCustomer 
        ? `Resit: ${sale.receiptNumber} | +${pointsEarned} mata ganjaran`
        : `Resit: ${sale.receiptNumber}`;
      
      toast({
        title: "Jualan Berjaya",
        description: message,
      });
      
      setLastReceipt(sale);
      setShowReceipt(true);
      
      // Clear cart and customer
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setSelectedCustomer(null);
      setPointsToRedeem(0);
      setPaymentMethod("tunai");
      setSearchQuery("");
      
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty/customers"] });
      if (selectedCustomer?.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/loyalty/history", selectedCustomer.id] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal membuat jualan",
        variant: "destructive",
      });
    },
  });

  // Calculate discount from loyalty points (100 points = RM10)
  const pointsDiscount = Math.floor(pointsToRedeem / 100) * 10;
  const finalTotal = Math.max(0, subtotal - pointsDiscount);

  // Handle checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: "Troli Kosong",
        description: "Sila tambah produk dahulu",
        variant: "destructive",
      });
      return;
    }

    // Validate points redemption
    if (pointsToRedeem > 0) {
      if (!selectedCustomer) {
        toast({
          title: "Ralat",
          description: "Sila daftar pelanggan untuk guna mata ganjaran",
          variant: "destructive",
        });
        return;
      }
      if (pointsToRedeem > selectedCustomer.loyaltyPoints) {
        toast({
          title: "Ralat",
          description: "Mata ganjaran tidak mencukupi",
          variant: "destructive",
        });
        return;
      }
      if (pointsToRedeem < 100) {
        toast({
          title: "Ralat",
          description: "Minimum 100 mata untuk tebus",
          variant: "destructive",
        });
        return;
      }
    }

    // Register new customer if phone provided but not registered
    let customerId = selectedCustomer?.id;
    if (customerPhone && !selectedCustomer && customerName) {
      try {
        const newCustomer = await createCustomerMutation.mutateAsync({
          name: customerName.trim(),
          phone: customerPhone.trim(),
        });
        customerId = newCustomer.id;
      } catch (error) {
        toast({
          title: "Ralat",
          description: "Gagal mendaftar pelanggan",
          variant: "destructive",
        });
        return;
      }
    }

    const saleData = {
      sale: {
        customerName: customerName.trim() || "Walk-in Customer",
        customerId: customerId || null,
        paymentMethod,
        totalAmount: finalTotal.toFixed(2),
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
      // Include redemption info so backend can process atomically
      pointsRedemption: pointsToRedeem > 0 && customerId ? {
        customerId,
        points: pointsToRedeem,
        discount: pointsDiscount,
      } : null,
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

  // Handle Print - Standard A4
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

  // Handle Thermal Print
  const handleThermalPrint = () => {
    if (!lastReceipt || !saleDetails) return;

    const doc = thermalFormat === "58mm" 
      ? generateThermalReceipt58mm(lastReceipt, saleDetails.items, businessProfile)
      : generateThermalReceipt80mm(lastReceipt, saleDetails.items, businessProfile);

    if (doc) {
      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank');
      
      toast({
        title: "Cetak Resit Thermal",
        description: `Format ${thermalFormat} dibuka`,
      });
    }
  };

  // Download Thermal Receipt
  const handleDownloadThermal = () => {
    if (!lastReceipt || !saleDetails) return;

    const doc = thermalFormat === "58mm" 
      ? generateThermalReceipt58mm(lastReceipt, saleDetails.items, businessProfile)
      : generateThermalReceipt80mm(lastReceipt, saleDetails.items, businessProfile);

    if (doc) {
      const filename = `resit-${lastReceipt.receiptNumber}-${thermalFormat}.pdf`;
      doc.save(filename);
      
      toast({
        title: "Muat Turun Berjaya",
        description: `Resit ${thermalFormat} dimuat turun`,
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

  const handleExportSales = () => {
    window.open('/api/reports/export-sales', '_blank');
    toast({
      title: "Export Berjaya",
      description: "Data jualan sedang dimuat turun",
    });
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">POS - Point of Sale</h1>
            <p className="text-muted-foreground">Sistem Jualan Kaunter</p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleExportSales}
            data-testid="button-export-sales"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
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
                <div className="space-y-3 mb-4">
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
                    <Label htmlFor="customer-name">Nama Pelanggan <span className="text-muted-foreground text-xs">(Pilihan)</span></Label>
                    <Input
                      id="customer-name"
                      data-testid="input-customer-name"
                      type="text"
                      placeholder="Nama pelanggan (tidak wajib)..."
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  {/* Loyalty Program - Customer Phone */}
                  <div>
                    <Label htmlFor="customer-phone">Nombor Telefon <span className="text-muted-foreground text-xs">(Untuk mata ganjaran)</span></Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="customer-phone"
                        data-testid="input-customer-phone"
                        type="tel"
                        placeholder="Cth: 0123456789"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                      />
                      <Button
                        data-testid="button-lookup-customer"
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (customerPhone.trim()) {
                            lookupCustomerMutation.mutate(customerPhone.trim());
                          }
                        }}
                        disabled={!customerPhone.trim() || lookupCustomerMutation.isPending}
                      >
                        {lookupCustomerMutation.isPending ? "..." : "Cari"}
                      </Button>
                    </div>
                  </div>

                  {/* Loyalty Points Display */}
                  {selectedCustomer && (
                    <Card className="bg-accent/20 border-accent">
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Mata Ganjaran:</span>
                            <Badge variant="default" className="text-base px-3 py-1" data-testid="badge-loyalty-points">
                              {selectedCustomer.loyaltyPoints} mata
                            </Badge>
                          </div>
                          
                          {selectedCustomer.loyaltyPoints >= 100 && (
                            <div>
                              <Label htmlFor="points-redeem" className="text-xs">Tebus Mata (100 mata = RM10)</Label>
                              <Input
                                id="points-redeem"
                                data-testid="input-points-redeem"
                                type="number"
                                min="0"
                                max={selectedCustomer.loyaltyPoints}
                                step="100"
                                value={pointsToRedeem || ""}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  setPointsToRedeem(Math.min(value, selectedCustomer.loyaltyPoints));
                                }}
                                placeholder="0"
                                className="mt-1"
                              />
                              {pointsToRedeem > 0 && (
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1" data-testid="text-discount-amount">
                                  Diskaun: RM{pointsDiscount.toFixed(2)}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

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
                        <SelectItem value="qr" data-testid="option-qr">
                          <span className="flex items-center gap-2">
                            <QrCode className="w-4 h-4" />
                            QR Code / DuitNow
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

                  {/* QR Code Display */}
                  {paymentMethod === "qr" && (
                    <div className="bg-muted/50 p-4 rounded-lg border">
                      {businessProfile?.paymentQrCode ? (
                        <div className="space-y-3">
                          <p className="text-sm text-center text-muted-foreground font-medium">
                            Imbas QR Code untuk bayaran
                          </p>
                          <div className="flex justify-center">
                            <img 
                              src={businessProfile.paymentQrCode} 
                              alt="Payment QR Code" 
                              className="max-w-[200px] max-h-[200px] rounded-lg border-2"
                              data-testid="img-payment-qr"
                            />
                          </div>
                          <p className="text-xs text-center text-muted-foreground">
                            Selepas pembayaran, tekan butang "Proses Jualan"
                          </p>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <QrCode className="w-12 h-12 mx-auto mb-2 text-muted-foreground/50" />
                          <p className="text-sm text-muted-foreground">
                            QR Code belum disediakan
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Sila upload QR code di halaman Tetapan
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Total */}
                  <div className="bg-primary/10 p-5 md:p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-base md:text-sm text-muted-foreground">Jumlah Item:</span>
                      <span className="font-medium text-base md:text-sm" data-testid="text-total-items">{totalItems}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-base md:text-sm text-muted-foreground">Subtotal:</span>
                      <span className="font-medium text-base md:text-sm">RM {subtotal.toFixed(2)}</span>
                    </div>
                    {pointsDiscount > 0 && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-green-600 dark:text-green-400">Diskaun Ganjaran:</span>
                        <span className="font-medium text-sm text-green-600 dark:text-green-400" data-testid="text-discount-total">
                          - RM {pointsDiscount.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-primary/20">
                      <span className="text-xl md:text-lg font-semibold">JUMLAH:</span>
                      <span className="text-3xl md:text-2xl font-bold text-primary" data-testid="text-final-total">
                        RM {finalTotal.toFixed(2)}
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

              {/* Thermal Printer Format Selection */}
              <div className="border-t pt-4 space-y-3">
                <Label className="text-sm font-semibold">Format Printer Thermal</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    data-testid="button-select-58mm"
                    onClick={() => setThermalFormat("58mm")}
                    variant={thermalFormat === "58mm" ? "default" : "outline"}
                    className="h-10"
                  >
                    58mm
                  </Button>
                  <Button
                    data-testid="button-select-80mm"
                    onClick={() => setThermalFormat("80mm")}
                    variant={thermalFormat === "80mm" ? "default" : "outline"}
                    className="h-10"
                  >
                    80mm
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  data-testid="button-print-thermal"
                  onClick={handleThermalPrint}
                  variant="default"
                  disabled={!saleDetails}
                  className="flex items-center justify-center gap-2 h-12 md:h-10"
                >
                  <Printer className="w-5 h-5 md:w-4 md:h-4" />
                  Cetak ({thermalFormat})
                </Button>

                <Button
                  data-testid="button-download-thermal"
                  onClick={handleDownloadThermal}
                  variant="outline"
                  disabled={!saleDetails}
                  className="flex items-center justify-center gap-2 h-12 md:h-10"
                >
                  <Download className="w-5 h-5 md:w-4 md:h-4" />
                  Muat Turun ({thermalFormat})
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  data-testid="button-print-a4"
                  onClick={handlePrint}
                  variant="outline"
                  disabled={!saleDetails}
                  className="flex items-center justify-center gap-2 h-12 md:h-10"
                >
                  <Receipt className="w-5 h-5 md:w-4 md:h-4" />
                  A4
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
