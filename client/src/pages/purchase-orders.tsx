import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Share2, Check, X, Clock, Send, Package, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocation } from "wouter";

interface PurchaseOrderItem {
  id: string;
  poId: string;
  stockItemId: string | null;
  itemName: string;
  quantity: string;
  unit: string;
  estimatedPrice: string | null;
  actualPrice: string | null;
  notes: string | null;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string | null;
  supplierName: string;
  supplierPhone: string | null;
  totalAmount: string;
  status: string;
  notes: string | null;
  createdAt: string;
  sentAt: string | null;
  receivedAt: string | null;
  expenseId: string | null;
  items: PurchaseOrderItem[];
}

export default function PurchaseOrders() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);

  const { data: purchaseOrders = [], isLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ["/api/purchase-orders"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/purchase-orders/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      toast({
        title: "Status dikemaskini",
        description: "Status PO telah berjaya dikemaskini",
      });
    },
  });

  const markReceivedMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/purchase-orders/${id}/receive`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setReceiveDialogOpen(false);
      setSelectedPO(null);
      toast({
        title: "Barang Diterima! ✅",
        description: "Stok telah dikemaskini dan perbelanjaan telah direkodkan",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ralat!",
        description: error.message || "Gagal merekod penerimaan",
        variant: "destructive",
      });
    },
  });

  const deletePOMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/purchase-orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      toast({
        title: "PO dipadam",
        description: "Purchase order telah dipadam",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Draft</Badge>;
      case "sent":
        return <Badge variant="default"><Send className="h-3 w-3 mr-1" />Dihantar</Badge>;
      case "received":
        return <Badge className="bg-green-600"><Check className="h-3 w-3 mr-1" />Diterima</Badge>;
      case "cancelled":
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Dibatal</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleShareWhatsApp = (po: PurchaseOrder) => {
    let message = `📋 *PURCHASE ORDER*\n`;
    message += `PO Number: *${po.poNumber}*\n`;
    message += `Supplier: *${po.supplierName}*\n`;
    message += `Tarikh: ${new Date(po.createdAt).toLocaleDateString('ms-MY')}\n\n`;
    message += `📦 *SENARAI ITEM:*\n\n`;

    po.items.forEach((item, index) => {
      message += `${index + 1}. *${item.itemName}*\n`;
      message += `   Kuantiti: ${parseFloat(item.quantity).toFixed(1)} ${item.unit}\n`;
      if (item.estimatedPrice) {
        const price = parseFloat(item.estimatedPrice);
        const total = price * parseFloat(item.quantity);
        message += `   Harga: RM ${price.toFixed(2)}\n`;
        message += `   Jumlah: RM ${total.toFixed(2)}\n`;
      }
      if (item.notes) {
        message += `   Nota: ${item.notes}\n`;
      }
      message += `\n`;
    });

    message += `${"=".repeat(30)}\n`;
    message += `💰 *JUMLAH: RM ${parseFloat(po.totalAmount).toFixed(2)}*\n\n`;
    
    if (po.notes) {
      message += `📝 Nota: ${po.notes}\n`;
    }

    message += `\nSila sahkan pesanan ini. Terima kasih! 🙏`;

    const encodedMessage = encodeURIComponent(message);
    const phoneNumber = po.supplierPhone?.replace(/\D/g, '') || '';
    const whatsappUrl = phoneNumber 
      ? `https://wa.me/${phoneNumber}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');

    toast({
      title: "WhatsApp dibuka",
      description: "PO telah disediakan untuk dihantar",
    });
  };

  const handleViewDetails = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setDetailDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat purchase orders...</p>
        </div>
      </div>
    );
  }

  const stats = {
    draft: purchaseOrders.filter(po => po.status === 'draft').length,
    sent: purchaseOrders.filter(po => po.status === 'sent').length,
    received: purchaseOrders.filter(po => po.status === 'received').length,
    totalValue: purchaseOrders.reduce((sum, po) => sum + parseFloat(po.totalAmount), 0),
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">📦 Purchase Orders</h1>
          <p className="text-muted-foreground">Urus pesanan pembelian dari supplier</p>
        </div>
        <Button 
          onClick={() => setLocation("/shopping-list")}
          variant="default"
          data-testid="button-back-to-cart"
        >
          <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
          Kembali ke Cart
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              Draft
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.draft}</div>
            <p className="text-xs text-muted-foreground mt-1">Belum dihantar</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Send className="h-4 w-4 text-blue-600" />
              Dihantar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.sent}</div>
            <p className="text-xs text-muted-foreground mt-1">Menunggu barang</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              Diterima
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.received}</div>
            <p className="text-xs text-muted-foreground mt-1">Siap</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-purple-600" />
              Nilai Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RM {stats.totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Semua PO</p>
          </CardContent>
        </Card>
      </div>

      {/* Purchase Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Senarai Purchase Orders
          </CardTitle>
          <CardDescription>
            {purchaseOrders.length > 0 
              ? `${purchaseOrders.length} purchase order dijumpai` 
              : "Tiada purchase order"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {purchaseOrders.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Tiada Purchase Order</p>
              <p className="text-sm text-muted-foreground mt-2 mb-4">
                Buat purchase order dari shopping cart
              </p>
              <Button onClick={() => setLocation("/shopping-list")} data-testid="button-go-to-cart">
                Pergi ke Shopping Cart
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {purchaseOrders.map((po) => (
                <div 
                  key={po.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover-elevate"
                  data-testid={`po-${po.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-lg">{po.poNumber}</span>
                      {getStatusBadge(po.status)}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Supplier: <span className="font-medium">{po.supplierName}</span></div>
                      <div>
                        Tarikh: {new Date(po.createdAt).toLocaleDateString('ms-MY', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                      <div>Jumlah: <span className="font-medium">RM {parseFloat(po.totalAmount).toFixed(2)}</span></div>
                      <div>{po.items.length} item</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(po)}
                      data-testid={`button-view-${po.id}`}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Lihat
                    </Button>

                    {po.status === 'draft' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          updateStatusMutation.mutate({ id: po.id, status: 'sent' });
                          handleShareWhatsApp(po);
                        }}
                        data-testid={`button-send-${po.id}`}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Hantar
                      </Button>
                    )}

                    {po.status === 'sent' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setSelectedPO(po);
                          setReceiveDialogOpen(true);
                        }}
                        className="bg-green-600 hover:bg-green-700"
                        data-testid={`button-receive-${po.id}`}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Terima
                      </Button>
                    )}

                    {po.status === 'received' && (
                      <Badge variant="outline" className="px-3 py-1">
                        ✅ Selesai
                      </Badge>
                    )}

                    {po.status === 'draft' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePOMutation.mutate(po.id)}
                        disabled={deletePOMutation.isPending}
                        data-testid={`button-delete-${po.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Purchase Order: {selectedPO?.poNumber}
            </DialogTitle>
            <DialogDescription>
              {selectedPO && getStatusBadge(selectedPO.status)}
            </DialogDescription>
          </DialogHeader>

          {selectedPO && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Supplier</p>
                  <p className="font-medium">{selectedPO.supplierName}</p>
                  {selectedPO.supplierPhone && (
                    <p className="text-xs text-muted-foreground">{selectedPO.supplierPhone}</p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground">Tarikh Dibuat</p>
                  <p className="font-medium">
                    {new Date(selectedPO.createdAt).toLocaleDateString('ms-MY', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {selectedPO.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Nota</p>
                  <p className="text-sm">{selectedPO.notes}</p>
                </div>
              )}

              <div>
                <p className="font-medium mb-2">Item Pesanan:</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Kuantiti</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedPO.items.map((item) => {
                      const price = parseFloat(item.actualPrice || item.estimatedPrice || '0');
                      const qty = parseFloat(item.quantity);
                      const total = price * qty;

                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.itemName}</TableCell>
                          <TableCell>{qty.toFixed(1)} {item.unit}</TableCell>
                          <TableCell>RM {price.toFixed(2)}</TableCell>
                          <TableCell className="text-right">RM {total.toFixed(2)}</TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={3} className="font-bold">JUMLAH</TableCell>
                      <TableCell className="text-right font-bold">
                        RM {parseFloat(selectedPO.totalAmount).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => selectedPO && handleShareWhatsApp(selectedPO)}
              data-testid="button-share-po"
            >
              <Share2 className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receive Confirmation Dialog */}
      <Dialog open={receiveDialogOpen} onOpenChange={setReceiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sahkan Penerimaan Barang</DialogTitle>
            <DialogDescription>
              Tindakan ini akan mengemas kini stok dan merekod perbelanjaan secara automatik.
            </DialogDescription>
          </DialogHeader>

          {selectedPO && (
            <div className="space-y-2">
              <p className="text-sm">
                <strong>PO Number:</strong> {selectedPO.poNumber}
              </p>
              <p className="text-sm">
                <strong>Supplier:</strong> {selectedPO.supplierName}
              </p>
              <p className="text-sm">
                <strong>Jumlah:</strong> RM {parseFloat(selectedPO.totalAmount).toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                ✅ Stok akan ditambah<br />
                ✅ Perbelanjaan akan direkod
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiveDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() => selectedPO && markReceivedMutation.mutate(selectedPO.id)}
              disabled={markReceivedMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-confirm-receive"
            >
              {markReceivedMutation.isPending ? "Merekod..." : "Sahkan Terima"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
