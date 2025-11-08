import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Share2, Check, X, Clock, Send, Package, ChevronRight, Printer, Mail } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { downloadPOPDF } from "@/lib/po-pdf-generator";
import type { BusinessProfile } from "@shared/schema";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  supplierEmail: string | null;
  supplierAddress: string | null;
  deliveryAddress: string | null;
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
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({
    recipientEmail: "",
    recipientName: "",
    message: ""
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    supplierName: "",
    supplierPhone: "",
    notes: ""
  });
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templatesDialogOpen, setTemplatesDialogOpen] = useState(false);

  const { data: purchaseOrders = [], isLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ["/api/purchase-orders"],
  });
  
  const { data: templates = [] } = useQuery<any[]>({
    queryKey: ["/api/po-templates"],
  });
  
  const { data: businessProfile } = useQuery<BusinessProfile>({
    queryKey: ["/api/business-profile"],
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

  const sendEmailMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof emailForm }) => {
      return await apiRequest("POST", `/api/purchase-orders/${id}/send-email`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      setEmailDialogOpen(false);
      setEmailForm({ recipientEmail: "", recipientName: "", message: "" });
      toast({
        title: "Email dihantar",
        description: "PO telah berjaya dihantar ke supplier",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal menghantar email",
        variant: "destructive",
      });
    },
  });

  const updatePOMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof editForm }) => {
      return await apiRequest("PATCH", `/api/purchase-orders/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      setEditDialogOpen(false);
      setEditForm({ supplierName: "", supplierPhone: "", notes: "" });
      toast({
        title: "PO dikemaskini",
        description: "Purchase order telah dikemaskini",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal kemaskini PO",
        variant: "destructive",
      });
    },
  });
  
  const saveTemplateMutation = useMutation({
    mutationFn: async ({ poId, templateName }: { poId: string; templateName: string }) => {
      return await apiRequest("POST", `/api/po-templates/from-po/${poId}`, { templateName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/po-templates"] });
      setSaveTemplateDialogOpen(false);
      setTemplateName("");
      setSelectedPO(null);
      toast({
        title: "Template disimpan",
        description: "PO template telah berjaya disimpan",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal simpan template",
        variant: "destructive",
      });
    },
  });
  
  const createFromTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      return await apiRequest("POST", `/api/po-templates/${templateId}/create-po`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      setTemplatesDialogOpen(false);
      toast({
        title: "PO dicipta",
        description: "Purchase order baharu telah dicipta dari template",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal cipta PO dari template",
        variant: "destructive",
      });
    },
  });
  
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/po-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/po-templates"] });
      toast({
        title: "Template dipadam",
        description: "Template telah berjaya dipadam",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal padam template",
        variant: "destructive",
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
    const businessName = businessProfile?.businessName || "PocketBizz";
    
    let message = `📋 *PURCHASE ORDER*\n`;
    message += `${businessName}\n`;
    if (businessProfile?.registrationNumber) {
      message += `Reg No: ${businessProfile.registrationNumber}\n`;
    }
    if (businessProfile?.phone || businessProfile?.email) {
      const contact = [businessProfile?.phone, businessProfile?.email].filter(Boolean).join(" | ");
      message += `${contact}\n`;
    }
    message += `\n`;
    message += `PO Number: *${po.poNumber}*\n`;
    message += `Tarikh: ${new Date(po.createdAt).toLocaleDateString('ms-MY')}\n\n`;
    
    message += `📤 *KEPADA:*\n`;
    message += `${po.supplierName}\n`;
    if (po.supplierPhone) message += `Tel: ${po.supplierPhone}\n`;
    if (po.supplierEmail) message += `Email: ${po.supplierEmail}\n`;
    if (po.supplierAddress) message += `${po.supplierAddress}\n`;
    message += `\n`;
    
    if (po.deliveryAddress) {
      message += `📍 *ALAMAT PENGHANTARAN:*\n`;
      message += `${po.deliveryAddress}\n\n`;
    }
    
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
      message += `📝 Nota: ${po.notes}\n\n`;
    }

    message += `Sila sahkan pesanan ini. Terima kasih! 🙏`;

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

  const handleDownloadPDF = (po: PurchaseOrder) => {
    try {
      const businessInfo = businessProfile ? {
        name: businessProfile.businessName,
        registrationNumber: businessProfile.registrationNumber || '',
        address: businessProfile.address || '',
        phone: businessProfile.phone || '',
        email: businessProfile.email || ''
      } : {
        name: "PocketBizz",
        registrationNumber: '',
        address: '',
        phone: '',
        email: ''
      };

      downloadPOPDF({
        poNumber: po.poNumber,
        supplierName: po.supplierName,
        supplierPhone: po.supplierPhone,
        supplierEmail: po.supplierEmail || '',
        supplierAddress: po.supplierAddress || '',
        deliveryAddress: po.deliveryAddress || '',
        totalAmount: po.totalAmount,
        notes: po.notes,
        createdAt: po.createdAt,
        status: po.status,
        items: po.items.map(item => ({
          itemName: item.itemName,
          quantity: item.quantity,
          unit: item.unit,
          estimatedPrice: item.estimatedPrice || "0",
          notes: item.notes
        }))
      }, businessInfo);

      toast({
        title: "PDF dimuat turun",
        description: `${po.poNumber}.pdf telah dimuat turun`,
      });
    } catch (error) {
      toast({
        title: "Ralat",
        description: "Gagal menjana PDF",
        variant: "destructive",
      });
    }
  };

  const handleOpenEmailDialog = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setEmailForm({
      recipientEmail: "",
      recipientName: po.supplierName,
      message: ""
    });
    setEmailDialogOpen(true);
  };

  const handleSendEmail = () => {
    if (!selectedPO) return;
    
    if (!emailForm.recipientEmail) {
      toast({
        title: "Email diperlukan",
        description: "Sila masukkan alamat email supplier",
        variant: "destructive",
      });
      return;
    }

    sendEmailMutation.mutate({ 
      id: selectedPO.id, 
      data: emailForm 
    });
  };

  const handleOpenEditDialog = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setEditForm({
      supplierName: po.supplierName,
      supplierPhone: po.supplierPhone || "",
      notes: po.notes || ""
    });
    setEditDialogOpen(true);
  };

  const handleUpdatePO = () => {
    if (!selectedPO) return;
    
    if (!editForm.supplierName.trim()) {
      toast({
        title: "Nama supplier diperlukan",
        description: "Sila masukkan nama supplier",
        variant: "destructive",
      });
      return;
    }

    updatePOMutation.mutate({ 
      id: selectedPO.id, 
      data: editForm 
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
    <div className="container mx-auto py-4 md:py-6 px-4 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">📦 Purchase Orders</h1>
          <p className="text-sm md:text-base text-muted-foreground">Urus pesanan pembelian dari supplier</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={() => setTemplatesDialogOpen(true)}
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
            data-testid="button-templates"
          >
            <FileText className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Templates ({templates.length})</span>
            <span className="sm:hidden ml-2">({templates.length})</span>
          </Button>
          <Button 
            onClick={() => setLocation("/shopping-list")}
            variant="default"
            size="sm"
            className="flex-1 sm:flex-none"
            data-testid="button-back-to-cart"
          >
            <ChevronRight className="h-4 w-4 sm:mr-2 rotate-180" />
            <span className="hidden sm:inline">Kembali ke Cart</span>
            <span className="sm:hidden ml-2">Cart</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-1 md:gap-2">
              <Clock className="h-3 md:h-4 w-3 md:w-4 text-amber-600" />
              Draft
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">{stats.draft}</div>
            <p className="text-xs text-muted-foreground mt-1">Belum dihantar</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-1 md:gap-2">
              <Send className="h-3 md:h-4 w-3 md:w-4 text-blue-600" />
              Dihantar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">{stats.sent}</div>
            <p className="text-xs text-muted-foreground mt-1">Menunggu barang</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-1 md:gap-2">
              <Check className="h-3 md:h-4 w-3 md:w-4 text-green-600" />
              Diterima
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">{stats.received}</div>
            <p className="text-xs text-muted-foreground mt-1">Siap</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20">
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-1 md:gap-2">
              <Package className="h-3 md:h-4 w-3 md:w-4 text-purple-600" />
              Nilai Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">RM {stats.totalValue.toFixed(2)}</div>
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
            <div className="space-y-3 md:space-y-4">
              {purchaseOrders.map((po) => (
                <div 
                  key={po.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 md:p-4 rounded-lg border bg-card hover-elevate gap-3"
                  data-testid={`po-${po.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 md:gap-3 mb-2 flex-wrap">
                      <span className="font-bold text-base md:text-lg">{po.poNumber}</span>
                      {getStatusBadge(po.status)}
                    </div>
                    <div className="text-xs md:text-sm text-muted-foreground space-y-1">
                      <div className="truncate">Supplier: <span className="font-medium">{po.supplierName}</span></div>
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

                  <div className="flex gap-1.5 md:gap-2 flex-wrap sm:flex-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(po)}
                      className="flex-1 sm:flex-none text-xs md:text-sm"
                      data-testid={`button-view-${po.id}`}
                    >
                      <FileText className="h-3 md:h-4 w-3 md:w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Lihat</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPDF(po)}
                      className="flex-none"
                      data-testid={`button-pdf-${po.id}`}
                    >
                      <Download className="h-3 md:h-4 w-3 md:w-4" />
                    </Button>

                    {po.status === 'draft' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditDialog(po)}
                          className="flex-none hidden sm:flex"
                          data-testid={`button-edit-${po.id}`}
                        >
                          <FileText className="h-3 md:h-4 w-3 md:w-4" />
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            updateStatusMutation.mutate({ id: po.id, status: 'sent' });
                            handleShareWhatsApp(po);
                          }}
                          className="flex-1 sm:flex-none text-xs md:text-sm"
                          data-testid={`button-send-${po.id}`}
                        >
                          <Send className="h-3 md:h-4 w-3 md:w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Hantar</span>
                        </Button>
                      </>
                    )}

                    {po.status === 'sent' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setSelectedPO(po);
                          setReceiveDialogOpen(true);
                        }}
                        className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none text-xs md:text-sm"
                        data-testid={`button-receive-${po.id}`}
                      >
                        <Check className="h-3 md:h-4 w-3 md:w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Terima</span>
                      </Button>
                    )}

                    {po.status === 'received' && (
                      <Badge variant="outline" className="px-2 md:px-3 py-1 text-xs">
                        ✅ Selesai
                      </Badge>
                    )}

                    {po.status === 'draft' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePOMutation.mutate(po.id)}
                        disabled={deletePOMutation.isPending}
                        className="flex-none"
                        data-testid={`button-delete-${po.id}`}
                      >
                        <X className="h-3 md:h-4 w-3 md:w-4" />
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">
              Purchase Order: {selectedPO?.poNumber}
            </DialogTitle>
            <DialogDescription>
              {selectedPO && getStatusBadge(selectedPO.status)}
            </DialogDescription>
          </DialogHeader>

          {selectedPO && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs md:text-sm">Supplier</p>
                  <p className="font-medium">{selectedPO.supplierName}</p>
                  {selectedPO.supplierPhone && (
                    <p className="text-xs text-muted-foreground">{selectedPO.supplierPhone}</p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground text-xs md:text-sm">Tarikh Dibuat</p>
                  <p className="font-medium text-sm md:text-base">
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
                  <p className="text-xs md:text-sm text-muted-foreground">Nota</p>
                  <p className="text-xs md:text-sm">{selectedPO.notes}</p>
                </div>
              )}

              <div>
                <p className="font-medium mb-2 text-sm md:text-base">Item Pesanan:</p>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="min-w-full inline-block align-middle">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs md:text-sm">Item</TableHead>
                          <TableHead className="text-xs md:text-sm">Kuantiti</TableHead>
                          <TableHead className="text-xs md:text-sm">Harga</TableHead>
                          <TableHead className="text-right text-xs md:text-sm">Jumlah</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedPO.items.map((item) => {
                          const price = parseFloat(item.actualPrice || item.estimatedPrice || '0');
                          const qty = parseFloat(item.quantity);
                          const total = price * qty;

                          return (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium text-xs md:text-sm">{item.itemName}</TableCell>
                              <TableCell className="text-xs md:text-sm whitespace-nowrap">{qty.toFixed(1)} {item.unit}</TableCell>
                              <TableCell className="text-xs md:text-sm whitespace-nowrap">RM {price.toFixed(2)}</TableCell>
                              <TableCell className="text-right text-xs md:text-sm whitespace-nowrap">RM {total.toFixed(2)}</TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow className="bg-muted/50">
                          <TableCell colSpan={3} className="font-bold text-xs md:text-sm">JUMLAH</TableCell>
                          <TableCell className="text-right font-bold text-xs md:text-sm whitespace-nowrap">
                            RM {parseFloat(selectedPO.totalAmount).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDetailDialogOpen(false);
                setSaveTemplateDialogOpen(true);
              }}
              className="w-full sm:w-auto text-xs md:text-sm"
              data-testid="button-save-template"
            >
              <Package className="h-3 md:h-4 w-3 md:w-4 mr-2" />
              Simpan Template
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectedPO && handleDownloadPDF(selectedPO)}
              className="w-full sm:w-auto text-xs md:text-sm"
              data-testid="button-download-pdf"
            >
              <Download className="h-3 md:h-4 w-3 md:w-4 mr-2" />
              Muat Turun PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDetailDialogOpen(false);
                selectedPO && handleOpenEmailDialog(selectedPO);
              }}
              className="w-full sm:w-auto text-xs md:text-sm"
              data-testid="button-email-po"
            >
              <Mail className="h-3 md:h-4 w-3 md:w-4 mr-2" />
              Email
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectedPO && handleShareWhatsApp(selectedPO)}
              className="w-full sm:w-auto text-xs md:text-sm"
              data-testid="button-share-po"
            >
              <Share2 className="h-3 md:h-4 w-3 md:w-4 mr-2" />
              WhatsApp
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setDetailDialogOpen(false)}
              className="w-full sm:w-auto text-xs md:text-sm"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Hantar PO melalui Email</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              PO akan dihantar sebagai lampiran PDF ke email supplier
            </DialogDescription>
          </DialogHeader>

          {selectedPO && (
            <div className="space-y-4">
              <div className="space-y-2 p-3 bg-muted rounded-md">
                <p className="text-xs md:text-sm">
                  <strong>PO Number:</strong> {selectedPO.poNumber}
                </p>
                <p className="text-xs md:text-sm">
                  <strong>Jumlah:</strong> RM {parseFloat(selectedPO.totalAmount).toFixed(2)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipient-email" className="text-xs md:text-sm">Email Supplier *</Label>
                <Input
                  id="recipient-email"
                  type="email"
                  placeholder="supplier@example.com"
                  value={emailForm.recipientEmail}
                  onChange={(e) => setEmailForm({ ...emailForm, recipientEmail: e.target.value })}
                  className="text-sm"
                  data-testid="input-recipient-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipient-name" className="text-xs md:text-sm">Nama Supplier (Pilihan)</Label>
                <Input
                  id="recipient-name"
                  type="text"
                  placeholder="Nama supplier"
                  value={emailForm.recipientName}
                  onChange={(e) => setEmailForm({ ...emailForm, recipientName: e.target.value })}
                  className="text-sm"
                  data-testid="input-recipient-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-xs md:text-sm">Mesej Tambahan (Pilihan)</Label>
                <Textarea
                  id="message"
                  placeholder="Tambah mesej kepada supplier..."
                  value={emailForm.message}
                  onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                  rows={3}
                  className="text-sm"
                  data-testid="input-message"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setEmailDialogOpen(false)}
              disabled={sendEmailMutation.isPending}
              className="w-full sm:w-auto text-xs md:text-sm"
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleSendEmail}
              disabled={sendEmailMutation.isPending}
              className="w-full sm:w-auto text-xs md:text-sm"
              data-testid="button-send-email"
            >
              {sendEmailMutation.isPending ? (
                <>
                  <div className="h-3 md:h-4 w-3 md:w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
                  Menghantar...
                </>
              ) : (
                <>
                  <Mail className="h-3 md:h-4 w-3 md:w-4 mr-2" />
                  Hantar Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit PO Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Edit Purchase Order</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Kemaskini maklumat supplier dan nota PO
            </DialogDescription>
          </DialogHeader>

          {selectedPO && (
            <div className="space-y-4">
              <div className="space-y-2 p-3 bg-muted rounded-md">
                <p className="text-xs md:text-sm">
                  <strong>PO Number:</strong> {selectedPO.poNumber}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Status: Draft
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-supplier-name" className="text-xs md:text-sm">Nama Supplier *</Label>
                <Input
                  id="edit-supplier-name"
                  type="text"
                  value={editForm.supplierName}
                  onChange={(e) => setEditForm({ ...editForm, supplierName: e.target.value })}
                  className="text-sm"
                  data-testid="input-edit-supplier-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-supplier-phone" className="text-xs md:text-sm">Telefon Supplier (Pilihan)</Label>
                <Input
                  id="edit-supplier-phone"
                  type="tel"
                  placeholder="0123456789"
                  value={editForm.supplierPhone}
                  onChange={(e) => setEditForm({ ...editForm, supplierPhone: e.target.value })}
                  className="text-sm"
                  data-testid="input-edit-supplier-phone"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes" className="text-xs md:text-sm">Nota (Pilihan)</Label>
                <Textarea
                  id="edit-notes"
                  placeholder="Nota tambahan..."
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={3}
                  className="text-sm"
                  data-testid="input-edit-notes"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setEditDialogOpen(false)}
              disabled={updatePOMutation.isPending}
              className="w-full sm:w-auto text-xs md:text-sm"
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleUpdatePO}
              disabled={updatePOMutation.isPending}
              className="w-full sm:w-auto text-xs md:text-sm"
              data-testid="button-save-edit"
            >
              {updatePOMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receive Confirmation Dialog */}
      <Dialog open={receiveDialogOpen} onOpenChange={setReceiveDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Sahkan Penerimaan Barang</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Tindakan ini akan mengemas kini stok dan merekod perbelanjaan secara automatik.
            </DialogDescription>
          </DialogHeader>

          {selectedPO && (
            <div className="space-y-2">
              <p className="text-xs md:text-sm">
                <strong>PO Number:</strong> {selectedPO.poNumber}
              </p>
              <p className="text-xs md:text-sm">
                <strong>Supplier:</strong> {selectedPO.supplierName}
              </p>
              <p className="text-xs md:text-sm">
                <strong>Jumlah:</strong> RM {parseFloat(selectedPO.totalAmount).toFixed(2)}
              </p>
              <p className="text-xs md:text-sm text-muted-foreground mt-4">
                Stok akan ditambah<br />
                Perbelanjaan akan direkod
              </p>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setReceiveDialogOpen(false)}
              className="w-full sm:w-auto text-xs md:text-sm"
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={() => selectedPO && markReceivedMutation.mutate(selectedPO.id)}
              disabled={markReceivedMutation.isPending}
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto text-xs md:text-sm"
              data-testid="button-confirm-receive"
            >
              {markReceivedMutation.isPending ? "Merekod..." : "Sahkan Terima"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Save Template Dialog */}
      <Dialog open={saveTemplateDialogOpen} onOpenChange={setSaveTemplateDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Simpan sebagai Template</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Template membolehkan anda cipta PO baharu dengan item yang sama
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name" className="text-xs md:text-sm">Nama Template *</Label>
              <Input
                id="template-name"
                placeholder="Contoh: Pesanan Bulanan Supplier ABC"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="text-sm"
                data-testid="input-template-name"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => {
                setSaveTemplateDialogOpen(false);
                setTemplateName("");
              }}
              className="w-full sm:w-auto text-xs md:text-sm"
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!templateName.trim()) {
                  toast({
                    title: "Nama diperlukan",
                    description: "Sila masukkan nama template",
                    variant: "destructive",
                  });
                  return;
                }
                if (selectedPO) {
                  saveTemplateMutation.mutate({ 
                    poId: selectedPO.id, 
                    templateName: templateName.trim() 
                  });
                }
              }}
              disabled={saveTemplateMutation.isPending}
              className="w-full sm:w-auto text-xs md:text-sm"
              data-testid="button-confirm-save-template"
            >
              {saveTemplateMutation.isPending ? "Menyimpan..." : "Simpan Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Templates List Dialog */}
      <Dialog open={templatesDialogOpen} onOpenChange={setTemplatesDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">PO Templates</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              {templates.length > 0 
                ? `${templates.length} template tersimpan` 
                : "Tiada template tersimpan"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {templates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-xs md:text-sm">Tiada template. Simpan PO sebagai template untuk kegunaan semula.</p>
              </div>
            ) : (
              templates.map((template: any) => (
                <Card key={template.id} className="hover-elevate">
                  <CardHeader className="pb-2 md:pb-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm md:text-base truncate">{template.templateName}</CardTitle>
                        <CardDescription className="mt-1 text-xs md:text-sm truncate">
                          {template.supplierName}
                          {template.supplierPhone && ` • ${template.supplierPhone}`}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          onClick={() => createFromTemplateMutation.mutate(template.id)}
                          disabled={createFromTemplateMutation.isPending}
                          className="flex-1 sm:flex-none text-xs md:text-sm"
                          data-testid={`button-use-template-${template.id}`}
                        >
                          <FileText className="h-3 md:h-4 w-3 md:w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Guna</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTemplateMutation.mutate(template.id)}
                          disabled={deleteTemplateMutation.isPending}
                          className="flex-none"
                          data-testid={`button-delete-template-${template.id}`}
                        >
                          <X className="h-3 md:h-4 w-3 md:w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-xs md:text-sm text-muted-foreground truncate">
                      {template.items?.length || 0} item
                      {template.notes && ` • ${template.notes}`}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setTemplatesDialogOpen(false)}
              className="w-full sm:w-auto text-xs md:text-sm"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
