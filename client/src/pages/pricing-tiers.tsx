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
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Tag } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPricingTierSchema, type PricingTier, type InsertPricingTier } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Extend schema for form validation
const tierFormSchema = insertPricingTierSchema.extend({
  name: z.string().min(1, "Nama tier diperlukan"),
  discountPercent: z.string()
    .min(1, "Peratus diskaun diperlukan")
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num <= 100;
    }, "Peratus diskaun mesti antara 0 hingga 100"),
  isActive: z.number().min(0).max(1),
});

type TierFormValues = z.infer<typeof tierFormSchema>;

export default function PricingTiers() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<PricingTier | null>(null);
  const { toast } = useToast();

  const { data: tiers = [], isLoading } = useQuery<PricingTier[]>({
    queryKey: ["/api/pricing-tiers"],
  });

  const form = useForm<TierFormValues>({
    resolver: zodResolver(tierFormSchema),
    defaultValues: {
      userId: "",
      name: "",
      discountPercent: "0",
      isActive: 1,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: TierFormValues) => {
      // Convert form data to proper types for API
      const tierData = {
        ...data,
        discountPercent: data.discountPercent,
      };
      return apiRequest("POST", "/api/pricing-tiers", tierData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-tiers"] });
      toast({
        title: "Berjaya!",
        description: "Tier harga telah ditambah.",
      });
      setDialogOpen(false);
      setEditingTier(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal menambah tier harga.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TierFormValues }) => {
      // Convert form data to proper types for API
      const tierData = {
        ...data,
        discountPercent: data.discountPercent,
      };
      return apiRequest("PATCH", `/api/pricing-tiers/${id}`, tierData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-tiers"] });
      toast({
        title: "Berjaya!",
        description: "Tier harga telah dikemaskini.",
      });
      setDialogOpen(false);
      setEditingTier(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal mengemaskini tier harga.",
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (tier?: PricingTier) => {
    if (tier) {
      setEditingTier(tier);
      form.reset({
        userId: tier.userId,
        name: tier.name,
        discountPercent: tier.discountPercent,
        isActive: tier.isActive,
      });
    } else {
      setEditingTier(null);
      form.reset({
        userId: "",
        name: "",
        discountPercent: "0",
        isActive: 1,
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = (data: TierFormValues) => {
    if (editingTier) {
      updateMutation.mutate({ id: editingTier.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
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
          <h1 className="text-2xl font-semibold md:text-3xl">Tetapan Tier Harga</h1>
          <p className="text-sm text-muted-foreground mt-1">Urus tier harga untuk ejen jualan anda</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-tier" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Tier
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTier ? "Edit Tier Harga" : "Tambah Tier Harga Baru"}</DialogTitle>
              <DialogDescription>
                {editingTier ? "Kemaskini maklumat tier harga" : "Masukkan maklumat tier harga baru"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Tier</FormLabel>
                      <FormControl>
                        <Input placeholder="cth: Bronze, Silver, Gold" {...field} data-testid="input-tier-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discountPercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diskaun %</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="100" 
                          step="0.01"
                          placeholder="cth: 10" 
                          {...field} 
                          data-testid="input-tier-discount" 
                        />
                      </FormControl>
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
                          Aktifkan tier ini untuk kegunaan
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value === 1}
                          onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                          data-testid="switch-tier-active"
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
                      setEditingTier(null);
                      form.reset();
                    }}
                    data-testid="button-cancel-tier"
                  >
                    Batal
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-tier"
                  >
                    {createMutation.isPending || updateMutation.isPending ? "Menyimpan..." : "Simpan Tier"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {!tiers || tiers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Tag className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-medium mb-1">Tiada Tier Harga</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Tiada tier harga. Klik butang di atas untuk menambah tier pertama anda.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Senarai Tier Harga</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Tier</TableHead>
                    <TableHead className="text-right">Diskaun %</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiers.map((tier) => (
                    <TableRow key={tier.id} data-testid={`tier-row-${tier.id}`}>
                      <TableCell className="font-medium" data-testid={`tier-name-${tier.id}`}>
                        {tier.name}
                      </TableCell>
                      <TableCell className="text-right" data-testid={`tier-discount-${tier.id}`}>
                        {parseFloat(tier.discountPercent).toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={tier.isActive === 1 ? "default" : "secondary"}
                          data-testid={`tier-status-${tier.id}`}
                        >
                          {tier.isActive === 1 ? "Aktif" : "Tidak Aktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(tier)}
                          data-testid={`button-edit-tier-${tier.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
