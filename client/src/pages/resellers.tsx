import { useState, useEffect } from "react";
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
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Trash2, Users, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import type { Reseller, PricingTier } from "@shared/schema";
import { insertResellerSchema } from "@shared/schema";

const MALAYSIAN_STATES = [
  "Johor",
  "Kedah",
  "Kelantan",
  "Melaka",
  "Negeri Sembilan",
  "Pahang",
  "Perak",
  "Perlis",
  "Pulau Pinang",
  "Sabah",
  "Sarawak",
  "Selangor",
  "Terengganu",
  "W.P. Kuala Lumpur",
  "W.P. Labuan",
  "W.P. Putrajaya",
];

const resellerFormSchema = insertResellerSchema.extend({
  name: z.string().min(1, "Nama ejen diperlukan"),
  area: z.string().min(1, "Negeri diperlukan"),
  pricingTierId: z.string().min(1, "Tier harga diperlukan"),
  phone: z.string().optional(),
  isActive: z.number().min(0).max(1),
});

type ResellerFormValues = z.infer<typeof resellerFormSchema>;

export default function Resellers() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReseller, setEditingReseller] = useState<Reseller | null>(null);
  const [resellerToDelete, setResellerToDelete] = useState<Reseller | null>(null);
  const [filterTier, setFilterTier] = useState<string>("all");
  const [filterArea, setFilterArea] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { toast } = useToast();

  const { data: resellers = [], isLoading } = useQuery<Reseller[]>({
    queryKey: ["/api/resellers"],
  });

  const { data: pricingTiers = [], isLoading: tiersLoading } = useQuery<PricingTier[]>({
    queryKey: ["/api/pricing-tiers"],
  });

  const form = useForm<ResellerFormValues>({
    resolver: zodResolver(resellerFormSchema),
    defaultValues: {
      userId: "",
      name: "",
      phone: "",
      area: "",
      pricingTierId: "",
      isActive: 1,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ResellerFormValues) => {
      return apiRequest("POST", "/api/resellers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resellers"] });
      toast({
        title: "Berjaya!",
        description: "Ejen telah ditambah.",
      });
      setDialogOpen(false);
      setEditingReseller(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal menambah ejen.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ResellerFormValues }) => {
      return apiRequest("PATCH", `/api/resellers/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resellers"] });
      toast({
        title: "Berjaya!",
        description: "Ejen telah dikemaskini.",
      });
      setDialogOpen(false);
      setEditingReseller(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal mengemaskini ejen.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/resellers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resellers"] });
      toast({
        title: "Berjaya!",
        description: "Ejen telah dipadam.",
      });
      setResellerToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal memadam ejen.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (editingReseller) {
      form.reset({
        userId: editingReseller.userId,
        name: editingReseller.name,
        phone: editingReseller.phone || "",
        area: editingReseller.area || "",
        pricingTierId: editingReseller.pricingTierId || "",
        isActive: editingReseller.isActive,
      });
    }
  }, [editingReseller, form]);

  const handleOpenDialog = (reseller?: Reseller) => {
    if (reseller) {
      setEditingReseller(reseller);
    } else {
      setEditingReseller(null);
      form.reset({
        userId: "",
        name: "",
        phone: "",
        area: "",
        pricingTierId: "",
        isActive: 1,
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = (data: ResellerFormValues) => {
    if (editingReseller) {
      updateMutation.mutate({ id: editingReseller.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleClearFilters = () => {
    setFilterTier("all");
    setFilterArea("all");
    setFilterStatus("all");
  };

  // Filter resellers based on selected filters
  const filteredResellers = resellers.filter((reseller) => {
    if (filterTier !== "all" && reseller.pricingTierId !== filterTier) return false;
    if (filterArea !== "all" && reseller.area !== filterArea) return false;
    if (filterStatus === "aktif" && reseller.isActive !== 1) return false;
    if (filterStatus === "tidak_aktif" && reseller.isActive !== 0) return false;
    return true;
  });

  // Get tier name helper
  const getTierName = (tierId: string | null) => {
    if (!tierId) return "-";
    const tier = pricingTiers.find(t => t.id === tierId);
    return tier?.name || "-";
  };

  // Get tier color helper
  const getTierColor = (tierId: string | null) => {
    if (!tierId) return "secondary";
    const tier = pricingTiers.find(t => t.id === tierId);
    if (!tier) return "secondary";
    
    // Simple color mapping based on tier name
    const name = tier.name.toLowerCase();
    if (name.includes("gold") || name.includes("emas")) return "default";
    if (name.includes("silver") || name.includes("perak")) return "secondary";
    if (name.includes("bronze") || name.includes("gangsa")) return "outline";
    return "secondary";
  };

  // Format currency
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return `RM ${num.toLocaleString("ms-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Get unique areas from resellers
  const uniqueAreas = Array.from(new Set(resellers.map(r => r.area).filter(Boolean))) as string[];

  if (isLoading || tiersLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold md:text-3xl">Senarai Ejen Jualan</h1>
          <p className="text-sm text-muted-foreground mt-1">Urus ejen dan reseller anda</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-reseller" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Ejen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingReseller ? "Edit Ejen" : "Tambah Ejen Baru"}</DialogTitle>
              <DialogDescription>
                {editingReseller ? "Kemaskini maklumat ejen" : "Masukkan maklumat ejen jualan baru"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Ejen</FormLabel>
                      <FormControl>
                        <Input placeholder="cth: Ahmad Jualan" {...field} data-testid="input-reseller-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No. Telefon</FormLabel>
                      <FormControl>
                        <Input placeholder="cth: 012-3456789" {...field} value={field.value || ""} data-testid="input-reseller-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Negeri</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-reseller-area">
                            <SelectValue placeholder="Pilih negeri" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MALAYSIAN_STATES.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pricingTierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tier Harga</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-reseller-tier">
                            <SelectValue placeholder="Pilih tier harga" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {pricingTiers.filter(t => t.isActive === 1).map((tier) => (
                            <SelectItem key={tier.id} value={tier.id}>
                              {tier.name} ({tier.discountPercent}% diskaun)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Status Aktif</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Aktifkan ejen ini untuk kegunaan
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value === 1}
                          onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                          data-testid="switch-reseller-active"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      setEditingReseller(null);
                      form.reset();
                    }}
                    data-testid="button-cancel-reseller"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-reseller"
                  >
                    {createMutation.isPending || updateMutation.isPending ? "Menyimpan..." : "Simpan Ejen"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Penapis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tier</label>
              <Select value={filterTier} onValueChange={setFilterTier}>
                <SelectTrigger data-testid="filter-tier">
                  <SelectValue placeholder="Semua Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tier</SelectItem>
                  {pricingTiers.map((tier) => (
                    <SelectItem key={tier.id} value={tier.id}>
                      {tier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Negeri</label>
              <Select value={filterArea} onValueChange={setFilterArea}>
                <SelectTrigger data-testid="filter-area">
                  <SelectValue placeholder="Semua Negeri" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Negeri</SelectItem>
                  {uniqueAreas.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger data-testid="filter-status">
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="tidak_aktif">Tidak Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">&nbsp;</label>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleClearFilters}
                data-testid="button-clear-filters"
              >
                <X className="h-4 w-4 mr-2" />
                Kosongkan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resellers Display */}
      {!filteredResellers || filteredResellers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-medium mb-1">Tiada Ejen Jualan</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              {resellers.length === 0 
                ? "Tiada ejen jualan. Klik butang di atas untuk menambah ejen pertama anda."
                : "Tiada ejen sepadan dengan penapis. Cuba ubah penapis anda."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredResellers.map((reseller) => (
            <Card key={reseller.id} className="hover-elevate" data-testid={`reseller-card-${reseller.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="truncate text-base" data-testid={`reseller-name-${reseller.id}`}>
                      {reseller.name}
                    </CardTitle>
                    {reseller.phone && (
                      <p className="text-sm text-muted-foreground mt-1" data-testid={`reseller-phone-${reseller.id}`}>
                        {reseller.phone}
                      </p>
                    )}
                  </div>
                  <Badge variant={reseller.isActive === 1 ? "default" : "secondary"} data-testid={`reseller-status-${reseller.id}`}>
                    {reseller.isActive === 1 ? "Aktif" : "Tidak Aktif"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {reseller.area && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Negeri:</span>
                      <span className="font-medium" data-testid={`reseller-area-${reseller.id}`}>{reseller.area}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tier:</span>
                    <Badge variant={getTierColor(reseller.pricingTierId)} data-testid={`reseller-tier-${reseller.id}`}>
                      {getTierName(reseller.pricingTierId)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Jumlah Pembelian:</span>
                    <span className="font-semibold" data-testid={`reseller-purchases-${reseller.id}`}>
                      {formatCurrency(reseller.totalPurchases)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenDialog(reseller)}
                    data-testid={`button-edit-reseller-${reseller.id}`}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setResellerToDelete(reseller)}
                    data-testid={`button-delete-reseller-${reseller.id}`}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Padam
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!resellerToDelete} onOpenChange={() => setResellerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Adakah anda pasti?</AlertDialogTitle>
            <AlertDialogDescription>
              Adakah anda pasti untuk memadam ejen ini? Tindakan ini tidak boleh dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (resellerToDelete) {
                  deleteMutation.mutate(resellerToDelete.id);
                }
              }}
              data-testid="button-confirm-delete"
            >
              Padam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
