import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Receipt,
  CheckCircle,
  XCircle,
  Printer,
  Edit,
  Trash2,
  AlertTriangle,
  FileText,
  Search,
} from "lucide-react";
import { ClaimInvoice } from "@/components/claim-invoice";
import html2canvas from "html2canvas";

interface Delivery {
  id: string;
  invoiceNumber: string;
  vendorId: string;
  vendorName: string;
  deliveryDate: string;
  totalAmount: string;
  items: DeliveryItem[];
}

interface DeliveryItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;  // Backend returns 'quantity', not 'quantityDelivered'
  rejectedQty?: number;
  unitPrice: string;
  unit: string;
  itemGross: string;
  itemRejected: string;
  itemNet: string;
  itemCommission: string;
  itemClaimable: string;
}

interface ClaimItem {
  deliveryItemId: string;
  productId: string;
  productName: string;
  unit: string;
  quantityDelivered: number;
  quantitySold: number;
  quantityExpired: number;
  quantityReturned: number;
  unitPrice: string;
  commissionRate: number;
  commissionAmount: string;
  grossAmount: string;
  claimableAmount: string;
}

interface PaymentClaim {
  id: string;
  claimNumber: string;
  vendorId: string;
  vendorName: string;
  claimDate: string;
  status: "draft" | "submitted" | "paid";
  totalGross: string;
  totalCommission: string;
  totalClaimable: string;
  notes: string;
  createdAt: string;
  items: ClaimItem[];
  deliveryIds: string[];
}

