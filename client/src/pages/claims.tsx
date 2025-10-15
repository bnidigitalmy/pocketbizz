import { useState, useMemo } from "react";
import { useQuery, useMutation, useInfiniteQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Clock, CheckCircle2, AlertCircle, Share2, FileText, Printer, Eye, Package, Filter, X } from "lucide-react";
import { generateClaimStatementPDF, generateThermalClaimStatementPDF } from "@/lib/pdf-utils";

interface ClaimSummary {
  vendorId: string;
  vendorName: string;
  totalDeliveries: number;
  totalAmount: string;
  pendingAmount: string;
  settledAmount: string;
  partialAmount: string;
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
      if (lastPage.hasMore) {
        return allPages.reduce((acc, page) => acc + page.data.length, 0);
      }
      return undefined;
    },
    initialPageParam: 0,
  });

  // Flatten all pages into single array
  const claims = data?.pages.flatMap(page => page.data) || [];

  // No need to fetch deliveries separately - claims summary includes all needed info

  const { data: businessProfile } = useQuery({
    queryKey: ["/api/business-profile"],
  });

  const { data: claimDetails } = useQuery({
    queryKey: ["/api/claims", selectedVendorId, "details"],
    enabled: !!selectedVendorId,
  });

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
        const vendorDeliveries = deliveries?.filter(d => d.vendorId === claim.vendorId) || [];
        const hasMatchingStatus = vendorDeliveries.some(d => d.paymentStatus === filterPaymentStatus);
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
    const variants: { [key: string]: { label: string; className: string; icon: any } } = {
      pending: { label: "Belum Bayar", className: "bg-orange-500", icon: Clock },
      partial: { label: "Bayar Separa", className: "bg-blue-500", icon: AlertCircle },
      settled: { label: "Selesai", className: "bg-green-600", icon: CheckCircle2 },
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return (
      <Badge className={`${config.className} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const shareClaimViaWhatsApp = (claim: ClaimSummary) => {
    const message = `*ManisBizz - Tuntutan Vendor*\n\n` +
      `Vendor: *${claim.vendorName}*\n` +
      `Jumlah Keseluruhan: RM ${parseFloat(claim.totalAmount).toFixed(2)}\n` +
      `Jumlah Penghantaran: ${claim.totalDeliveries}\n\n` +
      `Status Bayaran:\n` +
      `• Belum Bayar: RM ${parseFloat(claim.pendingAmount).toFixed(2)}\n` +
      (parseFloat(claim.partialAmount) > 0 ? `• Bayar Separa: RM ${parseFloat(claim.partialAmount).toFixed(2)}\n` : '') +
      `• Selesai: RM ${parseFloat(claim.settledAmount).toFixed(2)}`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareDeliveryViaWhatsApp = (delivery: DeliveryWithItems) => {
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
    const vendorDeliveries = deliveries?.filter(d => d.vendorId === vendorId) || [];
    
    if (vendorDeliveries.length === 0) {
      toast({
        title: "Tiada Data",
        description: "Tiada penghantaran untuk vendor ini",
        variant: "destructive",
      });
      return;
    }

    // Get date range (earliest to latest delivery)
    const dates = vendorDeliveries.map(d => new Date(d.deliveryDate));
    const earliestDate = new Date(Math.min(...dates.map(d => d.getTime()))).toISOString().split('T')[0];
    const latestDate = new Date(Math.max(...dates.map(d => d.getTime()))).toISOString().split('T')[0];

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
    const vendorDeliveries = deliveries?.filter(d => d.vendorId === vendorId) || [];
    
    if (vendorDeliveries.length === 0) {
      toast({
        title: "Tiada Data",
        description: "Tiada penghantaran untuk vendor ini",
        variant: "destructive",
      });
      return;
    }

    // Get date range (earliest to latest delivery)
    const dates = vendorDeliveries.map(d => new Date(d.deliveryDate));
    const earliestDate = new Date(Math.min(...dates.map(d => d.getTime()))).toISOString().split('T')[0];
    const latestDate = new Date(Math.max(...dates.map(d => d.getTime()))).toISOString().split('T')[0];

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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold md:text-3xl">Tuntutan Vendor</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Urus tuntutan & status bayaran vendor
        </p>
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
            <div className="grid grid-cols-2 gap-3 p-4 bg-muted/50 rounded-lg">
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
        {filteredClaims.map((claim) => (
          <Card key={claim.vendorId} className="hover-elevate" data-testid={`card-claim-${claim.vendorId}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {claim.vendorName}
              </CardTitle>
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
                  <div className="grid grid-cols-2 gap-2">
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
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                    onClick={() => shareClaimViaWhatsApp(claim)}
                    data-testid={`button-share-claim-${claim.vendorId}`}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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
            {deliveries?.map((delivery) => (
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
                    {delivery.items?.map((item, idx) => (
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
                    className="w-full mt-3"
                    onClick={() => shareDeliveryViaWhatsApp(delivery)}
                    data-testid={`button-share-delivery-${delivery.id}`}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Kongsi via WhatsApp
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
                  {claimDetails.deliveries?.map((delivery: any, idx: number) => (
                    <Card key={delivery.id} className="hover-elevate">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base">
                              Invois #{idx + 1} - {new Date(delivery.deliveryDate).toLocaleDateString('ms-MY', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {delivery.items?.length || 0} produk
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold font-mono text-lg">
                              RM {parseFloat(delivery.totalAmount).toFixed(2)}
                            </div>
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
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
