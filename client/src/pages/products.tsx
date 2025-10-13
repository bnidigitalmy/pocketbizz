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
import { Input } from "@/components/ui/input";
import { Plus, DollarSign, Calculator, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema, type InsertProduct } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const productFormSchema = insertProductSchema.extend({
  ingredients: z.array(z.object({
    name: z.string().min(1, "Nama bahan diperlukan"),
    quantity: z.string().min(1, "Kuantiti diperlukan"),
    unitPrice: z.string().min(1, "Harga diperlukan"),
  })).min(1, "Sila tambah sekurang-kurangnya satu bahan"),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function Products() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const { toast } = useToast();

  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/products"],
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      category: "",
      imageUrl: "",
      costPerUnit: "0",
      suggestedPrice: "0",
      ingredients: [{ name: "", quantity: "", unitPrice: "" }],
    },
  });

  const [ingredients, setIngredients] = useState([
    { name: "", quantity: "", unitPrice: "" }
  ]);

  const createMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      return apiRequest("POST", "/api/products", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Berjaya!",
        description: "Produk telah ditambah.",
      });
      setDialogOpen(false);
      form.reset();
      setIngredients([{ name: "", quantity: "", unitPrice: "" }]);
    },
    onError: () => {
      toast({
        title: "Ralat",
        description: "Gagal menambah produk.",
        variant: "destructive",
      });
    },
  });

  const addIngredient = () => {
    const current = form.getValues("ingredients") || [];
    form.setValue("ingredients", [...current, { name: "", quantity: "", unitPrice: "" }]);
    setIngredients([...ingredients, { name: "", quantity: "", unitPrice: "" }]);
  };

  const removeIngredient = (index: number) => {
    const current = form.getValues("ingredients") || [];
    if (current.length > 1) {
      form.setValue("ingredients", current.filter((_, i) => i !== index));
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const calculateCosts = () => {
    const ingredientsList = form.getValues("ingredients") || [];
    const totalCost = ingredientsList.reduce((sum, ing) => {
      const price = parseFloat(ing.unitPrice) || 0;
      return sum + price;
    }, 0);
    
    const suggestedPrice = (totalCost * 1.8).toFixed(2); // 80% markup
    form.setValue("costPerUnit", totalCost.toFixed(2));
    form.setValue("suggestedPrice", suggestedPrice);
  };

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
          <p className="text-sm text-muted-foreground mt-1">Urus produk dan resepi anda</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-product">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Produk
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tambah Produk Baru</DialogTitle>
              <DialogDescription>
                Masukkan maklumat produk dan resepi
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Produk</FormLabel>
                      <FormControl>
                        <Input placeholder="cth: Puding Roti" {...field} data-testid="input-product-name" />
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
                        <Input placeholder="cth: Dessert" {...field} data-testid="input-category" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <FormLabel>Bahan-bahan</FormLabel>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={addIngredient}
                      data-testid="button-add-ingredient"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Tambah Bahan
                    </Button>
                  </div>
                  {form.watch("ingredients")?.map((_, index) => (
                    <div key={index} className="flex gap-2">
                      <FormField
                        control={form.control}
                        name={`ingredients.${index}.name`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="Nama bahan" {...field} data-testid={`input-ingredient-name-${index}`} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`ingredients.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem className="w-24">
                            <FormControl>
                              <Input placeholder="Kuantiti" {...field} data-testid={`input-ingredient-qty-${index}`} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`ingredients.${index}.unitPrice`}
                        render={({ field }) => (
                          <FormItem className="w-24">
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                placeholder="RM" 
                                {...field}
                                data-testid={`input-ingredient-price-${index}`}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch("ingredients").length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeIngredient(index)}
                          data-testid={`button-remove-ingredient-${index}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <Button 
                  type="button" 
                  variant="secondary" 
                  className="w-full"
                  onClick={calculateCosts}
                  data-testid="button-calculate"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Kira Kos & Harga
                </Button>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="costPerUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kos Per Unit (RM)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            {...field}
                            readOnly
                            className="font-mono bg-muted"
                            data-testid="input-cost-per-unit"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="suggestedPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Harga Jual Cadangan (RM)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            {...field}
                            className="font-mono"
                            data-testid="input-suggested-price"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    data-testid="button-submit-product"
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
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-medium mb-1">Tiada Produk</h3>
            <p className="text-sm text-muted-foreground mb-4">Mulakan dengan menambah produk pertama anda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product: any) => (
            <Card 
              key={product.id} 
              className="hover-elevate cursor-pointer"
              onClick={() => setSelectedProduct(product)}
              data-testid={`product-card-${product.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="truncate text-base">{product.name}</CardTitle>
                    <Badge variant="secondary" className="mt-2">
                      {product.category}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Kos:</span>
                  <span className="font-mono font-medium">RM {product.costPerUnit}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Harga Jual:</span>
                  <span className="font-mono font-medium text-primary">RM {product.suggestedPrice}</span>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">Untung:</span>
                  <span className="font-mono font-medium text-chart-3">
                    RM {(parseFloat(product.suggestedPrice) - parseFloat(product.costPerUnit)).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Product Details Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedProduct?.name}</DialogTitle>
            <DialogDescription>Maklumat terperinci produk</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Badge>{selectedProduct?.category}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Kos Per Unit</p>
                <p className="text-xl font-mono font-semibold">RM {selectedProduct?.costPerUnit}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Harga Jual</p>
                <p className="text-xl font-mono font-semibold text-primary">RM {selectedProduct?.suggestedPrice}</p>
              </div>
            </div>
            {selectedProduct?.ingredients && selectedProduct.ingredients.length > 0 && (
              <div>
                <p className="font-medium mb-2">Bahan-bahan:</p>
                <div className="space-y-2">
                  {selectedProduct.ingredients.map((ing: any, index: number) => (
                    <div key={index} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted">
                      <span>{ing.name}</span>
                      <span className="text-muted-foreground">{ing.quantity}</span>
                      <span className="font-mono">RM {ing.unitPrice}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
