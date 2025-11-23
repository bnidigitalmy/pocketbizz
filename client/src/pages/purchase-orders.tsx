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
    message: "",
    pdfBase64: ""
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    supplierName: "",
    supplierPhone: "",
    supplierEmail: "",
    supplierAddress: "",
    deliveryAddress: "",
    notes: "",
    expectedDeliveryDate: "",
    paymentTerms: "30 hari selepas penghantaran",
    paymentMethod: "Bank Transfer",
    requestedBy: "",
    discount: "0",
    tax: "0",
    shippingCharges: "0",
    items: [] as Array<{
      id?: string;
      itemName: string;
      quantity: string;
      unit: string;
      estimatedPrice: string;
      notes: string;
    }>
  });
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templatesDialogOpen, setTemplatesDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);

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
      setEmailForm({ recipientEmail: "", recipientName: "", message: "", pdfBase64: "" });
      // Auto update status to 'sent' after sending email
      if (selectedPO && selectedPO.status === 'draft') {
        updateStatusMutation.mutate({ id: selectedPO.id, status: 'sent' });
      }
      toast({
        title: "Email dihantar ✅",
        description: "PO telah berjaya dihantar ke supplier dengan lampiran PDF",
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
      setEditForm({ 
        supplierName: "", 
        supplierPhone: "", 
        supplierEmail: "",
        supplierAddress: "",
        deliveryAddress: "",
        notes: "",
        expectedDeliveryDate: "",
        paymentTerms: "30 hari selepas penghantaran",
        paymentMethod: "Bank Transfer",
        requestedBy: "",
        discount: "0",
        tax: "0",
        shippingCharges: "0",
        items: []
      });
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

  const duplicatePOMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/purchase-orders/${id}/duplicate`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      setDuplicateDialogOpen(false);
      setSelectedPO(null);
      toast({
        title: "PO diduplikasi ✅",
        description: "Purchase order baharu telah dicipta sebagai draft",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal duplikasi PO",
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
      recipientEmail: po.supplierEmail || "",
      recipientName: po.supplierName,
      message: "",
      pdfBase64: ""
    });
    setEmailDialogOpen(true);
  };

  const handleSendEmail = async () => {
    if (!selectedPO) return;
    
    if (!emailForm.recipientEmail) {
      toast({
        title: "Email diperlukan",
        description: "Sila masukkan alamat email supplier",
        variant: "destructive",
      });
      return;
    }

    try {
      // Generate PDF first
      const { generatePOPDF } = await import("@/lib/po-pdf-generator");
      
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

      const doc = generatePOPDF({
        poNumber: selectedPO.poNumber,
        supplierName: selectedPO.supplierName,
        supplierPhone: selectedPO.supplierPhone,
        supplierEmail: selectedPO.supplierEmail || '',
        supplierAddress: selectedPO.supplierAddress || '',
        deliveryAddress: selectedPO.deliveryAddress || '',
        totalAmount: selectedPO.totalAmount,
        notes: selectedPO.notes,
        createdAt: selectedPO.createdAt,
        status: selectedPO.status,
        expectedDeliveryDate: (selectedPO as any).expectedDeliveryDate,
        paymentTerms: (selectedPO as any).paymentTerms,
        paymentMethod: (selectedPO as any).paymentMethod,
        requestedBy: (selectedPO as any).requestedBy,
        discount: (selectedPO as any).discount,
        tax: (selectedPO as any).tax,
        shippingCharges: (selectedPO as any).shippingCharges,
        items: selectedPO.items.map(item => ({
          itemName: item.itemName,
          quantity: item.quantity,
          unit: item.unit,
          estimatedPrice: item.estimatedPrice || "0",
          notes: item.notes
        }))
      }, businessInfo);

      // Convert PDF to base64
      const pdfBase64 = doc.output('datauristring').split(',')[1];

      sendEmailMutation.mutate({ 
        id: selectedPO.id, 
        data: {
          ...emailForm,
          pdfBase64
        }
      });
    } catch (error: any) {
      toast({
        title: "Ralat",
        description: error.message || "Gagal menjana PDF",
        variant: "destructive",
      });
    }
  };

  const handleOpenEditDialog = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setEditForm({
      supplierName: po.supplierName,
      supplierPhone: po.supplierPhone || "",
      supplierEmail: po.supplierEmail || "",
      supplierAddress: po.supplierAddress || "",
      deliveryAddress: po.deliveryAddress || "",
      notes: po.notes || "",
      expectedDeliveryDate: (po as any).expectedDeliveryDate || "",
      paymentTerms: (po as any).paymentTerms || "30 hari selepas penghantaran",
      paymentMethod: (po as any).paymentMethod || "Bank Transfer",
      requestedBy: (po as any).requestedBy || "",
      discount: (po as any).discount || "0",
      tax: (po as any).tax || "0",
      shippingCharges: (po as any).shippingCharges || "0",
      items: po.items.map(item => ({
        id: item.id,
        itemName: item.itemName,
        quantity: item.quantity,
        unit: item.unit,
        estimatedPrice: item.estimatedPrice || "0",
        notes: item.notes || ""
      }))
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

    if (editForm.items.length === 0) {
      toast({
        title: "Item diperlukan",
        description: "Sila tambah sekurang-kurangnya satu item",
        variant: "destructive",
      });
      return;
    }

    // Validate all items have required fields
    const invalidItems = editForm.items.filter(item => 
      !item.itemName.trim() || !item.quantity || parseFloat(item.quantity) <= 0
    );

    if (invalidItems.length > 0) {
      toast({
        title: "Maklumat item tidak lengkap",
        description: "Pastikan semua item mempunyai nama dan kuantiti yang sah",
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
                    {/* Common Actions - Always visible */}
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
                      title="Muat turun PDF"
                    >
                      <Download className="h-3 md:h-4 w-3 md:w-4" />
                    </Button>

                    {/* DRAFT Status Actions */}
                    {po.status === 'draft' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditDialog(po)}
                          className="flex-none"
                          data-testid={`button-edit-${po.id}`}
                          title="Edit PO"
                        >
                          <FileText className="h-3 md:h-4 w-3 md:w-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEmailDialog(po)}
                          className="flex-none hidden md:flex"
                          title="Hantar via Email"
                        >
                          <Mail className="h-3 md:h-4 w-3 md:w-4" />
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
                          <span className="hidden sm:inline">WhatsApp</span>
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deletePOMutation.mutate(po.id)}
                          disabled={deletePOMutation.isPending}
                          className="flex-none"
                          data-testid={`button-delete-${po.id}`}
                          title="Padam"
                        >
                          <X className="h-3 md:h-4 w-3 md:w-4" />
                        </Button>
                      </>
                    )}

                    {/* SENT Status Actions */}
                    {po.status === 'sent' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShareWhatsApp(po)}
                          className="flex-none hidden md:flex"
                          title="Hantar semula"
                        >
                          <Share2 className="h-3 md:h-4 w-3 md:w-4" />
                        </Button>
                        
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
                      </>
                    )}

                    {/* RECEIVED Status Actions */}
                    {po.status === 'received' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPO(po);
                            setDuplicateDialogOpen(true);
                          }}
                          className="flex-1 sm:flex-none text-xs md:text-sm"
                          title="Duplikasi untuk order semula"
                        >
                          <Package className="h-3 md:h-4 w-3 md:w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Order Semula</span>
                        </Button>
                        
                        <Badge variant="outline" className="px-2 md:px-3 py-1 text-xs">
                          ✅ Selesai
                        </Badge>
                      </>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Edit Purchase Order</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Kemaskini maklumat supplier, items, dan nota PO (Status: Draft)
            </DialogDescription>
          </DialogHeader>

          {selectedPO && (
            <div className="space-y-4">
              <div className="space-y-2 p-3 bg-muted rounded-md">
                <p className="text-xs md:text-sm">
                  <strong>PO Number:</strong> {selectedPO.poNumber}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Status: Draft - Boleh dikemaskini
                </p>
              </div>

              {/* Supplier Info */}
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-sm">Maklumat Supplier</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                    <Label htmlFor="edit-supplier-phone" className="text-xs md:text-sm">Telefon</Label>
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
                    <Label htmlFor="edit-supplier-email" className="text-xs md:text-sm">Email</Label>
                    <Input
                      id="edit-supplier-email"
                      type="email"
                      placeholder="supplier@example.com"
                      value={editForm.supplierEmail}
                      onChange={(e) => setEditForm({ ...editForm, supplierEmail: e.target.value })}
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-supplier-address" className="text-xs md:text-sm">Alamat Supplier</Label>
                    <Input
                      id="edit-supplier-address"
                      type="text"
                      placeholder="Alamat penuh"
                      value={editForm.supplierAddress}
                      onChange={(e) => setEditForm({ ...editForm, supplierAddress: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-delivery-address" className="text-xs md:text-sm">Alamat Penghantaran</Label>
                  <Textarea
                    id="edit-delivery-address"
                    placeholder="Alamat untuk penghantaran (jika berbeza)"
                    value={editForm.deliveryAddress}
                    onChange={(e) => setEditForm({ ...editForm, deliveryAddress: e.target.value })}
                    rows={2}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Payment & Delivery Details */}
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-sm">Maklumat Pembayaran & Penghantaran</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-expected-delivery" className="text-xs md:text-sm">Tarikh Jangka Penghantaran</Label>
                    <Input
                      id="edit-expected-delivery"
                      type="date"
                      value={editForm.expectedDeliveryDate}
                      onChange={(e) => setEditForm({ ...editForm, expectedDeliveryDate: e.target.value })}
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">Bila nak terima barang?</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-payment-terms" className="text-xs md:text-sm">Terma Bayaran</Label>
                    <select
                      id="edit-payment-terms"
                      value={editForm.paymentTerms}
                      onChange={(e) => setEditForm({ ...editForm, paymentTerms: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="Cash on Delivery (COD)">Cash on Delivery (COD)</option>
                      <option value="7 hari selepas penghantaran">7 hari selepas penghantaran</option>
                      <option value="14 hari selepas penghantaran">14 hari selepas penghantaran</option>
                      <option value="30 hari selepas penghantaran">30 hari selepas penghantaran</option>
                      <option value="60 hari selepas penghantaran">60 hari selepas penghantaran</option>
                      <option value="Bayaran Pendahuluan 50%">Bayaran Pendahuluan 50%</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-payment-method" className="text-xs md:text-sm">Cara Bayaran</Label>
                    <select
                      id="edit-payment-method"
                      value={editForm.paymentMethod}
                      onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Tunai">Tunai</option>
                      <option value="Cek">Cek</option>
                      <option value="Online Banking">Online Banking</option>
                      <option value="E-Wallet">E-Wallet</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-requested-by" className="text-xs md:text-sm">Diminta Oleh</Label>
                    <Input
                      id="edit-requested-by"
                      type="text"
                      placeholder="Nama orang yang minta PO"
                      value={editForm.requestedBy}
                      onChange={(e) => setEditForm({ ...editForm, requestedBy: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Financial Details */}
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-sm">Maklumat Kewangan Tambahan</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-discount" className="text-xs md:text-sm">Diskaun (RM)</Label>
                    <Input
                      id="edit-discount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={editForm.discount}
                      onChange={(e) => setEditForm({ ...editForm, discount: e.target.value })}
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-shipping" className="text-xs md:text-sm">Kos Penghantaran (RM)</Label>
                    <Input
                      id="edit-shipping"
                      type="number"
                      step="0.01"
                      min="0"
                      value={editForm.shippingCharges}
                      onChange={(e) => setEditForm({ ...editForm, shippingCharges: e.target.value })}
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-tax" className="text-xs md:text-sm">Cukai/SST (RM)</Label>
                    <Input
                      id="edit-tax"
                      type="number"
                      step="0.01"
                      min="0"
                      value={editForm.tax}
                      onChange={(e) => setEditForm({ ...editForm, tax: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t bg-muted/30 -mx-4 -mb-3 px-4 py-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold">Jumlah Anggaran (dengan semua charges):</span>
                    <span className="text-lg font-bold text-primary">
                      RM {(() => {
                        const subtotal = editForm.items.reduce((sum, item) => 
                          sum + (parseFloat(item.estimatedPrice || "0") * parseFloat(item.quantity || "0")), 0
                        );
                        const discount = parseFloat(editForm.discount || "0");
                        const shipping = parseFloat(editForm.shippingCharges || "0");
                        const tax = parseFloat(editForm.tax || "0");
                        return (subtotal - discount + shipping + tax).toFixed(2);
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-sm">Item Pesanan</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditForm({
                        ...editForm,
                        items: [
                          ...editForm.items,
                          { itemName: "", quantity: "1", unit: "unit", estimatedPrice: "0", notes: "" }
                        ]
                      });
                    }}
                    className="text-xs"
                  >
                    + Tambah Item
                  </Button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {editForm.items.map((item, index) => (
                    <div key={index} className="border rounded p-3 space-y-2 bg-background">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <div className="md:col-span-2">
                          <Label className="text-xs">Nama Item *</Label>
                          <Input
                            value={item.itemName}
                            onChange={(e) => {
                              const newItems = [...editForm.items];
                              newItems[index].itemName = e.target.value;
                              setEditForm({ ...editForm, items: newItems });
                            }}
                            placeholder="Nama item"
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Kuantiti *</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={item.quantity}
                            onChange={(e) => {
                              const newItems = [...editForm.items];
                              newItems[index].quantity = e.target.value;
                              setEditForm({ ...editForm, items: newItems });
                            }}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Unit</Label>
                          <Input
                            value={item.unit}
                            onChange={(e) => {
                              const newItems = [...editForm.items];
                              newItems[index].unit = e.target.value;
                              setEditForm({ ...editForm, items: newItems });
                            }}
                            placeholder="kg/unit"
                            className="text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Harga (RM)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.estimatedPrice}
                            onChange={(e) => {
                              const newItems = [...editForm.items];
                              newItems[index].estimatedPrice = e.target.value;
                              setEditForm({ ...editForm, items: newItems });
                            }}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Nota</Label>
                          <div className="flex gap-1">
                            <Input
                              value={item.notes}
                              onChange={(e) => {
                                const newItems = [...editForm.items];
                                newItems[index].notes = e.target.value;
                                setEditForm({ ...editForm, items: newItems });
                              }}
                              placeholder="Nota tambahan"
                              className="text-sm"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const newItems = editForm.items.filter((_, i) => i !== index);
                                setEditForm({ ...editForm, items: newItems });
                              }}
                              className="flex-shrink-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {editForm.items.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Tiada item. Klik "Tambah Item" untuk tambah.
                    </p>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="edit-notes" className="text-xs md:text-sm">Nota Tambahan</Label>
                <Textarea
                  id="edit-notes"
                  placeholder="Nota tambahan untuk PO ini..."
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
              {updatePOMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
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

      {/* Duplicate PO Dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Duplikasi Purchase Order</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Cipta PO baharu berdasarkan PO yang telah diterima ini
            </DialogDescription>
          </DialogHeader>

          {selectedPO && (
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-md space-y-1">
                <p className="text-xs md:text-sm">
                  <strong>PO Asal:</strong> {selectedPO.poNumber}
                </p>
                <p className="text-xs md:text-sm">
                  <strong>Supplier:</strong> {selectedPO.supplierName}
                </p>
                <p className="text-xs md:text-sm">
                  <strong>Jumlah:</strong> RM {parseFloat(selectedPO.totalAmount).toFixed(2)}
                </p>
                <p className="text-xs md:text-sm">
                  <strong>Items:</strong> {selectedPO.items.length} item
                </p>
              </div>

              <div className="p-3 border rounded-md bg-blue-50 dark:bg-blue-950/20">
                <p className="text-xs md:text-sm">
                  ℹ️ PO baharu akan dicipta sebagai <strong>Draft</strong> dengan maklumat supplier dan items yang sama. 
                  Anda boleh edit sebelum menghantar.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => {
                setDuplicateDialogOpen(false);
                setSelectedPO(null);
              }}
              disabled={duplicatePOMutation.isPending}
              className="w-full sm:w-auto text-xs md:text-sm"
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={() => selectedPO && duplicatePOMutation.mutate(selectedPO.id)}
              disabled={duplicatePOMutation.isPending}
              className="w-full sm:w-auto text-xs md:text-sm"
              data-testid="button-confirm-duplicate"
            >
              {duplicatePOMutation.isPending ? "Menduplikasi..." : "Duplikasi PO"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
