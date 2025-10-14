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
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Calculator, Trash2, TrendingUp, Package } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const productFormSchema = z.object({
  name: z.string().min(1, "Nama produk diperlukan"),
  category: z.string().min(1, "Kategori diperlukan"),
  imageUrl: z.string().optional(),
  unitsPerBatch: z.string().min(1, "Unit per batch diperlukan"),
  labourCost: z.string().min(0, "Kos buruh diperlukan"),
  otherCosts: z.string().min(0, "Kos lain diperlukan"),
  sellingPrice: z.string().min(1, "Harga jualan diperlukan"),
  recipeItems: z.array(z.object({
    stockItemId: z.string().min(1, "Pilih bahan"),
    quantityNeeded: z.string().min(1, "Kuantiti diperlukan"),
  })).min(1, "Sila tambah sekurang-kurangnya satu bahan"),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface StockItem {
  id: string;
  name: string;
  unit: string;
  currentQuantity: string;
  purchasePrice: string;
}

export default function Products() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: stockItems = [] } = useQuery<StockItem[]>({
    queryKey: ["/api/stock"],
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      category: "",
      imageUrl: "",
      unitsPerBatch: "1",
      labourCost: "0",
      otherCosts: "0",
      sellingPrice: "0",
      recipeItems: [{ stockItemId: "", quantityNeeded: "" }],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      return apiRequest("POST", "/api/products", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Berjaya!",
        description: "Produk & resepi telah ditambah.",
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal menambah produk.",
        variant: "destructive",
      });
    },
  });

  const addRecipeItem = () => {
    const current = form.getValues("recipeItems") || [];
    form.setValue("recipeItems", [...current, { stockItemId: "", quantityNeeded: "" }]);
  };

  const removeRecipeItem = (index: number) => {
    const current = form.getValues("recipeItems") || [];
    if (current.length > 1) {
      form.setValue("recipeItems", current.filter((_, i) => i !== index));
    }
  };

  // Calculate costs for display (read-only, no form updates)
  const calculateCosts = () => {
    const recipeItems = form.watch("recipeItems") || [];
    const labourCost = parseFloat(form.watch("labourCost")) || 0;
    const otherCosts = parseFloat(form.watch("otherCosts")) || 0;
    const unitsPerBatch = parseInt(form.watch("unitsPerBatch")) || 1;

    // Calculate materials cost from recipe items
    let materialsCost = 0;
    recipeItems.forEach(item => {
      if (item.stockItemId && item.quantityNeeded) {
        const stockItem = stockItems.find(s => s.id === item.stockItemId);
        if (stockItem) {
          const quantity = parseFloat(item.quantityNeeded) || 0;
          const price = parseFloat(stockItem.purchasePrice) || 0;
          materialsCost += quantity * price;
        }
      }
    });

    // Total cost per batch = materials + labour + other costs
    const totalCostPerBatch = materialsCost + labourCost + otherCosts;
    
    // Cost per unit = total cost per batch / units per batch
    const costPerUnit = unitsPerBatch > 0 ? totalCostPerBatch / unitsPerBatch : 0;

    // Suggest profit margin (30-50% based on cost)
    let suggestedMarginPercent = 30;
    if (costPerUnit < 1) suggestedMarginPercent = 50;
    else if (costPerUnit < 3) suggestedMarginPercent = 40;
    else if (costPerUnit < 5) suggestedMarginPercent = 35;
    
    const suggestedSellingPrice = costPerUnit * (1 + suggestedMarginPercent / 100);

    return {
      materialsCost: materialsCost.toFixed(2),
      totalCostPerBatch: totalCostPerBatch.toFixed(2),
      costPerUnit: costPerUnit.toFixed(2),
      suggestedMarginPercent,
      suggestedSellingPrice: suggestedSellingPrice.toFixed(2),
    };
  };

  // Auto-suggest selling price button
  const applySuggestedPrice = () => {
    const costs = calculateCosts();
    form.setValue("sellingPrice", costs.suggestedSellingPrice);
  };

  const costs = calculateCosts();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat produk...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold md:text-3xl">Produk & Resepi</h1>
          <p className="text-sm text-muted-foreground mt-1">Urus produk dan resepi dengan auto-kira kos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-product">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Produk
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tambah Produk & Resepi Baru</DialogTitle>
              <DialogDescription>
                Pilih bahan dari stok gudang, sistem akan auto-kira kos & cadangkan harga jualan
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-6">
                {/* Product Details */}
                <div className="space-y-4">
                  <h3 className="font-medium">Maklumat Produk</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Produk</FormLabel>
                          <FormControl>
                            <Input placeholder="cth: Cream Puff" {...field} data-testid="input-product-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kategori</FormLabel>
                          <FormControl>
                            <Input placeholder="cth: Pastri" {...field} data-testid="input-category" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Recipe Items (from Stock) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Resepi (Bahan dari Stok)</h3>
                      <p className="text-sm text-muted-foreground">Pilih bahan dari stok gudang</p>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={addRecipeItem}
                      data-testid="button-add-recipe-item"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Tambah Bahan
                    </Button>
                  </div>
                  
                  {form.watch("recipeItems")?.map((_, index) => (
                    <div key={index} className="flex gap-3 items-start p-3 bg-muted/50 rounded-lg">
                      <FormField
                        control={form.control}
                        name={`recipeItems.${index}.stockItemId`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="text-xs">Bahan</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid={`select-stock-item-${index}`}>
                                  <SelectValue placeholder="Pilih bahan" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {stockItems.map((item) => (
                                  <SelectItem key={item.id} value={item.id}>
                                    {item.name} ({item.unit}) - RM{item.purchasePrice}/{item.unit}
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
                        name={`recipeItems.${index}.quantityNeeded`}
                        render={({ field }) => (
                          <FormItem className="w-32">
                            <FormLabel className="text-xs">Kuantiti</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                placeholder="0" 
                                {...field} 
                                data-testid={`input-quantity-${index}`}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch("recipeItems")?.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="mt-6"
                          onClick={() => removeRecipeItem(index)}
                          data-testid={`button-remove-recipe-${index}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Production Costs */}
                <div className="space-y-4">
                  <h3 className="font-medium">Kos Pengeluaran</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="unitsPerBatch"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Per Batch</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1"
                              placeholder="1" 
                              {...field} 
                              data-testid="input-units-per-batch"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Berapa unit dihasilkan dari 1 resepi
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="labourCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kos Buruh (RM)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0" 
                              {...field} 
                              data-testid="input-labour-cost"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Upah per batch
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="otherCosts"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kos Lain (RM)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0" 
                              {...field} 
                              data-testid="input-other-costs"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Gas, elektrik, etc per batch
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Cost Summary & Pricing */}
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Ringkasan Kos & Cadangan Harga
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Kos Bahan Mentah</p>
                        <p className="font-semibold">RM {costs.materialsCost}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Jumlah Kos/Batch</p>
                        <p className="font-semibold">RM {costs.totalCostPerBatch}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Kos Per Unit</p>
                        <p className="font-semibold text-lg">RM {costs.costPerUnit}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Margin Dicadangkan</p>
                        <p className="font-semibold text-primary">{costs.suggestedMarginPercent}%</p>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="sellingPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Harga Jualan Per Unit (RM)
                          </FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                placeholder={costs.suggestedSellingPrice}
                                {...field} 
                                data-testid="input-selling-price"
                                className="text-lg font-semibold"
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={applySuggestedPrice}
                              data-testid="button-apply-suggested-price"
                            >
                              Guna Cadangan
                            </Button>
                          </div>
                          <FormDescription>
                            Cadangan: RM {costs.suggestedSellingPrice} 
                            ({costs.suggestedMarginPercent}% profit margin)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    data-testid="button-save-product"
                  >
                    {createMutation.isPending ? "Menyimpan..." : "Simpan Produk"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {!products || products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tiada Produk Lagi</h3>
            <p className="text-sm text-muted-foreground mb-4">Tambah produk pertama anda</p>
            <Button onClick={() => setDialogOpen(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Produk
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product: any) => (
            <Card key={product.id} className="hover-elevate" data-testid={`card-product-${product.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <Badge variant="secondary" className="mt-2">{product.category}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kos/Unit:</span>
                    <span className="font-medium">RM {product.costPerUnit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Harga Jualan:</span>
                    <span className="font-semibold text-primary">RM {product.sellingPrice || product.suggestedPrice}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
