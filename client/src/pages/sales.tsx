import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SwipeableItem } from "@/components/swipeable-item";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Plus, DollarSign, CheckCircle, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSaleSchema } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const saleFormSchema = insertSaleSchema.extend({
  productId: z.string().min(1, "Sila pilih produk"),
  quantity: z.coerce.number().min(1, "Kuantiti mestilah lebih dari 0"),
});

type SaleFormValues = z.infer<typeof saleFormSchema>;

export default function Sales() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateData, setDuplicateData] = useState<any>(null);
  const [pendingSaleData, setPendingSaleData] = useState<SaleFormValues | null>(null);
  const { toast } = useToast();

  const { data: sales, isLoading } = useQuery({
    queryKey: ["/api/sales"],
  });

  const { data: vendors } = useQuery({
    queryKey: ["/api/vendors"],
  });

  const { data: products } = useQuery({
    queryKey: ["/api/products"],
  });

  // Smart defaults: Remember last selected product and vendor
  const getLastSaleDefaults = () => {
    try {
      return {
        productId: localStorage.getItem('pocketbizz_last_sale_product') || "",
        vendorId: localStorage.getItem('pocketbizz_last_sale_vendor') || "none",
      };
    } catch {
      return { productId: "", vendorId: "none" };
    }
  };

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      vendorId: getLastSaleDefaults().vendorId,
      vendorName: "",
      productId: getLastSaleDefaults().productId,
      productName: "",
      quantity: 1,
      unitPrice: "0",
      totalAmount: "0",
      saleDate: new Date().toISOString().split('T')[0],
      isPaid: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: SaleFormValues & { force?: boolean }) => {
      // Convert "none" to null for vendorId (optional field) and ensure vendorName is also null
      const submitData: any = {
        productId: data.productId,
        productName: data.productName,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        totalAmount: data.totalAmount,
        saleDate: data.saleDate,
        isPaid: data.isPaid,
      };
      
      // Only add vendor fields if not "none"
      if (data.vendorId && data.vendorId !== "none") {
        submitData.vendorId = data.vendorId;
        submitData.vendorName = data.vendorName;
      }
      
      // Add force flag if retrying after duplicate confirmation
      if (data.force) {
        submitData.force = true;
      }
      
      return apiRequest("POST", "/api/sales", submitData);
    },
    onSuccess: (data, variables) => {
      // Save last selections for smart defaults
      try {
        if (variables.productId) {
          localStorage.setItem('pocketbizz_last_sale_product', variables.productId);
        }
        if (variables.vendorId && variables.vendorId !== 'none') {
          localStorage.setItem('pocketbizz_last_sale_vendor', variables.vendorId);
        }
      } catch (e) {
        console.error('Failed to save last selections:', e);
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Berjaya!",
        description: "Jualan telah direkod.",
      });
      setDialogOpen(false);
      form.reset({
        vendorId: variables.vendorId || "none",
        vendorName: "",
        productId: variables.productId,
        productName: "",
        quantity: 1,
        unitPrice: "0",
        totalAmount: "0",
        saleDate: new Date().toISOString().split('T')[0],
        isPaid: 0,
      });
    },
    onError: (error: any) => {
      // Handle duplicate sale detection (409)
      if (error?.status === 409 && error?.data?.duplicate) {
        setPendingSaleData(form.getValues());
        setDuplicateData(error.data.duplicate);
        setDuplicateDialogOpen(true);
        return;
      }
      
      toast({
        title: "Ralat!",
        description: error?.message || "Stok tidak mencukupi atau ralat berlaku.",
        variant: "destructive",
      });
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/sales/${id}/paid`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      toast({
        title: "Berjaya!",
        description: "Jualan ditandakan sebagai dibayar.",
      });
    },
  });

  const handleVendorChange = (vendorId: string) => {
    const vendor = vendors?.find((v: any) => v.id === vendorId);
    if (vendor) {
      form.setValue("vendorId", vendorId);
      form.setValue("vendorName", vendor.name);
    }
  };

  const handleProductChange = (productId: string) => {
    const product = products?.find((p: any) => p.id === productId);
    if (product) {
      form.setValue("productId", productId);
      form.setValue("productName", product.name);
      form.setValue("unitPrice", product.suggestedPrice);
      calculateTotal(parseInt(form.getValues("quantity").toString()), product.suggestedPrice);
    }
  };

  const calculateTotal = (quantity: number, unitPrice: string) => {
    const total = (quantity * parseFloat(unitPrice)).toFixed(2);
    form.setValue("totalAmount", total);
  };

  const filteredSales = sales?.filter((sale: any) => {
    if (activeTab === "paid") return sale.isPaid === 1;
    if (activeTab === "pending") return sale.isPaid === 0;
    return true;
  });

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

  const paidCount = sales?.filter((s: any) => s.isPaid === 1).length || 0;
  const pendingCount = sales?.filter((s: any) => s.isPaid === 0).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold md:text-3xl">Jualan & Claim</h1>
          <p className="text-sm text-muted-foreground mt-1">Rekod jualan dan pembayaran</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-sale">
              <Plus className="h-4 w-4 mr-2" />
              Rekod Jualan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rekod Jualan Baru</DialogTitle>
              <DialogDescription>
                Masukkan maklumat jualan
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="vendorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor (Optional)</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          if (value !== "none") {
                            handleVendorChange(value);
                          } else {
                            form.setValue("vendorId", "");
                            form.setValue("vendorName", "");
                          }
                        }}
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-sale-vendor">
                            <SelectValue placeholder="Pilih vendor (atau kosongkan untuk direct sale)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Tiada vendor (Direct Sale)</SelectItem>
                          {vendors?.map((vendor: any) => (
                            <SelectItem key={vendor.id} value={vendor.id}>
                              {vendor.name}
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
                          <SelectTrigger data-testid="select-sale-product">
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
                            calculateTotal(parseInt(e.target.value) || 0, form.getValues("unitPrice"));
                          }}
                          data-testid="input-sale-quantity"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unitPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Harga Per Unit (RM)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            calculateTotal(parseInt(form.getValues("quantity").toString()) || 0, e.target.value);
                          }}
                          data-testid="input-sale-unit-price"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="saleDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tarikh Jualan</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-sale-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jumlah (RM)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          readOnly
                          className="font-mono text-lg font-semibold bg-muted"
                          data-testid="input-sale-total"
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
                    data-testid="button-submit-sale"
                  >
                    {createMutation.isPending ? "Menyimpan..." : "Simpan Jualan"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" data-testid="tab-all">
            Semua ({sales?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="paid" data-testid="tab-paid">
            Dibayar ({paidCount})
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending ({pendingCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {!filteredSales || filteredSales.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <DollarSign className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-medium mb-1">Tiada Jualan</h3>
                <p className="text-sm text-muted-foreground mb-4">Mulakan dengan merekod jualan pertama</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredSales.map((sale: any) => (
                <SwipeableItem
                  key={sale.id}
                  rightAction={sale.isPaid === 0 ? {
                    type: "confirm",
                    label: "Tandakan Dibayar",
                    color: "success",
                    onAction: () => markPaidMutation.mutate(sale.id),
                  } : undefined}
                  disabled={sale.isPaid === 1}
                >
                  <Card className="hover-elevate" data-testid={`sale-card-${sale.id}`}>
                    <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="truncate text-base">{sale.productName}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm text-muted-foreground">
                            {sale.vendorName || "Direct Sale"}
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(sale.saleDate).toLocaleDateString('ms-MY')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Jumlah</p>
                          <p className="font-mono font-semibold text-lg">RM {sale.totalAmount}</p>
                        </div>
                        {sale.isPaid === 0 ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markPaidMutation.mutate(sale.id)}
                            disabled={markPaidMutation.isPending}
                            data-testid={`button-mark-paid-${sale.id}`}
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            Tandakan Dibayar
                          </Button>
                        ) : (
                          <Badge variant="default" data-testid={`badge-paid-${sale.id}`}>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Dibayar
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted">
                      <span className="text-muted-foreground">Kuantiti:</span>
                      <span className="font-medium">{sale.quantity} unit</span>
                      <span className="text-muted-foreground">Harga/unit:</span>
                      <span className="font-mono">RM {sale.unitPrice}</span>
                    </div>
                  </CardContent>
                </Card>
              </SwipeableItem>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Duplicate Sale Confirmation Dialog */}
      <AlertDialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Jualan Kembar Dikesan</AlertDialogTitle>
            <AlertDialogDescription>
              Jualan untuk produk ini sudah direkod pada tarikh yang sama:
              <div className="mt-3 p-3 bg-muted rounded-md space-y-1">
                <p><strong>Produk:</strong> {duplicateData?.productName}</p>
                {duplicateData?.vendorName && (
                  <p><strong>Vendor:</strong> {duplicateData?.vendorName}</p>
                )}
                <p><strong>Kuantiti:</strong> {duplicateData?.quantity} unit</p>
                <p><strong>Tarikh:</strong> {duplicateData?.saleDate && new Date(duplicateData.saleDate).toLocaleDateString('ms-MY')}</p>
                <p><strong>Jumlah:</strong> RM {duplicateData?.totalAmount}</p>
              </div>
              <p className="mt-3">Adakah anda pasti mahu meneruskan jualan ini?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-duplicate-sale">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-duplicate-sale"
              onClick={() => {
                if (pendingSaleData) {
                  createMutation.mutate({ ...pendingSaleData, force: true });
                }
                setDuplicateDialogOpen(false);
              }}
            >
              Ya, Teruskan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
