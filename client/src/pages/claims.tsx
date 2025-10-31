import { useState, useMemo } from "react";
import { useQuery, useMutation, useInfiniteQuery } from "@tanstack/react-query";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Clock, CheckCircle2, AlertCircle, Share2, FileText, Printer, Eye, Package, Filter, X, Download, MessageCircle } from "lucide-react";
import { generateClaimStatementPDF, generateThermalClaimStatementPDF } from "@/lib/pdf-utils";
import { DeliveryInvoiceDialog } from "@/components/delivery-invoice-dialog";
import { 
  sendWhatsApp, 
  generateInvoiceMessage, 
  generateDeliveryMessage, 
  generatePaymentReminder,
  formatWhatsAppPhone 
} from "@/lib/whatsapp";

interface ClaimSummary {
  vendorId: string;
  vendorName: string;
  totalDeliveries: number;
  totalAmount: string;
  pendingAmount: string;
  settledAmount: string;
  partialAmount: string;
  daysOverdue: number;
}

interface DeliveryWithItems {
  id: string;
  vendorId: string;
  vendorName: string;
  deliveryDate: string;
  status: string;
  paymentStatus: string;
  totalAmount: string;
  items: any[];
}

export default function Claims() {
  const { toast } = useToast();
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'summary' | 'individual'>('summary');
  const [filterVendor, setFilterVendor] = useState<string>("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [pendingWhatsAppAction, setPendingWhatsAppAction] = useState<(() => void) | null>(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);

  // Fetch business profile for invoice header
  const { data: businessProfile } = useQuery({
    queryKey: ["/api/business-profile"],
  });

  const {
    data,
    isLoading: claimsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["/api/claims"],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(`/api/claims?limit=20&offset=${pageParam}`);
      if (!response.ok) throw new Error("Failed to fetch claims");
      return response.json();
    },
    getNextPageParam: (lastPage, allPages) => {
      // Check if lastPage exists and has the expected structure
      if (!lastPage || typeof lastPage !== 'object') return undefined;
      if (!lastPage.hasMore) return undefined;
      
      // Calculate offset based on all pages fetched so far
      const totalItems = allPages.reduce((acc, page) => {
        if (page && Array.isArray(page.data)) {
          return acc + page.data.length;
        }
        return acc;
      }, 0);
      
      return totalItems;
    },
    initialPageParam: 0,
  });

  // Flatten all pages into single array
  const claims = data?.pages?.flatMap(page => page?.data || []) || [];

  // Fetch all deliveries for filtering and PDF generation
  const { data: deliveriesData } = useQuery<any>({
    queryKey: ["/api/deliveries"],
  });

  // Extract deliveries array from response
  const deliveries = deliveriesData?.data || [];

  // Fetch vendors to get phone numbers
  const { data: vendorsData } = useQuery<any>({
    queryKey: ["/api/vendors"],
  });
  
  const vendors = vendorsData || [];

  const { data: claimDetails, refetch: refetchClaimDetails, dataUpdatedAt } = useQuery<any>({
    queryKey: ["/api/claims", selectedVendorId, "details"],
    enabled: !!selectedVendorId,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
  
  console.log('ClaimDetails updated at:', dataUpdatedAt, claimDetails);

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, paymentStatus }: { id: string; paymentStatus: string }) => {
      return apiRequest("PATCH", `/api/deliveries/${id}/payment-status`, { paymentStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      toast({
        title: "Status Bayaran Dikemaskini",
        description: "Status bayaran berjaya dikemaskini",
      });
    },
    onError: () => {
      toast({
        title: "Ralat",
        description: "Gagal kemaskini status bayaran",
        variant: "destructive",
      });
    },
  });

  const updateRejectedMutation = useMutation({
    mutationFn: async ({ itemId, rejectedQty, rejectionReason }: { itemId: string; rejectedQty: number; rejectionReason: string }) => {
      console.log('🔄 Mutation called:', { itemId, rejectedQty, rejectionReason });
      const result = await apiRequest("PATCH", `/api/delivery-items/${itemId}/rejected`, { rejectedQty, rejectionReason });
      console.log('✅ Mutation response:', result);
      return result;
    },
    onSuccess: async (data, variables) => {
      console.log('✅ Mutation success! Invalidating queries...', { data, variables });
      
      // Invalidate all related queries to trigger refetch
      await queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
      console.log('✅ Invalidated /api/claims');
      
      await queryClient.invalidateQueries({ queryKey: ["/api/claims", selectedVendorId, "details"] });
      console.log('✅ Invalidated /api/claims/details');
      
      await queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      console.log('✅ Invalidated /api/deliveries');
      
      // Force immediate refetch of claim details
      if (refetchClaimDetails) {
        console.log('🔄 Force refetching claim details...');
        await refetchClaimDetails();
        console.log('✅ Refetch complete');
      }
      
      toast({
        title: "Dikemaskini",
        description: "Expired/rosak dikemaskini. Invoice auto-adjust.",
      });
    },
    onError: (error: any) => {
      console.error('❌ Mutation error:', error);
      toast({
        title: "Ralat",
        description: `Gagal kemaskini item: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  // Filter claims based on selected filters
  const filteredClaims = useMemo(() => {
    if (!claims) return [];
    
    return claims.filter((claim: ClaimSummary) => {
      // Filter by vendor name
      if (filterVendor !== "all" && claim.vendorId !== filterVendor) {
        return false;
      }
      
      // Filter by payment status (check if vendor has deliveries with that payment status)
      if (filterPaymentStatus !== "all") {
        const vendorDeliveries = deliveries?.filter((d: any) => d.vendorId === claim.vendorId) || [];
        const hasMatchingStatus = vendorDeliveries.some((d: any) => d.paymentStatus === filterPaymentStatus);
        if (!hasMatchingStatus) {
          return false;
        }
      }
      
      return true;
    });
  }, [claims, deliveries, filterVendor, filterPaymentStatus]);

  const handlePaymentStatusChange = (deliveryId: string, newStatus: string) => {
    updatePaymentMutation.mutate({ id: deliveryId, paymentStatus: newStatus });
  };

  const getPaymentStatusBadge = (status: string) => {
    const configs: { [key: string]: { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any } } = {
      pending: { label: "Belum Bayar", variant: "secondary", icon: Clock },
      partial: { label: "Bayar Separa", variant: "outline", icon: AlertCircle },
      settled: { label: "Selesai", variant: "default", icon: CheckCircle2 },
    };
    const config = configs[status] || configs.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // Helper function to get vendor phone number
  const getVendorPhone = (vendorId: string): string | null => {
    if (!vendors) return null;
    
    // Handle both array and object response structures safely
    const vendorList = Array.isArray(vendors) ? vendors : [];
    const vendor = vendorList.find((v: any) => v.id === vendorId);
    return vendor?.phone || null;
  };

  // Helper function to handle WhatsApp with phone number check
  const handleWhatsAppWithPhone = (vendorId: string, vendorName: string, action: (phone: string) => void) => {
    const phone = getVendorPhone(vendorId);
    
    if (!phone) {
      // Show dialog to input phone number
      setPendingWhatsAppAction(() => () => {
        if (phoneInput.trim()) {
          action(phoneInput);
          setShowPhoneDialog(false);
          setPhoneInput("");
          setPendingWhatsAppAction(null);
        }
      });
      setShowPhoneDialog(true);
    } else {
      action(phone);
    }
  };

  const shareClaimViaWhatsApp = (claim: ClaimSummary) => {
    handleWhatsAppWithPhone(claim.vendorId, claim.vendorName, (phone) => {
      // Generate invoice message with business profile
      const message = generateInvoiceMessage({
        vendorName: claim.vendorName,
        invoiceNumber: `CLAIM-${new Date().toISOString().split('T')[0]}`,
        totalAmount: parseFloat(claim.totalAmount).toFixed(2),
        deliveryDate: new Date().toLocaleDateString('ms-MY'),
        businessName: (businessProfile as any)?.companyName || 'PocketBizz',
      });
      
      sendWhatsApp({ phone, message });
      
      toast({
        title: "WhatsApp Dibuka",
        description: `Mesej invois untuk ${claim.vendorName}`,
      });
    });
  };

  const sendPaymentReminder = (claim: ClaimSummary) => {
    handleWhatsAppWithPhone(claim.vendorId, claim.vendorName, (phone) => {
      const outstandingAmount = parseFloat(claim.pendingAmount) + parseFloat(claim.partialAmount);
      
      const message = generatePaymentReminder({
        vendorName: claim.vendorName,
        amount: outstandingAmount.toFixed(2),
        invoiceNumber: `CLAIM-${new Date().toISOString().split('T')[0]}`,
        daysOverdue: claim.daysOverdue,
        businessName: (businessProfile as any)?.companyName || 'PocketBizz',
      });
      
      sendWhatsApp({ phone, message });
      
      toast({
        title: "Peringatan Dihantar",
        description: `Peringatan bayaran kepada ${claim.vendorName}`,
      });
    });
  };

  const getOverdueBadgeVariant = (days: number) => {
    if (days > 30) return "destructive";
    if (days > 14) return "default";
    if (days > 7) return "secondary";
    return "outline";
  };

  const shareDeliveryViaWhatsApp = (delivery: DeliveryWithItems) => {
    handleWhatsAppWithPhone(delivery.vendorId, delivery.vendorName, (phone) => {
      // Prepare delivery items
      const items = delivery.items?.map((item: any) => ({
        name: item.productName,
        quantity: item.quantity,
      })) || [];
      
      const message = generateDeliveryMessage({
        vendorName: delivery.vendorName,
        deliveryDate: new Date(delivery.deliveryDate).toLocaleDateString('ms-MY', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        }),
        items,
        totalAmount: parseFloat(delivery.totalAmount).toFixed(2),
        businessName: (businessProfile as any)?.companyName || 'PocketBizz',
      });
      
      sendWhatsApp({ phone, message });
      
      toast({
        title: "WhatsApp Dibuka",
        description: `Slip penghantaran untuk ${delivery.vendorName}`,
      });
    });
  };

  // Old function for reference - can be removed
  const shareDeliveryViaWhatsAppOld = (delivery: DeliveryWithItems) => {
    const statusLabels: { [key: string]: string } = {
      delivered: 'Dihantar',
      pending: 'Pending',
      claimed: 'Dibayar',
      rejected: 'Ditolak',
    };
    const paymentLabels: { [key: string]: string } = {
      pending: 'Belum Bayar',
      partial: 'Bayar Separa',
      settled: 'Selesai',
    };

    let message = `*ManisBizz - Penghantaran*\n\n` +
      `Vendor: *${delivery.vendorName}*\n` +
      `Tarikh: ${new Date(delivery.deliveryDate).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}\n` +
      `Status: ${statusLabels[delivery.status] || delivery.status}\n` +
      `Bayaran: ${paymentLabels[delivery.paymentStatus] || delivery.paymentStatus}\n` +
      `Jumlah: RM ${parseFloat(delivery.totalAmount).toFixed(2)}\n\n` +
      `*Senarai Produk:*\n`;

    delivery.items?.forEach((item) => {
      message += `• ${item.productName}: ${item.quantity}x @ RM ${parseFloat(item.unitPrice).toFixed(2)} = RM ${parseFloat(item.totalPrice).toFixed(2)}\n`;
    });

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const generateClaimStatement = (vendorId: string, vendorName: string) => {
    // Filter deliveries for this vendor
    const vendorDeliveries = deliveries?.filter((d: any) => d.vendorId === vendorId) || [];
    
    if (vendorDeliveries.length === 0) {
      toast({
        title: "Tiada Data",
        description: "Tiada penghantaran untuk vendor ini",
        variant: "destructive",
      });
      return;
    }

    // Get date range (earliest to latest delivery)
    const dates = vendorDeliveries.map((d: any) => new Date(d.deliveryDate));
    const earliestDate = new Date(Math.min(...dates.map((d: any) => d.getTime()))).toISOString().split('T')[0];
    const latestDate = new Date(Math.max(...dates.map((d: any) => d.getTime()))).toISOString().split('T')[0];

    // Generate PDF
    generateClaimStatementPDF(
      vendorName,
      vendorDeliveries,
      earliestDate,
      latestDate,
      businessProfile
    );

    toast({
      title: "Penyata Dijana",
      description: `Penyata tuntutan untuk ${vendorName} telah dijana`,
    });
  };

  const generateThermalClaimStatement = (vendorId: string, vendorName: string) => {
    // Filter deliveries for this vendor
    const vendorDeliveries = deliveries?.filter((d: any) => d.vendorId === vendorId) || [];
    
    if (vendorDeliveries.length === 0) {
      toast({
        title: "Tiada Data",
        description: "Tiada penghantaran untuk vendor ini",
        variant: "destructive",
      });
      return;
    }

    // Get date range (earliest to latest delivery)
    const dates = vendorDeliveries.map((d: any) => new Date(d.deliveryDate));
    const earliestDate = new Date(Math.min(...dates.map((d: any) => d.getTime()))).toISOString().split('T')[0];
    const latestDate = new Date(Math.max(...dates.map((d: any) => d.getTime()))).toISOString().split('T')[0];

    // Generate Thermal PDF
    generateThermalClaimStatementPDF(
      vendorName,
      vendorDeliveries,
      earliestDate,
      latestDate,
      businessProfile
    );

    toast({
      title: "Penyata Thermal Dijana",
      description: `Penyata thermal (58mm) untuk ${vendorName} telah dijana`,
    });
  };

  if (claimsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const handleExportClaims = () => {
    window.open('/api/reports/export-claims', '_blank');
    toast({
      title: "Export Berjaya",
      description: "Data tuntutan sedang dimuat turun",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold md:text-3xl">Bayaran Vendor</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track payment invoice vendor & update expired/rosak
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleExportClaims}
          data-testid="button-export-claims"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      {claims && claims.length > 0 && (
        <div className="mb-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              data-testid="button-toggle-filters-claims"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? "Sembunyikan" : "Tapis"}
            </Button>
            {(filterVendor !== "all" || filterPaymentStatus !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterVendor("all");
                  setFilterPaymentStatus("all");
                }}
                data-testid="button-clear-filters-claims"
              >
                <X className="h-4 w-4 mr-1" />
                Reset
              </Button>
            )}
            <span className="text-sm text-muted-foreground">
              {filteredClaims.length} daripada {claims.length} vendor
            </span>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-muted/50 rounded-lg">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Vendor</label>
                <Select value={filterVendor} onValueChange={setFilterVendor}>
                  <SelectTrigger data-testid="select-filter-vendor-claims">
                    <SelectValue placeholder="Semua vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Vendor</SelectItem>
                    {claims.map((claim: ClaimSummary) => (
                      <SelectItem key={claim.vendorId} value={claim.vendorId}>
                        {claim.vendorName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Status Bayaran</label>
                <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
                  <SelectTrigger data-testid="select-filter-payment-claims">
                    <SelectValue placeholder="Semua status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="pending">Belum Bayar</SelectItem>
                    <SelectItem value="partial">Bayar Separa</SelectItem>
                    <SelectItem value="settled">Selesai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vendor Claims Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredClaims.map((claim) => {
          const daysOverdue = claim.daysOverdue || 0;
          const hasOutstanding = parseFloat(claim.pendingAmount) > 0 || parseFloat(claim.partialAmount) > 0;
          
          return (
          <Card key={claim.vendorId} className="hover-elevate" data-testid={`card-claim-${claim.vendorId}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">
                  {claim.vendorName}
                </CardTitle>
                {hasOutstanding && daysOverdue > 0 && (
                  <Badge variant={getOverdueBadgeVariant(daysOverdue)} className="text-xs" data-testid={`badge-overdue-${claim.vendorId}`}>
                    {daysOverdue} hari
                  </Badge>
                )}
              </div>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-2xl font-semibold font-mono" data-testid={`text-total-${claim.vendorId}`}>
                    RM {parseFloat(claim.totalAmount).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {claim.totalDeliveries} penghantaran
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Belum Bayar:</span>
                    <span className="font-mono font-medium text-orange-600 dark:text-orange-400" data-testid={`text-pending-${claim.vendorId}`}>
                      RM {parseFloat(claim.pendingAmount).toFixed(2)}
                    </span>
                  </div>
                  {parseFloat(claim.partialAmount) > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Separa:</span>
                      <span className="font-mono font-medium text-blue-600 dark:text-blue-400">
                        RM {parseFloat(claim.partialAmount).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Selesai:</span>
                    <span className="font-mono font-medium text-green-600 dark:text-green-400" data-testid={`text-settled-${claim.vendorId}`}>
                      RM {parseFloat(claim.settledAmount).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mt-3">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    className="w-full"
                    onClick={() => setSelectedVendorId(claim.vendorId)}
                    data-testid={`button-view-details-${claim.vendorId}`}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Lihat Detail Produk
                  </Button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => generateClaimStatement(claim.vendorId, claim.vendorName)}
                      data-testid={`button-generate-statement-${claim.vendorId}`}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Penyata
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => generateThermalClaimStatement(claim.vendorId, claim.vendorName)}
                      data-testid={`button-thermal-statement-${claim.vendorId}`}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Thermal
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => shareClaimViaWhatsApp(claim)}
                      data-testid={`button-share-claim-${claim.vendorId}`}
                      className="text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      WhatsApp
                    </Button>
                    {hasOutstanding && (
                      <Button 
                        variant={daysOverdue > 14 ? "destructive" : "default"}
                        size="sm"
                        onClick={() => sendPaymentReminder(claim)}
                        data-testid={`button-payment-reminder-${claim.vendorId}`}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Ingatkan
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
        })}
      </div>

      {/* Load More Button */}
      {hasNextPage && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            data-testid="button-load-more-claims"
          >
            {isFetchingNextPage ? "Memuatkan..." : "Muatkan Lagi"}
          </Button>
        </div>
      )}

      {/* Delivery List with Payment Status */}
      <Card>
        <CardHeader>
          <CardTitle>Senarai Penghantaran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {deliveries?.map((delivery: any) => (
              <Card key={delivery.id} className="hover-elevate" data-testid={`card-delivery-${delivery.id}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{delivery.vendorName}</h3>
                        {getPaymentStatusBadge(delivery.paymentStatus)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(delivery.deliveryDate).toLocaleDateString('ms-MY', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-mono font-semibold text-lg">
                          RM {parseFloat(delivery.totalAmount).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Select
                        value={delivery.paymentStatus}
                        onValueChange={(value) => handlePaymentStatusChange(delivery.id, value)}
                        data-testid={`select-payment-${delivery.id}`}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Belum Bayar</SelectItem>
                          <SelectItem value="partial">Bayar Separa</SelectItem>
                          <SelectItem value="settled">Selesai</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Delivery Items */}
                  <div className="mt-3 pt-3 border-t space-y-1">
                    {delivery.items?.map((item: any, idx: any) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.productName}</span>
                        <span className="font-mono">
                          {item.quantity}x RM {parseFloat(item.unitPrice).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full mt-3 text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400"
                    onClick={() => shareDeliveryViaWhatsApp(delivery)}
                    data-testid={`button-share-delivery-${delivery.id}`}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Hantar WhatsApp
                  </Button>
                </CardContent>
              </Card>
            ))}

            {(!filteredClaims || filteredClaims.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                Tiada tuntutan
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Product View Dialog */}
      <Dialog open={!!selectedVendorId} onOpenChange={(open) => !open && setSelectedVendorId(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Detail Produk - {claimDetails?.vendorName}
            </DialogTitle>
            <DialogDescription>
              Senarai lengkap produk untuk semua invois vendor ini
            </DialogDescription>
          </DialogHeader>

          {claimDetails && (
            <div className="space-y-4">
              {/* Summary Card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-semibold font-mono">
                        RM {parseFloat(claimDetails.totalAmount).toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">Jumlah</div>
                    </div>
                    <div>
                      <div className="text-2xl font-semibold font-mono text-orange-600 dark:text-orange-400">
                        RM {parseFloat(claimDetails.pendingAmount).toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">Belum Bayar</div>
                    </div>
                    <div>
                      <div className="text-2xl font-semibold font-mono text-blue-600 dark:text-blue-400">
                        RM {parseFloat(claimDetails.partialAmount).toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">Separa</div>
                    </div>
                    <div>
                      <div className="text-2xl font-semibold font-mono text-green-600 dark:text-green-400">
                        RM {parseFloat(claimDetails.settledAmount).toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">Selesai</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* View Mode Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'summary' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('summary')}
                  data-testid="button-view-summary"
                >
                  Ringkasan
                </Button>
                <Button
                  variant={viewMode === 'individual' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('individual')}
                  data-testid="button-view-individual"
                >
                  Per Invois
                </Button>
              </div>

              {/* Summary View - Group all products */}
              {viewMode === 'summary' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ringkasan Produk ({claimDetails.totalDeliveries} invois)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(() => {
                        const productSummary = new Map<string, { quantity: number; totalPrice: number; unitPrice: number }>();
                        
                        claimDetails.deliveries?.forEach((delivery: any) => {
                          delivery.items?.forEach((item: any) => {
                            const existing = productSummary.get(item.productName) || { quantity: 0, totalPrice: 0, unitPrice: parseFloat(item.unitPrice) };
                            productSummary.set(item.productName, {
                              quantity: existing.quantity + item.quantity,
                              totalPrice: existing.totalPrice + parseFloat(item.totalPrice),
                              unitPrice: parseFloat(item.unitPrice),
                            });
                          });
                        });

                        return Array.from(productSummary.entries()).map(([name, data]) => (
                          <div key={name} className="flex justify-between items-center p-3 border rounded-md hover-elevate">
                            <div className="flex-1">
                              <div className="font-medium">{name}</div>
                              <div className="text-sm text-muted-foreground">
                                @ RM {data.unitPrice.toFixed(2)} per unit
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold font-mono">{data.quantity} unit</div>
                              <div className="text-sm font-mono text-muted-foreground">
                                RM {data.totalPrice.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Individual View - Per invoice breakdown */}
              {viewMode === 'individual' && (
                <div className="space-y-3">
                  {(claimDetails?.deliveries || []).map((delivery: any, idx: number) => {
                    // Create a unique key that includes timestamp to FORCE re-render
                    const deliveryKey = `${delivery.id}-${dataUpdatedAt}-${delivery.claimableAmount}`;
                    console.log('Rendering delivery card with key:', deliveryKey, delivery);
                    return (
                    <Card key={deliveryKey} className="hover-elevate">
                      <CardHeader className="pb-3 border-b bg-muted/30">
                        {/* Business Header */}
                        {businessProfile ? (
                          <div className="text-center mb-3 pb-3 border-b">
                            <div className="font-bold text-lg">{(businessProfile as any).businessName || "PocketBizz"}</div>
                            {(businessProfile as any).address && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {(businessProfile as any).address}
                              </div>
                            )}
                            {(businessProfile as any).phone && (
                              <div className="text-xs text-muted-foreground">
                                Tel: {(businessProfile as any).phone}
                              </div>
                            )}
                            {(businessProfile as any).registrationNumber && (
                              <div className="text-xs text-muted-foreground">
                                No. Pendaftaran: {(businessProfile as any).registrationNumber}
                              </div>
                            )}
                          </div>
                        ) : null}
                        
                        {/* Invoice Header */}
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base">
                              {delivery.invoiceNumber || `Invois #${idx + 1}`}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                              📅 {new Date(delivery.deliveryDate).toLocaleDateString('ms-MY', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              📦 {delivery.items?.length || 0} jenis produk
                            </p>
                          </div>
                          <div className="text-right">
                            {getPaymentStatusBadge(delivery.paymentStatus)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {delivery.items?.map((item: any, itemIdx: number) => (
                            <div key={itemIdx} className="p-3 bg-muted/50 rounded border">
                              {/* Product Header */}
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <div className="font-medium">{item.productName}</div>
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    {item.quantity}x @ RM {parseFloat(item.unitPrice).toFixed(2)}
                                  </div>
                                </div>
                              </div>

                              {/* Rejected Quantity Input */}
                              <div className="mb-3 p-2 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800">
                                <Label className="text-xs font-medium mb-1">Expired/Rosak/Return</Label>
                                <div className="flex gap-2 items-end">
                                  <div className="flex-1">
                                    <Input
                                      type="number"
                                      min="0"
                                      max={item.quantity}
                                      key={`rejected-${item.id}-${item.rejectedQty}`}
                                      defaultValue={item.rejectedQty || 0}
                                      onChange={(e) => {
                                        const newRejectedQty = parseInt(e.target.value) || 0;
                                        const currentRejectedQty = item.rejectedQty || 0;
                                        console.log('Rejected qty changed:', {
                                          itemId: item.id,
                                          productName: item.productName,
                                          oldValue: currentRejectedQty,
                                          newValue: newRejectedQty,
                                          changed: newRejectedQty !== currentRejectedQty
                                        });
                                        
                                        // Update immediately on change
                                        if (newRejectedQty !== currentRejectedQty) {
                                          console.log('Triggering mutation...');
                                          updateRejectedMutation.mutate({
                                            itemId: item.id,
                                            rejectedQty: newRejectedQty,
                                            rejectionReason: item.rejectionReason || "",
                                          });
                                        }
                                      }}
                                      className="h-8 text-sm"
                                      placeholder="0"
                                    />
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      Max: {item.quantity} unit
                                    </p>
                                  </div>
                                  <div className="flex-[2]">
                                    <Input
                                      type="text"
                                      key={`reason-${item.id}-${item.rejectionReason}`}
                                      defaultValue={item.rejectionReason || ""}
                                      onBlur={(e) => {
                                        const newReason = e.target.value;
                                        // Only update if value changed
                                        if (newReason !== (item.rejectionReason || "")) {
                                          updateRejectedMutation.mutate({
                                            itemId: item.id,
                                            rejectedQty: item.rejectedQty || 0,
                                            rejectionReason: newReason,
                                          });
                                        }
                                      }}
                                      className="h-8 text-sm"
                                      placeholder="Sebab (optional): Expired, rosak, etc"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Commission Breakdown */}
                              {item.itemGross && (
                                <div className="space-y-1 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Jumlah Kasar:</span>
                                    <span className="font-mono">RM {item.itemGross}</span>
                                  </div>
                                  
                                  {parseFloat(item.itemRejected || '0') > 0 && (
                                    <div className="flex justify-between text-orange-600 dark:text-orange-400">
                                      <span>Tolakan ({item.rejectedQty || item.rejectedQuantity} unit):</span>
                                      <span className="font-mono">- RM {item.itemRejected}</span>
                                    </div>
                                  )}
                                  
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Jumlah Bersih:</span>
                                    <span className="font-mono">RM {item.itemNet}</span>
                                  </div>
                                  
                                  {parseFloat(item.itemCommission || '0') > 0 && (
                                    <div className="flex justify-between text-blue-600 dark:text-blue-400">
                                      <span>Komisyen:</span>
                                      <span className="font-mono">- RM {item.itemCommission}</span>
                                    </div>
                                  )}
                                  
                                  <div className="flex justify-between pt-1 border-t mt-1">
                                    <span className="font-semibold">Boleh Dituntut:</span>
                                    <span className="font-mono font-semibold text-primary">
                                      RM {item.itemClaimable || item.totalPrice}
                                    </span>
                                  </div>
                                </div>
                              )}
                              
                              {/* Fallback for items without commission data */}
                              {!item.itemGross && (
                                <div className="flex justify-between text-sm">
                                  <span className="font-semibold">Jumlah:</span>
                                  <span className="font-mono font-semibold">
                                    RM {parseFloat(item.totalPrice).toFixed(2)}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        {/* Invoice Total Summary */}
                        <div className="mt-4 pt-4 border-t-2 border-dashed">
                          <div className="bg-primary/5 rounded-lg p-4 space-y-2">
                            <div className="text-sm font-semibold mb-2 text-primary">RINGKASAN INVOIS</div>
                            
                            {(() => {
                              const totals = delivery.items?.reduce((acc: any, item: any) => {
                                const gross = parseFloat(item.itemGross || item.totalPrice || 0);
                                const rejected = parseFloat(item.itemRejected || 0);
                                const commission = parseFloat(item.itemCommission || 0);
                                const claimable = parseFloat(item.itemClaimable || item.totalPrice || 0);
                                
                                return {
                                  gross: acc.gross + gross,
                                  rejected: acc.rejected + rejected,
                                  commission: acc.commission + commission,
                                  claimable: acc.claimable + claimable,
                                };
                              }, { gross: 0, rejected: 0, commission: 0, claimable: 0 });

                              return (
                                <>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Jumlah Kasar:</span>
                                    <span className="font-mono">RM {totals.gross.toFixed(2)}</span>
                                  </div>
                                  
                                  {totals.rejected > 0 && (
                                    <div className="flex justify-between text-sm text-orange-600 dark:text-orange-400">
                                      <span>Tolak Expired/Rosak:</span>
                                      <span className="font-mono">- RM {totals.rejected.toFixed(2)}</span>
                                    </div>
                                  )}
                                  
                                  <div className="flex justify-between text-sm border-t pt-2">
                                    <span className="text-muted-foreground">Jumlah Bersih:</span>
                                    <span className="font-mono font-medium">RM {(totals.gross - totals.rejected).toFixed(2)}</span>
                                  </div>
                                  
                                  {totals.commission > 0 && (
                                    <div className="flex justify-between text-sm text-blue-600 dark:text-blue-400">
                                      <span>Komisyen Vendor:</span>
                                      <span className="font-mono">- RM {totals.commission.toFixed(2)}</span>
                                    </div>
                                  )}
                                  
                                  <div className="flex justify-between pt-2 border-t-2 border-primary/20">
                                    <span className="font-bold text-base">JUMLAH PERLU DIBAYAR:</span>
                                    <span className="font-mono font-bold text-lg text-primary">
                                      RM {totals.claimable.toFixed(2)}
                                    </span>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                          
                          {/* Individual Invoice Action Buttons */}
                          <div className="flex gap-2 mt-4 pt-4 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                // Prepare delivery with vendor info
                                const deliveryWithVendor = {
                                  ...delivery,
                                  vendorName: claimDetails?.vendorName || delivery.vendorName,
                                  vendorPhone: vendors.find((v: any) => v.id === delivery.vendorId)?.phone,
                                  vendorAddress: vendors.find((v: any) => v.id === delivery.vendorId)?.address,
                                };
                                setSelectedDelivery(deliveryWithVendor);
                                setShowInvoiceDialog(true);
                              }}
                            >
                              <Printer className="h-4 w-4 mr-2" />
                              Print
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => {
                                // Prepare delivery with vendor info
                                const deliveryWithVendor = {
                                  ...delivery,
                                  vendorName: claimDetails?.vendorName || delivery.vendorName,
                                  vendorPhone: vendors.find((v: any) => v.id === delivery.vendorId)?.phone,
                                  vendorAddress: vendors.find((v: any) => v.id === delivery.vendorId)?.address,
                                };
                                setSelectedDelivery(deliveryWithVendor);
                                setShowInvoiceDialog(true);
                              }}
                            >
                              <Share2 className="h-4 w-4 mr-2" />
                              WhatsApp
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Phone Number Input Dialog */}
      <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              No. Telefon Vendor
            </DialogTitle>
            <DialogDescription>
              Masukkan nombor telefon vendor untuk hantar WhatsApp
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="phone-input">
                Nombor Telefon (cth: 0123456789 atau +60123456789)
              </Label>
              <Input
                id="phone-input"
                type="tel"
                placeholder="0123456789"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                data-testid="input-vendor-phone"
              />
              <p className="text-xs text-muted-foreground">
                Format akan auto-adjust untuk WhatsApp Malaysia (60XXXXXXXXX)
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPhoneDialog(false);
                setPhoneInput("");
                setPendingWhatsAppAction(null);
              }}
              data-testid="button-cancel-phone"
            >
              Batal
            </Button>
            <Button
              onClick={() => pendingWhatsAppAction?.()}
              disabled={!phoneInput.trim()}
              data-testid="button-send-whatsapp"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Hantar WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Individual Invoice Dialog */}
      {selectedDelivery && (
        <DeliveryInvoiceDialog
          open={showInvoiceDialog}
          onOpenChange={setShowInvoiceDialog}
          delivery={selectedDelivery}
        />
      )}
    </div>
  );
}
