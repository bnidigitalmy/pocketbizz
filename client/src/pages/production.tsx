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
import { Plus, ChefHat, Calendar as CalendarIcon, Copy, AlertTriangle, Filter } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductionBatchSchema } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const batchFormSchema = insertProductionBatchSchema.extend({
  productId: z.string().min(1, "Sila pilih produk"),
  quantity: z.coerce.number().min(1, "Kuantiti mestilah lebih dari 0"),
  batchDate: z.string().min(1, "Sila pilih tarikh"),
});

type BatchFormValues = z.infer<typeof batchFormSchema>;

export default function Production() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showExpiringOnly, setShowExpiringOnly] = useState(false);
  const { toast } = useToast();

  const { data: batches, isLoading } = useQuery({
    queryKey: ["/api/production"],
  });

  const { data: products } = useQuery({
    queryKey: ["/api/products"],
  });

  const form = useForm<BatchFormValues>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: {
      productId: "",
      productName: "",
      quantity: 1,
      batchDate: new Date().toISOString().split('T')[0],
      expiryDate: "",
      totalCost: "0",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: BatchFormValues) => {
      return apiRequest("POST", "/api/production", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Berjaya!",
        description: "Batch produksi telah direkod.",
      });
      setDialogOpen(false);
      form.reset();
    },
  });

  const handleProductChange = (productId: string) => {
    const product = products?.find((p: any) => p.id === productId);
    if (product) {
      form.setValue("productId", productId);
      form.setValue("productName", product.name);
      calculateBatchCost(productId, form.getValues("quantity"));
    }
  };

  const calculateBatchCost = (productId: string, quantity: number) => {
    const product = products?.find((p: any) => p.id === productId);
    if (product && quantity > 0) {
      const totalCost = (parseFloat(product.costPerUnit) * quantity).toFixed(2);
      form.setValue("totalCost", totalCost);
    }
  };

  const duplicateYesterday = () => {
    if (!batches || batches.length === 0) {
      toast({
        title: "Tiada Data",
        description: "Tiada data semalam untuk disalin.",
        variant: "destructive",
      });
      return;
    }

    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Find yesterday's batch
    const yesterdayBatch = batches.find((batch: any) => 
      batch.batchDate === yesterdayStr
    );

    if (!yesterdayBatch) {
      toast({
        title: "Tiada Data",
        description: "Tiada batch semalam untuk disalin.",
        variant: "destructive",
      });
      return;
    }

    // Populate form with yesterday's data but update date to today
    form.setValue("productId", yesterdayBatch.productId);
    form.setValue("productName", yesterdayBatch.productName);
    form.setValue("quantity", yesterdayBatch.quantity);
    form.setValue("batchDate", new Date().toISOString().split('T')[0]);
    form.setValue("expiryDate", yesterdayBatch.expiryDate || "");
    form.setValue("totalCost", yesterdayBatch.totalCost);

    setDialogOpen(true);

    toast({
      title: "Berjaya!",
      description: "Data semalam telah disalin. Tarikh telah dikemaskini ke hari ini.",
    });
  };

  // Expiry tracking helpers
  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    return expiry < today;
  };

  const isExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const twoDaysFromNow = new Date(today);
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    return expiry >= today && expiry <= twoDaysFromNow;
  };

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    if (isExpired(expiryDate)) return "expired";
    if (isExpiringSoon(expiryDate)) return "expiring";
    return "fresh";
  };

  // Filter batches based on expiry status
  const filteredBatches = showExpiringOnly 
    ? batches?.filter((batch: any) => {
        const status = getExpiryStatus(batch.expiryDate);
        return status === "expired" || status === "expiring";
      })
    : batches;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold md:text-3xl">Produksi Harian</h1>
          <p className="text-sm text-muted-foreground mt-1">Rekod pengeluaran produk harian</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant="outline" 
            onClick={duplicateYesterday}
            data-testid="button-duplicate-yesterday"
          >
            <Copy className="h-4 w-4 mr-2" />
            Salin Semalam
          </Button>
          <Button
            variant={showExpiringOnly ? "default" : "outline"}
            onClick={() => setShowExpiringOnly(!showExpiringOnly)}
            data-testid="button-filter-expiring"
          >
            <Filter className="h-4 w-4 mr-2" />
            {showExpiringOnly ? "Semua" : "Hampir Luput"}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-batch">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Batch
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rekod Produksi Baru</DialogTitle>
              <DialogDescription>
                Masukkan maklumat batch produksi
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Produk</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleProductChange(value);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-product">
                            <SelectValue placeholder="Pilih produk" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products?.map((product: any) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
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
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kuantiti</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            calculateBatchCost(form.getValues("productId"), parseInt(e.target.value) || 0);
                          }}
                          data-testid="input-quantity"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="batchDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tarikh Produksi</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-batch-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tarikh Luput (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-expiry-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="totalCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jumlah Kos (RM)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          readOnly
                          className="font-mono bg-muted"
                          data-testid="input-total-cost"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    data-testid="button-submit-batch"
                  >
                    {createMutation.isPending ? "Menyimpan..." : "Simpan Batch"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {!filteredBatches || filteredBatches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <ChefHat className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-medium mb-1">
              {showExpiringOnly ? "Tiada Produk Hampir Luput" : "Tiada Rekod Produksi"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {showExpiringOnly 
                ? "Semua batch masih segar" 
                : "Mulakan dengan merekod batch produksi pertama"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBatches.map((batch: any) => {
            const expiryStatus = getExpiryStatus(batch.expiryDate);
            return (
              <Card key={batch.id} className="hover-elevate" data-testid={`batch-card-${batch.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="truncate text-base">{batch.productName}</CardTitle>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="secondary">
                          {batch.quantity} unit
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(batch.batchDate).toLocaleDateString('ms-MY')}
                        </span>
                        {expiryStatus === "expired" && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Luput
                          </Badge>
                        )}
                        {expiryStatus === "expiring" && (
                          <Badge variant="outline" className="gap-1 border-orange-500 text-orange-600 dark:text-orange-400">
                            <AlertTriangle className="h-3 w-3" />
                            Hampir Luput
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Kos</p>
                      <p className="font-mono font-semibold text-lg">RM {batch.totalCost}</p>
                    </div>
                  </div>
                </CardHeader>
                {batch.expiryDate && (
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Luput:</span>
                      <span className={
                        expiryStatus === "expired" 
                          ? "text-destructive font-medium"
                          : expiryStatus === "expiring"
                          ? "text-orange-600 dark:text-orange-400 font-medium"
                          : ""
                      }>
                        {new Date(batch.expiryDate).toLocaleDateString('ms-MY')}
                      </span>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
