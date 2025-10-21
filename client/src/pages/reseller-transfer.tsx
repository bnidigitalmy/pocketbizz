import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Package, Receipt } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface TransferItem {
  productId: string;
  productName: string;
  quantity: number;
  tierPrice: number;
  subtotal: number;
}

export default function ResellerTransferPage() {
  const { toast } = useToast();
  const [selectedResellerId, setSelectedResellerId] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "pending">("paid");
  const [notes, setNotes] = useState("");
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [cart, setCart] = useState<TransferItem[]>([]);

  // Fetch resellers
  const { data: resellers = [], isLoading: resellersLoading } = useQuery<any[]>({
    queryKey: ["/api/resellers"],
  });

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  // Fetch business profile for PDF
  const { data: businessProfile } = useQuery<any>({
    queryKey: ["/api/business-profile"],
  });

  // Get selected reseller details
  const selectedReseller = resellers.find(r => r.id === selectedResellerId);
  const selectedProduct = products.find(p => p.id === selectedProductId);

  // Calculate tier-adjusted price
  const getTierPrice = (product: any, reseller: any) => {
    if (!product || !reseller || !reseller.pricingTier) return 0;
    const discount = parseFloat(reseller.pricingTier.discountPercent) / 100;
    const tierPrice = parseFloat(product.sellingPrice) * (1 - discount);
    return tierPrice;
  };

  // Add to cart
  const addToCart = () => {
    if (!selectedProductId || !selectedProduct || !selectedReseller || quantity < 1) {
      toast({
        variant: "destructive",
        title: "Ralat",
        description: "Sila pilih produk dan masukkan kuantiti yang sah",
      });
      return;
    }

    const tierPrice = getTierPrice(selectedProduct, selectedReseller);
    const subtotal = tierPrice * quantity;

    const newItem: TransferItem = {
      productId: selectedProductId,
      productName: selectedProduct.name,
      quantity,
      tierPrice,
      subtotal,
    };

    setCart([...cart, newItem]);
    setSelectedProductId("");
    setQuantity(1);

    toast({
      title: "Ditambah",
      description: `${selectedProduct.name} ditambah ke senarai transfer`,
    });
  };

  // Remove from cart
  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // Calculate total
  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);

  // Create transfer mutation
  const createTransferMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/reseller-transfers", data);
    },
    onSuccess: (data) => {
      toast({
        title: "Berjaya",
        description: "Transfer stok berjaya. Resit sedang dijana...",
      });

      // Generate PDF receipt
      generatePDFReceipt(data);

      // Reset form
      setSelectedResellerId("");
      setCart([]);
      setNotes("");
      setPaymentStatus("paid");
      setTransferDate(new Date().toISOString().split('T')[0]);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/reseller-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/resellers"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Ralat",
        description: error.message || "Gagal membuat transfer. Sila cuba lagi.",
      });
    },
  });

  // Submit transfer
  const handleSubmit = () => {
    if (!selectedResellerId || cart.length === 0) {
      toast({
        variant: "destructive",
        title: "Ralat",
        description: "Sila pilih ejen dan tambah produk ke senarai transfer",
      });
      return;
    }

    const items = cart.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      tierPrice: item.tierPrice.toFixed(2),
      subtotal: item.subtotal.toFixed(2),
    }));

    createTransferMutation.mutate({
      resellerId: selectedResellerId,
      transferDate,
      totalAmount: totalAmount.toFixed(2),
      paymentStatus,
      notes,
      items,
    });
  };

  // Generate PDF Receipt
  const generatePDFReceipt = (transfer: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(18);
    doc.text(businessProfile?.businessName || "PocketBizz", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(10);
    if (businessProfile?.address) {
      doc.text(businessProfile.address, pageWidth / 2, 28, { align: "center" });
    }
    if (businessProfile?.phone) {
      doc.text(`Tel: ${businessProfile.phone}`, pageWidth / 2, 34, { align: "center" });
    }

    // Title
    doc.setFontSize(14);
    doc.text("RESIT TRANSFER STOK", pageWidth / 2, 45, { align: "center" });

    // Receipt details
    doc.setFontSize(10);
    doc.text(`No. Resit: ${transfer.receiptNumber || "N/A"}`, 14, 55);
    doc.text(`Tarikh: ${new Date(transfer.transferDate).toLocaleDateString("ms-MY")}`, 14, 62);
    doc.text(`Ejen: ${selectedReseller?.name}`, 14, 69);
    doc.text(`Telefon: ${selectedReseller?.phone || "-"}`, 14, 76);
    doc.text(`Negeri: ${selectedReseller?.area || "-"}`, 14, 83);
    
    const statusText = paymentStatus === "paid" ? "Tunai" : "Tertunggak";
    doc.text(`Status Bayaran: ${statusText}`, 14, 90);

    // Items table
    autoTable(doc, {
      startY: 98,
      head: [["Produk", "Kuantiti", "Harga", "Jumlah"]],
      body: cart.map(item => [
        item.productName,
        item.quantity.toString(),
        `RM ${item.tierPrice.toFixed(2)}`,
        `RM ${item.subtotal.toFixed(2)}`,
      ]),
      theme: "striped",
      headStyles: { fillColor: [139, 69, 19] },
    });

    // Total
    const finalY = (doc as any).lastAutoTable.finalY || 98;
    doc.setFontSize(12);
    doc.text(`JUMLAH: RM ${totalAmount.toFixed(2)}`, pageWidth - 14, finalY + 10, { align: "right" });

    // Notes
    if (notes) {
      doc.setFontSize(10);
      doc.text(`Nota: ${notes}`, 14, finalY + 20);
    }

    // Footer
    doc.setFontSize(9);
    doc.text("Terima kasih atas kerjasama anda!", pageWidth / 2, finalY + 35, { align: "center" });

    // Save PDF
    doc.save(`Transfer-${transfer.receiptNumber || Date.now()}.pdf`);
  };

  if (resellersLoading || productsLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Transfer Stok ke Ejen</h1>
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  const activeResellers = resellers.filter(r => r.isActive === 1);

  if (activeResellers.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Transfer Stok ke Ejen</h1>
          <p className="text-muted-foreground">Pilih ejen dan produk untuk transfer stok</p>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Tiada ejen aktif. Sila tambah ejen terlebih dahulu.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transfer Stok ke Ejen</h1>
        <p className="text-muted-foreground">Pilih ejen dan produk untuk transfer stok</p>
      </div>

      {/* Reseller Selection */}
      <Card>
        <CardHeader>
          <CardTitle>1. Pilih Ejen Jualan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="reseller">Ejen</Label>
            <Select value={selectedResellerId} onValueChange={setSelectedResellerId}>
              <SelectTrigger data-testid="select-transfer-reseller">
                <SelectValue placeholder="Pilih Ejen Jualan" />
              </SelectTrigger>
              <SelectContent>
                {activeResellers.map((reseller) => (
                  <SelectItem key={reseller.id} value={reseller.id}>
                    {reseller.name} - {reseller.area} {reseller.pricingTier && `(${reseller.pricingTier.name})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedReseller && (
            <Card className="bg-muted">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{selectedReseller.name}</span>
                  {selectedReseller.pricingTier && (
                    <Badge>{selectedReseller.pricingTier.name}</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedReseller.phone} • {selectedReseller.area}
                </p>
                <p className="text-sm">
                  Total Pembelian: RM {parseFloat(selectedReseller.totalPurchases).toFixed(2)}
                </p>
                {selectedReseller.pricingTier && (
                  <p className="text-sm font-medium text-primary">
                    Diskaun: {parseFloat(selectedReseller.pricingTier.discountPercent).toFixed(0)}%
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Product Selection */}
      <Card>
        <CardHeader>
          <CardTitle>2. Tambah Produk</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="product">Produk</Label>
              <Select 
                value={selectedProductId} 
                onValueChange={setSelectedProductId}
                disabled={!selectedResellerId}
              >
                <SelectTrigger data-testid="select-transfer-product">
                  <SelectValue placeholder={selectedResellerId ? "Pilih Produk" : "Pilih ejen dahulu"} />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => {
                    const tierPrice = selectedReseller ? getTierPrice(product, selectedReseller) : 0;
                    const discount = selectedReseller?.pricingTier ? parseFloat(selectedReseller.pricingTier.discountPercent) : 0;
                    
                    return (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - RM {parseFloat(product.sellingPrice).toFixed(2)}
                        {selectedReseller && ` → RM ${tierPrice.toFixed(2)} (Diskaun ${discount}%)`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="quantity">Kuantiti</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                disabled={!selectedProductId}
                data-testid="input-transfer-quantity"
              />
            </div>
          </div>

          <Button 
            onClick={addToCart} 
            disabled={!selectedProductId || quantity < 1}
            data-testid="button-add-to-transfer"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah ke Senarai
          </Button>
        </CardContent>
      </Card>

      {/* Transfer Items Cart */}
      <Card>
        <CardHeader>
          <CardTitle>3. Senarai Transfer ({cart.length} item)</CardTitle>
        </CardHeader>
        <CardContent>
          {cart.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Tiada item. Sila tambah produk ke senarai.
            </p>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead className="text-right">Kuantiti</TableHead>
                    <TableHead className="text-right">Harga Tier</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="w-[80px]">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">RM {item.tierPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">
                        RM {item.subtotal.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(index)}
                          data-testid={`button-remove-item-${index}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Jumlah Keseluruhan</p>
                  <p className="text-2xl font-bold">RM {totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment & Notes */}
      <Card>
        <CardHeader>
          <CardTitle>4. Maklumat Tambahan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="transferDate">Tarikh Transfer</Label>
              <Input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                data-testid="input-transfer-date"
              />
            </div>

            <div>
              <Label htmlFor="paymentStatus">Status Bayaran</Label>
              <Select value={paymentStatus} onValueChange={(value: any) => setPaymentStatus(value)}>
                <SelectTrigger data-testid="select-payment-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Tunai</SelectItem>
                  <SelectItem value="pending">Tertunggak</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Nota (Pilihan)</Label>
            <Textarea
              placeholder="Masukkan nota tambahan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              data-testid="textarea-transfer-notes"
            />
          </div>
        </CardContent>
      </Card>

      {/* Confirm Transfer */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={!selectedResellerId || cart.length === 0 || createTransferMutation.isPending}
          data-testid="button-confirm-transfer"
        >
          <Receipt className="h-5 w-5 mr-2" />
          {createTransferMutation.isPending ? "Memproses..." : "Sahkan Transfer"}
        </Button>
      </div>
    </div>
  );
}
