import { useQuery, useMutation } from "@tanstack/react-query";
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
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Clock, CheckCircle2, AlertCircle, Share2, FileText } from "lucide-react";
import { generateClaimStatementPDF } from "@/lib/pdf-utils";

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

  const { data: claims, isLoading: claimsLoading } = useQuery<ClaimSummary[]>({
    queryKey: ["/api/claims"],
  });

  const { data: deliveries } = useQuery<DeliveryWithItems[]>({
    queryKey: ["/api/deliveries"],
  });

  const { data: businessProfile } = useQuery({
    queryKey: ["/api/business-profile"],
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

      {/* Vendor Claims Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {claims?.map((claim) => (
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

                <div className="grid grid-cols-2 gap-2 mt-3">
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

            {(!deliveries || deliveries.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                Tiada penghantaran
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