export function PaymentClaimsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "draft" | "submitted" | "paid">("all");
  const [selectedVendorFilter, setSelectedVendorFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<PaymentClaim | null>(null);

  // Fetch vendors
  const { data: vendors = [] } = useQuery<any[]>({
    queryKey: ["/api/vendors"],
  });

  // Fetch payment claims
  const { data: claims = [], isLoading } = useQuery<PaymentClaim[]>({
    queryKey: ["/api/payment-claims", selectedVendorFilter],
    queryFn: async () => {
      let url = "/api/payment-claims";
      if (selectedVendorFilter !== "all") {
        url += `?vendorId=${selectedVendorFilter}`;
      }
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch claims");
      return res.json();
    },
  });

  // Filter claims by tab
  const filteredClaims = claims.filter((claim) => {
    if (activeTab === "all") return true;
    return claim.status === activeTab;
  });

  const openClaimDetails = (claim: PaymentClaim) => {
    setSelectedClaim(claim);
    setViewDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tuntutan Bayaran Vendor</h1>
          <p className="text-muted-foreground mt-1">
            Buat tuntutan bayaran berdasarkan jualan sebenar dari kedai vendor
          </p>
        </div>
        <PaymentClaimCreateDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          vendors={vendors}
        />
      </div>

      {/* Info Card */}
      <Card className="border-blue-500 bg-blue-50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Sistem Tuntutan Bayaran</p>
              <p className="text-sm text-blue-700 mt-1">
                Sistem ini berasingan daripada INVOIS PENGHANTARAN. Di sini, vendor update jualan
                sebenar (sold/expired/returned) untuk buat tuntutan bayaran kepada kedai.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="w-64">
          <Label>Filter Vendor</Label>
          <Select value={selectedVendorFilter} onValueChange={setSelectedVendorFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Vendor</SelectItem>
              {vendors.map((vendor: any) => (
                <SelectItem key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
        <TabsList>
          <TabsTrigger value="all">
            Semua ({claims.length})
          </TabsTrigger>
          <TabsTrigger value="draft">
            Draft ({claims.filter((c) => c.status === "draft").length})
          </TabsTrigger>
          <TabsTrigger value="submitted">
            Dihantar ({claims.filter((c) => c.status === "submitted").length})
          </TabsTrigger>
          <TabsTrigger value="paid">
            Dibayar ({claims.filter((c) => c.status === "paid").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {isLoading ? (
            <p>Loading...</p>
          ) : filteredClaims.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Tiada tuntutan dijumpai
              </CardContent>
            </Card>
          ) : (
            filteredClaims.map((claim) => (
              <Card key={claim.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader onClick={() => openClaimDetails(claim)}>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        {claim.claimNumber}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {claim.vendorName} • {format(new Date(claim.claimDate), "dd MMM yyyy")}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        claim.status === "paid"
                          ? "default"
                          : claim.status === "submitted"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {claim.status === "draft"
                        ? "Draft"
                        : claim.status === "submitted"
                        ? "Dihantar"
                        : "Dibayar"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Jumlah Kasar</p>
                      <p className="font-semibold">
                        RM {parseFloat(claim.totalGross).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Komisen</p>
                      <p className="font-semibold text-red-600">
                        -RM {parseFloat(claim.totalCommission).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Boleh Dituntut</p>
                      <p className="font-semibold text-green-600">
                        RM {parseFloat(claim.totalClaimable).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tarikh Dicipta</p>
                      <p>{format(new Date(claim.createdAt), "dd MMM yyyy")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* View/Edit Dialog */}
      {selectedClaim && (
        <PaymentClaimViewDialog
          claim={selectedClaim}
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
        />
      )}
    </div>
  );
}

// ====== CREATE CLAIM WIZARD ======
interface PaymentClaimCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendors: any[];
}

function PaymentClaimCreateDialog({
  open,
  onOpenChange,
  vendors,
}: PaymentClaimCreateDialogProps) {
  const [step, setStep] = useState<"vendor" | "deliveries" | "quantities" | "preview">("vendor");
  const [vendorId, setVendorId] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [dateFrom, setDateFrom] = useState(
    format(startOfMonth(subMonths(new Date(), 1)), "yyyy-MM-dd")
  );
  const [dateTo, setDateTo] = useState(format(endOfMonth(subMonths(new Date(), 1)), "yyyy-MM-dd"));
  const [selectedDeliveryIds, setSelectedDeliveryIds] = useState<string[]>([]);
  const [claimItems, setClaimItems] = useState<ClaimItem[]>([]);
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  // Fetch deliveries for selected vendor and date range
  const { data: deliveries = [], isLoading: isLoadingDeliveries } = useQuery<Delivery[]>({
    queryKey: ["/api/deliveries", vendorId, dateFrom, dateTo],
    queryFn: async () => {
      if (!vendorId) return [];
      const res = await fetch(
        `/api/deliveries?vendorId=${vendorId}&dateFrom=${dateFrom}&dateTo=${dateTo}`,
        { credentials: "include" }
      );
      if (!res.ok) return [];
      const result = await res.json();
      return Array.isArray(result) ? result : result.data || [];
    },
    enabled: !!vendorId && step !== "vendor",
  });

  // Get vendor commission rate
  const selectedVendor = vendors.find((v) => v.id === vendorId);
  const commissionRate = selectedVendor?.commissionPercentage || 0;

  const resetWizard = () => {
    setStep("vendor");
    setVendorId("");
    setVendorName("");
    setSelectedDeliveryIds([]);
    setClaimItems([]);
    setNotes("");
  };

  const handleVendorSelect = () => {
    if (!vendorId) {
      toast({ title: "Ralat", description: "Sila pilih vendor", variant: "destructive" });
      return;
    }
    const vendor = vendors.find((v) => v.id === vendorId);
    setVendorName(vendor?.name || "");
    setStep("deliveries");
  };

  const handleDeliveriesSelect = () => {
    if (selectedDeliveryIds.length === 0) {
      toast({
        title: "Ralat",
        description: "Sila pilih sekurang-kurangnya 1 penghantaran",
        variant: "destructive",
      });
      return;
    }

    // Initialize claim items from selected deliveries
    const items: ClaimItem[] = [];
    selectedDeliveryIds.forEach((deliveryId) => {
      const delivery = deliveries.find((d) => d.id === deliveryId);
      if (delivery) {
        delivery.items.forEach((item) => {
          // Get rejected quantity - use direct field or calculate from amount
          let rejectedQty = 0;
          if (item.rejectedQty !== undefined && item.rejectedQty !== null) {
            // Use direct rejectedQty field from database
            rejectedQty = Number(item.rejectedQty) || 0;
          } else if (item.itemRejected) {
            // Fallback: calculate from itemRejected amount
            const unitPrice = parseFloat(item.unitPrice) || 1;
            rejectedQty = parseFloat(item.itemRejected) / unitPrice;
          }
          
          const netDelivered = item.quantity - rejectedQty;  // Use 'quantity', not 'quantityDelivered'
          const unitPrice = parseFloat(item.unitPrice) || 0;
          
          // Default: assume all sold (user will update rosak/return if any)
          const quantityExpired = 0;
          const quantityReturned = 0;
          const quantitySold = netDelivered - quantityExpired - quantityReturned;
          
          // Calculate amounts
          const grossAmount = quantitySold * unitPrice;
          const commissionAmount = (grossAmount * commissionRate) / 100;
          const claimableAmount = grossAmount - commissionAmount;
          
          items.push({
            deliveryItemId: item.id,
            productId: item.productId,
            productName: item.productName,
            unit: item.unit,
            quantityDelivered: item.quantity,  // Store as 'quantityDelivered' in ClaimItem
            quantitySold: quantitySold,
            quantityExpired: 0,
            quantityReturned: 0,
            unitPrice: item.unitPrice,
            commissionRate: commissionRate,
            commissionAmount: commissionAmount.toFixed(2),
            grossAmount: grossAmount.toFixed(2),
            claimableAmount: claimableAmount.toFixed(2),
          });
        });
      }
    });
    setClaimItems(items);
    setStep("quantities");
  };

  const toggleDelivery = (deliveryId: string) => {
    setSelectedDeliveryIds((prev) =>
      prev.includes(deliveryId) ? prev.filter((id) => id !== deliveryId) : [...prev, deliveryId]
    );
  };

  const updateClaimItem = (index: number, field: keyof ClaimItem, value: any) => {
    const newItems = [...claimItems];
    const item = newItems[index];
    
    // Update the field
    newItems[index] = { ...item, [field]: value };
    
    // Get delivery item to check rejected qty
    const delivery = deliveries.find((d) => 
      d.items.some((i) => i.id === item.deliveryItemId)
    );
    const deliveryItem = delivery?.items.find((i) => i.id === item.deliveryItemId);
    
    // Get rejected quantity
    let rejectedQty = 0;
    if (deliveryItem) {
      if (deliveryItem.rejectedQty !== undefined && deliveryItem.rejectedQty !== null) {
        rejectedQty = Number(deliveryItem.rejectedQty) || 0;
      } else if (deliveryItem.itemRejected) {
        const unitPrice = parseFloat(deliveryItem.unitPrice) || 1;
        rejectedQty = parseFloat(deliveryItem.itemRejected) / unitPrice;
      }
    }
    
    const netDelivered = item.quantityDelivered - rejectedQty;
    
    // Get updated values
    const expired = parseInt(newItems[index].quantityExpired.toString()) || 0;
    const returned = parseInt(newItems[index].quantityReturned.toString()) || 0;
    const unitPrice = parseFloat(item.unitPrice) || 0;

    // Validate: expired + returned cannot exceed net delivered
    if (expired + returned > netDelivered) {
      toast({
        title: "Ralat",
        description: `${item.productName}: Rosak (${expired}) + Return (${returned}) melebihi quantity bersih (${netDelivered.toFixed(2)})`,
        variant: "destructive",
      });
      return;
    }

    // Auto-calculate sold = net delivered - expired - returned
    const sold = netDelivered - expired - returned;
    
    // Calculate gross amount (sold items only)
    const grossAmount = sold * unitPrice;

    // Calculate commission
    const commissionAmount = (grossAmount * commissionRate) / 100;

    // Calculate claimable amount
    const claimableAmount = grossAmount - commissionAmount;

    newItems[index].quantitySold = sold;
    newItems[index].grossAmount = grossAmount.toFixed(2);
    newItems[index].commissionAmount = commissionAmount.toFixed(2);
    newItems[index].claimableAmount = claimableAmount.toFixed(2);

    setClaimItems(newItems);
  };

  const handlePreview = () => {
    // Validation already done in updateClaimItem
    // Just proceed to preview
    setStep("preview");
  };

  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/payment-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          vendorId,
          vendorName,
          claimDate: dateTo,
          status: "draft",
          items: claimItems.map(item => ({
            ...item,
            quantityDelivered: Math.round(item.quantityDelivered),
            quantitySold: Math.round(item.quantitySold),
            quantityExpired: Math.round(item.quantityExpired),
            quantityReturned: Math.round(item.quantityReturned),
          })),
          deliveryIds: selectedDeliveryIds,
          notes,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save draft");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-claims"] });
      toast({ title: "Berjaya!", description: "Draft disimpan" });
      onOpenChange(false);
      resetWizard();
    },
    onError: (error: any) => {
      toast({ title: "Ralat", description: error.message, variant: "destructive" });
    },
  });

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/payment-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          vendorId,
          vendorName,
          claimDate: dateTo,
          status: "submitted",
          items: claimItems.map(item => ({
            ...item,
            quantityDelivered: Math.round(item.quantityDelivered),
            quantitySold: Math.round(item.quantitySold),
            quantityExpired: Math.round(item.quantityExpired),
            quantityReturned: Math.round(item.quantityReturned),
          })),
          deliveryIds: selectedDeliveryIds,
          notes,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to submit claim");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-claims"] });
      toast({ title: "Berjaya!", description: "Tuntutan dihantar" });
      onOpenChange(false);
      resetWizard();
    },
    onError: (error: any) => {
      toast({ title: "Ralat", description: error.message, variant: "destructive" });
    },
  });

  const totalGross = claimItems.reduce(
    (sum, item) => sum + parseFloat(item.grossAmount || "0"),
    0
  );
  const totalCommission = claimItems.reduce(
    (sum, item) => sum + parseFloat(item.commissionAmount || "0"),
    0
  );
  const totalClaimable = claimItems.reduce(
    (sum, item) => sum + parseFloat(item.claimableAmount || "0"),
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Button onClick={() => onOpenChange(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Buat Tuntutan Bayaran
      </Button>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buat Tuntutan Bayaran Vendor</DialogTitle>
          <DialogDescription>
            Langkah {step === "vendor" ? "1" : step === "deliveries" ? "2" : step === "quantities" ? "3" : "4"} daripada 4
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Vendor Selection */}
          {step === "vendor" && (
            <div className="space-y-4">
              <div>
                <Label>Pilih Vendor *</Label>
                <Select value={vendorId} onValueChange={setVendorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name} (Komisen: {vendor.commissionPercentage}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tarikh Mula *</Label>
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div>
                  <Label>Tarikh Akhir *</Label>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Batal
                </Button>
                <Button onClick={handleVendorSelect}>Seterusnya</Button>
              </div>
            </div>
          )}

          {/* Step 2: Delivery Selection */}
          {step === "deliveries" && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Pilih penghantaran untuk {vendorName} ({format(new Date(dateFrom), "dd MMM")} -{" "}
                  {format(new Date(dateTo), "dd MMM yyyy")})
                </p>

                {isLoadingDeliveries ? (
                  <p>Loading...</p>
                ) : deliveries.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      Tiada penghantaran dijumpai dalam tempoh ini
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {deliveries.map((delivery) => (
                      <Card
                        key={delivery.id}
                        className={`cursor-pointer transition-all ${
                          selectedDeliveryIds.includes(delivery.id)
                            ? "border-blue-500 bg-blue-50"
                            : "hover:bg-secondary"
                        }`}
                        onClick={() => toggleDelivery(delivery.id)}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{delivery.invoiceNumber}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(delivery.deliveryDate), "dd MMM yyyy")} •{" "}
                                {delivery.items.length} items
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                RM {parseFloat(delivery.totalAmount).toFixed(2)}
                              </p>
                              {selectedDeliveryIds.includes(delivery.id) && (
                                <Badge className="mt-1">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Dipilih
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep("vendor")}>
                  Kembali
                </Button>
                <Button onClick={handleDeliveriesSelect}>
                  Seterusnya ({selectedDeliveryIds.length} dipilih)
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Quantity Editor */}
          {step === "quantities" && (
            <div className="space-y-4">
              <div>
                <Card className="mb-4 border-blue-500 bg-blue-50">
                  <CardContent className="pt-4">
                    <p className="text-sm text-blue-900">
                      💡 <strong>Panduan:</strong> Update hanya baki akhir (Rosak & Return). 
                      Sistem akan auto-kira jualan = Bersih Dihantar - Rosak - Return
                    </p>
                  </CardContent>
                </Card>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {claimItems.map((item, index) => {
                    // Get delivery item for rejected qty info
                    const delivery = deliveries.find((d) => 
                      d.items.some((i) => i.id === item.deliveryItemId)
                    );
                    const deliveryItem = delivery?.items.find((i) => i.id === item.deliveryItemId);
                    
                    // Get rejected quantity with proper null/undefined handling
                    let rejectedQty = 0;
                    if (deliveryItem) {
                      if (deliveryItem.rejectedQty !== undefined && deliveryItem.rejectedQty !== null) {
                        rejectedQty = Number(deliveryItem.rejectedQty) || 0;
                      } else if (deliveryItem.itemRejected) {
                        const unitPrice = parseFloat(deliveryItem.unitPrice) || 1;
                        rejectedQty = parseFloat(deliveryItem.itemRejected) / unitPrice;
                      }
                    }
                    
                    const netDelivered = item.quantityDelivered - rejectedQty;
                    
                    return (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{item.productName}</p>
                                <div className="text-sm text-muted-foreground space-y-0.5">
                                  <p>Dihantar: {item.quantityDelivered} {item.unit}</p>
                                  {rejectedQty > 0 && (
                                    <p className="text-red-600">Tolak Rosak Penghantaran: {rejectedQty.toFixed(2)}</p>
                                  )}
                                  <p className="font-semibold text-blue-600">
                                    Bersih Dihantar: {netDelivered.toFixed(2)} {item.unit}
                                  </p>
                                  <p className="text-xs">@ RM {parseFloat(item.unitPrice).toFixed(2)}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">Boleh Dituntut</p>
                                <p className="text-lg font-bold text-green-600">
                                  RM {item.claimableAmount}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <Label className="text-xs text-green-600 font-semibold">Terjual (Auto)</Label>
                                <Input
                                  type="number"
                                  value={item.quantitySold.toFixed(2)}
                                  disabled
                                  className="bg-green-50 text-green-700 font-semibold"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Rosak (Update)</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max={netDelivered}
                                  value={item.quantityExpired}
                                  onChange={(e) =>
                                    updateClaimItem(
                                      index,
                                      "quantityExpired",
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className="border-orange-300 focus:border-orange-500"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Return (Update)</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max={netDelivered}
                                  value={item.quantityReturned}
                                  onChange={(e) =>
                                    updateClaimItem(
                                      index,
                                      "quantityReturned",
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className="border-orange-300 focus:border-orange-500"
                                />
                              </div>
                            </div>

                            <div className="text-xs space-y-1">
                              <p className="text-muted-foreground">
                                Formula: <strong className="text-blue-600">{netDelivered.toFixed(2)}</strong> (bersih) - 
                                <strong className="text-orange-600"> {item.quantityExpired}</strong> (rosak) - 
                                <strong className="text-orange-600"> {item.quantityReturned}</strong> (return) = 
                                <strong className="text-green-600"> {item.quantitySold.toFixed(2)}</strong> (terjual)
                              </p>
                              <p className="text-muted-foreground">
                                Kasar: RM {item.grossAmount} | Komisen ({commissionRate}%): -RM{" "}
                                {item.commissionAmount}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep("deliveries")}>
                  Kembali
                </Button>
                <Button onClick={handlePreview}>Preview</Button>
              </div>
            </div>
          )}

          {/* Step 4: Preview */}
          {step === "preview" && (
            <div className="space-y-4">
              <Card className="border-green-500">
                <CardHeader>
                  <CardTitle>Ringkasan Tuntutan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Jumlah Kasar</p>
                      <p className="text-2xl font-bold">RM {totalGross.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Boleh Dituntut</p>
                      <p className="text-2xl font-bold text-green-600">
                        RM {totalClaimable.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label>Nota (Optional)</Label>
                    <Textarea
                      placeholder="Tambah nota tambahan..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {claimItems.map((item, index) => {
                  const delivery = deliveries.find((d) => 
                    d.items.some((i) => i.id === item.deliveryItemId)
                  );
                  const deliveryItem = delivery?.items.find((i) => i.id === item.deliveryItemId);
                  
                  // Get rejected quantity with proper null/undefined handling
                  let rejectedQty = 0;
                  if (deliveryItem) {
                    if (deliveryItem.rejectedQty !== undefined && deliveryItem.rejectedQty !== null) {
                      rejectedQty = Number(deliveryItem.rejectedQty) || 0;
                    } else if (deliveryItem.itemRejected) {
                      const unitPrice = parseFloat(deliveryItem.unitPrice) || 1;
                      rejectedQty = parseFloat(deliveryItem.itemRejected) / unitPrice;
                    }
                  }
                  
                  const netDelivered = item.quantityDelivered - rejectedQty;
                  
                  return (
                    <div key={index} className="text-sm p-3 border rounded">
                      <div className="flex justify-between">
                        <span className="font-medium">{item.productName}</span>
                        <span className="text-green-600">RM {item.claimableAmount}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                        <p>Bersih Dihantar: {netDelivered.toFixed(2)} | Terjual: {item.quantitySold.toFixed(2)}</p>
                        <p>Rosak: {item.quantityExpired} | Return: {item.quantityReturned}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep("quantities")}>
                  Kembali
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => saveDraftMutation.mutate()}
                    disabled={saveDraftMutation.isPending || submitMutation.isPending}
                  >
                    Simpan Draft
                  </Button>
                  <Button
                    onClick={() => submitMutation.mutate()}
                    disabled={saveDraftMutation.isPending || submitMutation.isPending}
                  >
                    Hantar Tuntutan
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ====== VIEW/EDIT CLAIM DIALOG ======
interface PaymentClaimViewDialogProps {
  claim: PaymentClaim;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PaymentClaimViewDialog({ claim, open, onOpenChange }: PaymentClaimViewDialogProps) {
  const { toast } = useToast();
  const [isPrinting, setIsPrinting] = useState(false);

  // Mark as paid mutation
  const markPaidMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/payment-claims/${claim.id}/mark-paid`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to mark as paid");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-claims"] });
      toast({ title: "Berjaya!", description: "Tuntutan ditanda sebagai dibayar" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Ralat", description: error.message, variant: "destructive" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/payment-claims/${claim.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete claim");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-claims"] });
      toast({ title: "Berjaya!", description: "Tuntutan dipadam" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Ralat", description: error.message, variant: "destructive" });
    },
  });

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const element = document.getElementById(`claim-invoice-${claim.id}`);
      if (!element) throw new Error("Invoice element not found");

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>${claim.claimNumber}</title></head>
            <body style="margin:0;padding:0;">
              <img src="${imgData}" style="width:100%;height:auto;" />
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    } catch (error) {
      console.error("Print error:", error);
      toast({ title: "Ralat", description: "Gagal print invoice", variant: "destructive" });
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{claim.claimNumber}</DialogTitle>
              <DialogDescription>
                {claim.vendorName} • {format(new Date(claim.claimDate), "dd MMM yyyy")}
              </DialogDescription>
            </div>
            <Badge
              variant={
                claim.status === "paid"
                  ? "default"
                  : claim.status === "submitted"
                  ? "secondary"
                  : "outline"
              }
            >
              {claim.status === "draft"
                ? "Draft"
                : claim.status === "submitted"
                ? "Dihantar"
                : "Dibayar"}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Card */}
          <Card className="border-green-500">
            <CardContent className="pt-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Jumlah Kasar</p>
                  <p className="text-2xl font-bold">RM {parseFloat(claim.totalGross).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Komisen</p>
                  <p className="text-2xl font-bold text-red-600">
                    -RM {parseFloat(claim.totalCommission).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Boleh Dituntut</p>
                  <p className="text-2xl font-bold text-green-600">
                    RM {parseFloat(claim.totalClaimable).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items Breakdown */}
          <div>
            <Label className="text-lg font-semibold">Butiran Produk</Label>
            <div className="mt-3 space-y-2">
              {claim.items.map((item, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <div className="text-sm text-muted-foreground mt-1 space-y-1">
                          <p>
                            Terjual: {item.quantitySold} {item.unit} @ RM{" "}
                            {parseFloat(item.unitPrice).toFixed(2)}
                          </p>
                          <p>Rosak: {item.quantityExpired} | Return: {item.quantityReturned}</p>
                          <p>
                            Kasar: RM {item.grossAmount} | Komisen: -RM {item.commissionAmount}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Claimable</p>
                        <p className="text-xl font-bold text-green-600">
                          RM {item.claimableAmount}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Notes */}
          {claim.notes && (
            <Card>
              <CardContent className="pt-4">
                <Label className="text-sm font-medium">Nota:</Label>
                <p className="text-sm text-muted-foreground mt-1">{claim.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Thermal Invoice (Hidden, for printing) */}
          <div className="hidden">
            <ClaimInvoice
              claim={{
                id: claim.id,
                vendorId: claim.vendorId,
                vendorName: claim.vendorName,
                claimNumber: claim.claimNumber,
                claimDate: claim.claimDate,
                periodFrom: claim.claimDate, // TODO: Get actual period from deliveries
                periodTo: claim.claimDate,
                deliveryInvoices: claim.deliveryIds.map((_, i) => `INV-${i + 1}`), // TODO: Get actual invoice numbers
                items: claim.items.map((item) => ({
                  productName: item.productName,
                  deliveredQty: item.quantityDelivered,
                  soldQty: item.quantitySold,
                  expiredQty: item.quantityExpired,
                  returnedQty: item.quantityReturned,
                  unitPrice: item.unitPrice,
                  claimAmount: item.claimableAmount,
                })),
                totalDelivered: claim.totalGross,
                totalClaim: claim.totalClaimable,
                status: claim.status,
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <div className="flex gap-2">
              {claim.status === "draft" && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Padam
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint} disabled={isPrinting}>
                <Printer className="h-4 w-4 mr-1" />
                {isPrinting ? "Printing..." : "Print Invoice"}
              </Button>
              {claim.status === "submitted" && (
                <Button onClick={() => markPaidMutation.mutate()} disabled={markPaidMutation.isPending}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Tandakan Dibayar
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
