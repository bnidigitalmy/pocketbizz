import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Upload, FileText, CheckCircle, XCircle, Eye, AlertTriangle } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface VendorClaimsPageProps {}

export default function VendorClaimsPage({}: VendorClaimsPageProps) {
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterVendor, setFilterVendor] = useState<string>("all");
  const { toast } = useToast();

  // Fetch claims
  const { data: claims = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/vendor-claims", filterStatus, filterVendor],
    queryFn: async () => {
      let url = "/api/vendor-claims?";
      if (filterStatus !== "all") url += `status=${filterStatus}&`;
      if (filterVendor !== "all") url += `vendorId=${filterVendor}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch claims");
      return res.json();
    },
  });

  // Fetch vendors
  const { data: vendors = [] } = useQuery<any[]>({
    queryKey: ["/api/vendors"],
    queryFn: async () => {
      const res = await fetch("/api/vendors");
      if (!res.ok) throw new Error("Failed to fetch vendors");
      return res.json();
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      approved: { variant: "default", label: "Diluluskan" },
      rejected: { variant: "destructive", label: "Ditolak" },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const openReviewDialog = (claim: any) => {
    setSelectedClaim(claim);
    setReviewDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold md:text-3xl">Vendor Claims</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Urus tuntutan pulangan produk dari vendor
          </p>
        </div>
        <VendorClaimSubmitForm 
          open={submitDialogOpen}
          onOpenChange={setSubmitDialogOpen}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="w-48">
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Diluluskan</SelectItem>
                  <SelectItem value="rejected">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-64">
              <Label>Vendor</Label>
              <Select value={filterVendor} onValueChange={setFilterVendor}>
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
        </CardContent>
      </Card>

      {/* Claims List */}
      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        ) : claims.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Tiada tuntutan ditemui
              </p>
            </CardContent>
          </Card>
        ) : (
          claims.map((claim: any) => (
            <Card key={claim.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{claim.claimNumber}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {claim.vendorName} • {format(new Date(claim.claimDate), 'dd MMM yyyy')}
                    </p>
                  </div>
                  <div className="flex gap-2 items-center">
                    {getStatusBadge(claim.status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openReviewDialog(claim)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Lihat
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Jumlah Tuntutan</p>
                    <p className="font-semibold">RM {parseFloat(claim.totalClaimAmount).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Jumlah Diluluskan</p>
                    <p className="font-semibold">RM {parseFloat(claim.approvedAmount).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tarikh Dicipta</p>
                    <p>{format(new Date(claim.createdAt), 'dd MMM yyyy HH:mm')}</p>
                  </div>
                  {claim.reviewedAt && (
                    <div>
                      <p className="text-muted-foreground">Tarikh Semakan</p>
                      <p>{format(new Date(claim.reviewedAt), 'dd MMM yyyy HH:mm')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Review Dialog */}
      {selectedClaim && (
        <VendorClaimReviewDialog
          claim={selectedClaim}
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
        />
      )}
    </div>
  );
}

// ====== CLAIM SUBMISSION FORM ======
interface VendorClaimSubmitFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function VendorClaimSubmitForm({ open, onOpenChange }: VendorClaimSubmitFormProps) {
  const [vendorId, setVendorId] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [deliveryId, setDeliveryId] = useState<string>("");
  const [claimDate, setClaimDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState([{ productId: "", productName: "", quantityClaimed: 1, unitPrice: "0", claimReason: "" }]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoInput, setPhotoInput] = useState("");
  const { toast } = useToast();

  // Fetch vendors
  const { data: vendors = [] } = useQuery<any[]>({
    queryKey: ["/api/vendors"],
  });

  // Fetch products
  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  // Fetch recent deliveries for selected vendor (for auto-invoice adjustment)
  const { data: recentDeliveries = [] } = useQuery<any[]>({
    queryKey: ["/api/deliveries", vendorId],
    queryFn: async () => {
      if (!vendorId) return [];
      const res = await fetch(`/api/deliveries?vendorId=${vendorId}&limit=10`);
      if (!res.ok) return [];
      const result = await res.json();
      return result.data || [];
    },
    enabled: !!vendorId,
  });

  // Submit claim mutation
  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/vendor-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to submit claim");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-claims"] });
      toast({
        title: "Berjaya!",
        description: "Tuntutan berjaya dihantar",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setVendorId("");
    setVendorName("");
    setDeliveryId("");
    setClaimDate(new Date().toISOString().split('T')[0]);
    setItems([{ productId: "", productName: "", quantityClaimed: 1, unitPrice: "0", claimReason: "" }]);
    setPhotos([]);
    setPhotoInput("");
  };

  const addItem = () => {
    setItems([...items, { productId: "", productName: "", quantityClaimed: 1, unitPrice: "0", claimReason: "" }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    if (field === "productId") {
      const product = products.find((p: any) => p.id === value);
      if (product) {
        newItems[index] = {
          ...newItems[index],
          productId: product.id,
          productName: product.name,
          unitPrice: product.unitPrice || "0",
        };
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setItems(newItems);
  };

  const addPhoto = () => {
    if (photoInput.trim() && photos.length < 5) {
      setPhotos([...photos, photoInput.trim()]);
      setPhotoInput("");
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleVendorChange = (value: string) => {
    const vendor = vendors.find((v: any) => v.id === value);
    if (vendor) {
      setVendorId(vendor.id);
      setVendorName(vendor.name);
    }
  };

  const handleSubmit = () => {
    // Validation
    if (!vendorId) {
      toast({ title: "Ralat", description: "Sila pilih vendor", variant: "destructive" });
      return;
    }
    if (items.some(item => !item.productId)) {
      toast({ title: "Ralat", description: "Sila pilih produk untuk semua item", variant: "destructive" });
      return;
    }
    if (items.some(item => !item.claimReason.trim())) {
      toast({ title: "Ralat", description: "Sila masukkan sebab tuntutan untuk semua item", variant: "destructive" });
      return;
    }
    if (photos.length === 0) {
      toast({ title: "Ralat", description: "Sila tambah sekurang-kurangnya 1 foto bukti", variant: "destructive" });
      return;
    }

    submitMutation.mutate({
      claimData: {
        vendorId,
        vendorName,
        deliveryId: deliveryId || null,
        claimDate,
      },
      items: items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantityClaimed: parseInt(item.quantityClaimed.toString()),
        unitPrice: item.unitPrice,
        claimReason: item.claimReason,
      })),
      photos,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Button onClick={() => onOpenChange(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Hantar Tuntutan
      </Button>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Hantar Tuntutan Pulangan</DialogTitle>
          <DialogDescription>
            Isi maklumat produk yang nak pulang/tuntut dari vendor
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Vendor */}
          <div>
            <Label>Vendor *</Label>
            <Select value={vendorId} onValueChange={handleVendorChange}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((vendor: any) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div>
            <Label>Tarikh Tuntutan *</Label>
            <Input
              type="date"
              value={claimDate}
              onChange={(e) => setClaimDate(e.target.value)}
            />
          </div>

          {/* Optional Delivery Link (for auto-invoice adjustment) */}
          {vendorId && recentDeliveries.length > 0 && (
            <div>
              <Label>Link ke Penghantaran (Optional - untuk auto-adjust invoice)</Label>
              <Select value={deliveryId} onValueChange={setDeliveryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih penghantaran (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tiada - tuntutan umum</SelectItem>
                  {recentDeliveries.map((delivery: any) => (
                    <SelectItem key={delivery.id} value={delivery.id}>
                      {delivery.invoiceNumber} - {format(new Date(delivery.deliveryDate), 'dd MMM yyyy')} (RM {parseFloat(delivery.totalAmount).toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {deliveryId 
                  ? "✅ Invoice akan auto-adjust bila claim diluluskan" 
                  : "Jika pilih penghantaran, invoice akan dikurangkan automatik"}
              </p>
            </div>
          )}

          {/* Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Produk Dituntut *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" />
                Tambah
              </Button>
            </div>

            {items.map((item, index) => (
              <Card key={index}>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Produk</Label>
                      <Select
                        value={item.productId}
                        onValueChange={(value) => updateItem(index, "productId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product: any) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Kuantiti</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantityClaimed}
                        onChange={(e) => updateItem(index, "quantityClaimed", parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Sebab Tuntutan *</Label>
                    <Input
                      placeholder="Contoh: Expired, rosak, packaging pecah"
                      value={item.claimReason}
                      onChange={(e) => updateItem(index, "claimReason", e.target.value)}
                    />
                  </div>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Buang Item
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <Label>Foto Bukti * (1-5 foto)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Google Drive URL atau link foto"
                value={photoInput}
                onChange={(e) => setPhotoInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addPhoto()}
              />
              <Button type="button" onClick={addPhoto} disabled={photos.length >= 5}>
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              {photos.map((photo, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-secondary rounded text-sm">
                  <FileText className="h-4 w-4" />
                  <span className="flex-1 truncate">{photo}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePhoto(index)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Upload foto ke Google Drive dulu, then paste link di sini
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={submitMutation.isPending}>
              {submitMutation.isPending ? "Menghantar..." : "Hantar Tuntutan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ====== CLAIM REVIEW DIALOG ======
interface VendorClaimReviewDialogProps {
  claim: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function VendorClaimReviewDialog({ claim, open, onOpenChange }: VendorClaimReviewDialogProps) {
  const [reviewNotes, setReviewNotes] = useState("");
  const { toast } = useToast();

  // Fetch full claim details
  const { data: claimDetails, isLoading } = useQuery({
    queryKey: ["/api/vendor-claims", claim.id],
    queryFn: async () => {
      const res = await fetch(`/api/vendor-claims/${claim.id}`);
      if (!res.ok) throw new Error("Failed to fetch claim details");
      return res.json();
    },
    enabled: open,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/vendor-claims/${claim.id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewNotes }),
      });
      if (!res.ok) throw new Error("Failed to approve claim");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-claims"] });
      toast({ title: "Berjaya!", description: "Tuntutan diluluskan" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Ralat", description: error.message, variant: "destructive" });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async () => {
      if (!reviewNotes.trim()) {
        throw new Error("Sila masukkan sebab penolakan");
      }
      const res = await fetch(`/api/vendor-claims/${claim.id}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewNotes }),
      });
      if (!res.ok) throw new Error("Failed to reject claim");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-claims"] });
      toast({ title: "Berjaya!", description: "Tuntutan ditolak" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Ralat", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading || !claimDetails) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const isPending = claim.status === "pending";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{claim.claimNumber}</DialogTitle>
          <DialogDescription>
            {claim.vendorName} • {format(new Date(claim.claimDate), 'dd MMM yyyy')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Auto-Invoice Adjustment Notice */}
          {claim.deliveryId && claim.status === "pending" && (
            <Card className="border-blue-500 bg-blue-50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Invoice Auto-Adjustment Enabled</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Bila claim ni diluluskan, invoice akan dikurangkan automatik dengan jumlah tuntutan.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Banner */}
          <Card className={claim.status === "approved" ? "border-green-500" : claim.status === "rejected" ? "border-red-500" : ""}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">{claim.status === "pending" ? <Badge variant="secondary">Pending Review</Badge> : claim.status === "approved" ? <Badge>Diluluskan</Badge> : <Badge variant="destructive">Ditolak</Badge>}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Jumlah Tuntutan</p>
                  <p className="text-2xl font-bold">RM {parseFloat(claim.totalClaimAmount).toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <div>
            <Label className="text-lg font-semibold">Produk Dituntut</Label>
            <div className="mt-2 space-y-2">
              {claimDetails.items.map((item: any, index: number) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantityClaimed} units × RM {parseFloat(item.unitPrice).toFixed(2)} = RM {parseFloat(item.totalAmount).toFixed(2)}
                        </p>
                        <p className="text-sm mt-1">
                          <span className="font-medium">Sebab:</span> {item.claimReason}
                        </p>
                      </div>
                      {item.approvedQty > 0 && (
                        <Badge variant="outline">
                          Diluluskan: {item.approvedQty} units
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Photos */}
          <div>
            <Label className="text-lg font-semibold">Foto Bukti</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {claimDetails.photos.map((photo: any, index: number) => (
                <a
                  key={index}
                  href={photo.photoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 border rounded hover:bg-secondary flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  <span className="text-sm truncate">Foto {index + 1}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Review Notes */}
          {claim.reviewNotes && (
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm font-medium">Nota Semakan:</p>
                <p className="text-sm text-muted-foreground mt-1">{claim.reviewNotes}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions for pending claims */}
          {isPending && (
            <div className="space-y-3">
              <div>
                <Label>Nota Semakan (Optional)</Label>
                <Textarea
                  placeholder="Tambah nota atau sebab keputusan..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => rejectMutation.mutate()}
                  disabled={rejectMutation.isPending || approveMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Tolak
                </Button>
                <Button
                  onClick={() => approveMutation.mutate()}
                  disabled={rejectMutation.isPending || approveMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Luluskan
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
