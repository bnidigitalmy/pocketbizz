import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Ticket, TrendingUp, Calendar, Users, Edit, Trash2, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

export default function Vouchers() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<any>(null);
  const [viewingUsageVoucher, setViewingUsageVoucher] = useState<any>(null);

  // Form state
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [voucherType, setVoucherType] = useState<"percentage" | "fixed_amount">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minPurchase, setMinPurchase] = useState("0");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [maxUsagePerCustomer, setMaxUsagePerCustomer] = useState("1");
  const [maxTotalUsage, setMaxTotalUsage] = useState("");
  const [validUntil, setValidUntil] = useState("");

  // Fetch vouchers
  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ["/api/vouchers"],
  });

  // Fetch voucher usage history
  const { data: voucherUsage = [] } = useQuery({
    queryKey: ["/api/vouchers", viewingUsageVoucher?.id, "usage"],
    enabled: !!viewingUsageVoucher?.id,
  });

  // Create voucher mutation
  const createVoucherMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/vouchers", data);
    },
    onSuccess: () => {
      toast({
        title: "Voucher Dibuat",
        description: "Voucher baru berjaya ditambah",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vouchers"] });
      resetForm();
      setShowCreateDialog(false);
    },
    onError: (error: any) => {
      console.error("Create voucher error:", error);
      toast({
        title: "Ralat",
        description: error.message || "Gagal membuat voucher",
        variant: "destructive",
      });
    },
  });

  // Update voucher mutation
  const updateVoucherMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PUT", `/api/vouchers/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Voucher Dikemaskini",
        description: "Voucher berjaya dikemaskini",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vouchers"] });
      setEditingVoucher(null);
    },
    onError: (error: any) => {
      console.error("Update voucher error:", error);
      toast({
        title: "Ralat",
        description: error.message || "Gagal mengemaskini voucher",
        variant: "destructive",
      });
    },
  });

  // Delete voucher mutation
  const deleteVoucherMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/vouchers/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Voucher Dipadam",
        description: "Voucher berjaya dipadam",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vouchers"] });
    },
    onError: (error: any) => {
      console.error("Delete voucher error:", error);
      toast({
        title: "Ralat",
        description: error.message || "Gagal memadam voucher",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setCode("");
    setName("");
    setDescription("");
    setVoucherType("percentage");
    setDiscountValue("");
    setMinPurchase("0");
    setMaxDiscount("");
    setMaxUsagePerCustomer("1");
    setMaxTotalUsage("");
    setValidUntil("");
  };

  const handleCreateVoucher = () => {
    if (!code || !name || !discountValue) {
      toast({
        title: "Ralat",
        description: "Sila lengkapkan semua maklumat wajib",
        variant: "destructive",
      });
      return;
    }

    createVoucherMutation.mutate({
      code: code.toUpperCase(),
      name,
      description: description || null,
      voucherType,
      discountValue: discountValue.toString(),
      minPurchase: minPurchase.toString(),
      maxDiscount: maxDiscount ? maxDiscount.toString() : null,
      maxUsagePerCustomer: parseInt(maxUsagePerCustomer),
      maxTotalUsage: maxTotalUsage ? parseInt(maxTotalUsage) : null,
      validFrom: new Date().toISOString(),
      validUntil: validUntil ? new Date(validUntil).toISOString() : null,
      isActive: 1,
    });
  };

  const handleToggleActive = (voucher: any) => {
    updateVoucherMutation.mutate({
      id: voucher.id,
      data: { isActive: voucher.isActive ? 0 : 1 },
    });
  };

  const activeVouchers = vouchers.filter((v: any) => v.isActive);
  const inactiveVouchers = vouchers.filter((v: any) => !v.isActive);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Pengurusan Voucher</h1>
          <p className="text-muted-foreground mt-1">
            Cipta dan urus voucher diskaun untuk pelanggan setia
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-voucher">
              <Plus className="w-4 h-4 mr-2" />
              Voucher Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cipta Voucher Baru</DialogTitle>
              <DialogDescription>
                Tambah voucher diskaun untuk pelanggan anda
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Kod Voucher *</Label>
                  <Input
                    id="code"
                    placeholder="RAYA2024"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    data-testid="input-voucher-code"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Voucher *</Label>
                  <Input
                    id="name"
                    placeholder="Promosi Raya"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    data-testid="input-voucher-name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Keterangan</Label>
                <Input
                  id="description"
                  placeholder="Diskaun istimewa sempena Hari Raya"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  data-testid="input-voucher-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Jenis Diskaun *</Label>
                  <Select value={voucherType} onValueChange={(v: any) => setVoucherType(v)}>
                    <SelectTrigger data-testid="select-voucher-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Peratusan (%)</SelectItem>
                      <SelectItem value="fixed_amount">Jumlah Tetap (RM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountValue">
                    Nilai Diskaun * {voucherType === "percentage" ? "(%)" : "(RM)"}
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    placeholder={voucherType === "percentage" ? "10" : "50"}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    data-testid="input-discount-value"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minPurchase">Pembelian Minimum (RM)</Label>
                  <Input
                    id="minPurchase"
                    type="number"
                    placeholder="0"
                    value={minPurchase}
                    onChange={(e) => setMinPurchase(e.target.value)}
                    data-testid="input-min-purchase"
                  />
                </div>
                {voucherType === "percentage" && (
                  <div className="space-y-2">
                    <Label htmlFor="maxDiscount">Had Diskaun Maksimum (RM)</Label>
                    <Input
                      id="maxDiscount"
                      type="number"
                      placeholder="Tiada had"
                      value={maxDiscount}
                      onChange={(e) => setMaxDiscount(e.target.value)}
                      data-testid="input-max-discount"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxUsagePerCustomer">Had Guna Per Pelanggan</Label>
                  <Input
                    id="maxUsagePerCustomer"
                    type="number"
                    placeholder="1"
                    value={maxUsagePerCustomer}
                    onChange={(e) => setMaxUsagePerCustomer(e.target.value)}
                    data-testid="input-max-usage-per-customer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxTotalUsage">Had Guna Keseluruhan</Label>
                  <Input
                    id="maxTotalUsage"
                    type="number"
                    placeholder="Tiada had"
                    value={maxTotalUsage}
                    onChange={(e) => setMaxTotalUsage(e.target.value)}
                    data-testid="input-max-total-usage"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="validUntil">Tarikh Tamat Tempoh</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  data-testid="input-valid-until"
                />
              </div>

              <Button
                onClick={handleCreateVoucher}
                className="w-full"
                disabled={createVoucherMutation.isPending}
                data-testid="button-submit-voucher"
              >
                {createVoucherMutation.isPending ? "Mencipta..." : "Cipta Voucher"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active" data-testid="tab-active-vouchers">
            <Ticket className="w-4 h-4 mr-2" />
            Aktif ({activeVouchers.length})
          </TabsTrigger>
          <TabsTrigger value="inactive" data-testid="tab-inactive-vouchers">
            Tidak Aktif ({inactiveVouchers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                Memuat...
              </CardContent>
            </Card>
          ) : activeVouchers.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Ticket className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Tiada voucher aktif. Cipta voucher pertama anda!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeVouchers.map((voucher: any) => (
                <Card key={voucher.id} className="hover-elevate">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <Ticket className="w-5 h-5" />
                          {voucher.code}
                        </CardTitle>
                        <CardDescription>{voucher.name}</CardDescription>
                      </div>
                      <Badge variant={voucher.isActive ? "default" : "secondary"}>
                        {voucher.isActive ? "Aktif" : "Tidak Aktif"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {voucher.description && (
                      <p className="text-sm text-muted-foreground">{voucher.description}</p>
                    )}
                    
                    <Separator />

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Diskaun:</span>
                        <span className="font-medium">
                          {voucher.voucherType === "percentage"
                            ? `${voucher.discountValue}%`
                            : `RM${voucher.discountValue}`}
                        </span>
                      </div>
                      {parseFloat(voucher.minPurchase) > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Min:</span>
                          <span>RM{voucher.minPurchase}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Digunakan:</span>
                        <span>
                          {voucher.currentUsage}
                          {voucher.maxTotalUsage && ` / ${voucher.maxTotalUsage}`}
                        </span>
                      </div>
                      {voucher.validUntil && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Tamat:</span>
                          <span className="text-xs">
                            {new Date(voucher.validUntil).toLocaleDateString("ms-MY")}
                          </span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="flex gap-2">
                      {voucher.currentUsage > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingUsageVoucher(voucher)}
                          data-testid={`button-view-usage-${voucher.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleToggleActive(voucher)}
                        data-testid={`button-toggle-${voucher.id}`}
                      >
                        Nyahaktif
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteVoucherMutation.mutate(voucher.id)}
                        data-testid={`button-delete-${voucher.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          {inactiveVouchers.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">Tiada voucher tidak aktif</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {inactiveVouchers.map((voucher: any) => (
                <Card key={voucher.id} className="opacity-75">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Ticket className="w-5 h-5" />
                          {voucher.code}
                        </CardTitle>
                        <CardDescription>{voucher.name}</CardDescription>
                      </div>
                      <Badge variant="secondary">Tidak Aktif</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      Telah digunakan {voucher.currentUsage} kali
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleToggleActive(voucher)}
                      data-testid={`button-activate-${voucher.id}`}
                    >
                      Aktifkan Semula
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Usage History Dialog */}
      <Dialog open={!!viewingUsageVoucher} onOpenChange={(open) => !open && setViewingUsageVoucher(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sejarah Penggunaan Voucher</DialogTitle>
            <DialogDescription>
              {viewingUsageVoucher?.code} - {viewingUsageVoucher?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {voucherUsage.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Tiada rekod penggunaan
              </div>
            ) : (
              <div className="space-y-3">
                {voucherUsage.map((usage: any) => (
                  <Card key={usage.id}>
                    <CardContent className="p-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{usage.customerName || "Walk-in"}</span>
                          </div>
                          {usage.customerPhone && (
                            <div className="text-sm text-muted-foreground">
                              {usage.customerPhone}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {new Date(usage.usedAt).toLocaleString("ms-MY")}
                          </div>
                        </div>
                        <div className="space-y-1 text-right md:text-left">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Asal: </span>
                            <span className="font-medium">RM{parseFloat(usage.originalAmount).toFixed(2)}</span>
                          </div>
                          <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                            Diskaun: -RM{parseFloat(usage.discountApplied).toFixed(2)}
                          </div>
                          <div className="text-base font-bold">
                            Bayar: RM{parseFloat(usage.finalAmount).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
