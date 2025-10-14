import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, AlertTriangle, Package, PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const stockItemSchema = z.object({
  name: z.string().min(1, "Nama diperlukan"),
  unit: z.string().min(1, "Unit diperlukan"),
  packageSize: z.string()
    .min(1, "Saiz pakej diperlukan")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Saiz pakej mesti nombor positif",
    }),
  currentQuantity: z.string().min(1, "Kuantiti diperlukan"),
  purchasePrice: z.string().min(1, "Harga pakej diperlukan"),
  lowStockThreshold: z.string().min(1, "Threshold diperlukan"),
  notes: z.string().optional(),
});

const replenishSchema = z.object({
  additionalQuantity: z.string()
    .min(1, "Kuantiti tambahan diperlukan")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Kuantiti mesti nombor positif",
    }),
  newPurchasePrice: z.string()
    .optional()
    .refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) > 0), {
      message: "Harga mesti nombor positif",
    }),
  newPackageSize: z.string()
    .optional()
    .refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) > 0), {
      message: "Saiz pakej mesti nombor positif",
    }),
});

type StockItemForm = z.infer<typeof stockItemSchema>;
type ReplenishForm = z.infer<typeof replenishSchema>;

interface StockItem {
  id: string;
  name: string;
  unit: string;
  packageSize: string;
  currentQuantity: string;
  purchasePrice: string;
  lowStockThreshold: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function Stock() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [replenishDialogOpen, setReplenishDialogOpen] = useState(false);
  const [replenishingItem, setReplenishingItem] = useState<StockItem | null>(null);

  const { data: stockItems = [], isLoading } = useQuery<StockItem[]>({
    queryKey: ["/api/stock"],
  });

  const form = useForm<StockItemForm>({
    resolver: zodResolver(stockItemSchema),
    defaultValues: {
      name: "",
      unit: "",
      packageSize: "1",
      currentQuantity: "",
      purchasePrice: "",
      lowStockThreshold: "5",
      notes: "",
    },
  });

  const replenishForm = useForm<ReplenishForm>({
    resolver: zodResolver(replenishSchema),
    defaultValues: {
      additionalQuantity: "",
      newPurchasePrice: "",
      newPackageSize: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: StockItemForm) => apiRequest("POST", "/api/stock", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock"] });
      toast({
        title: "Berjaya!",
        description: "Item stok telah ditambah.",
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal menambah item stok.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: StockItemForm }) =>
      apiRequest("PATCH", `/api/stock/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock"] });
      toast({
        title: "Berjaya!",
        description: "Item stok telah dikemaskini.",
      });
      setDialogOpen(false);
      setEditingItem(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal mengemaskini item stok.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/stock/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock"] });
      toast({
        title: "Berjaya!",
        description: "Item stok telah dipadam.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal memadam item stok.",
        variant: "destructive",
      });
    },
  });

  const replenishMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReplenishForm }) =>
      apiRequest("POST", `/api/stock/${id}/replenish`, data),
    onSuccess: () => {
      // Invalidate all stock-related queries including low stock
      queryClient.invalidateQueries({ queryKey: ["/api/stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock/low"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Berjaya!",
        description: "Stok telah ditambah.",
      });
      setReplenishDialogOpen(false);
      setReplenishingItem(null);
      replenishForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal menambah stok.",
        variant: "destructive",
      });
    },
  });

  const handleAdd = () => {
    setEditingItem(null);
    form.reset({
      name: "",
      unit: "",
      packageSize: "1",
      currentQuantity: "",
      purchasePrice: "",
      lowStockThreshold: "5",
      notes: "",
    });
    setDialogOpen(true);
  };

  const handleEdit = (item: StockItem) => {
    setEditingItem(item);
    form.reset({
      name: item.name,
      unit: item.unit,
      packageSize: item.packageSize,
      currentQuantity: item.currentQuantity,
      purchasePrice: item.purchasePrice,
      lowStockThreshold: item.lowStockThreshold,
      notes: item.notes || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Adakah anda pasti mahu memadam item stok ini?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleReplenish = (item: StockItem) => {
    setReplenishingItem(item);
    replenishForm.reset({
      additionalQuantity: "",
      newPurchasePrice: item.purchasePrice,
      newPackageSize: item.packageSize,
    });
    setReplenishDialogOpen(true);
  };

  const onSubmit = (data: StockItemForm) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const onReplenishSubmit = (data: ReplenishForm) => {
    if (replenishingItem) {
      replenishMutation.mutate({ id: replenishingItem.id, data });
    }
  };

  const isLowStock = (item: StockItem) => {
    return parseFloat(item.currentQuantity) <= parseFloat(item.lowStockThreshold);
  };

  const lowStockCount = stockItems.filter(isLowStock).length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Stok Gudang</h1>
          <p className="text-muted-foreground">Urus bahan mentah dan inventori</p>
        </div>
        <Button onClick={handleAdd} data-testid="button-add-stock">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Stok
        </Button>
      </div>

      {lowStockCount > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-lg">Amaran Stok Rendah</CardTitle>
            </div>
            <CardDescription>
              {lowStockCount} item dengan stok rendah. Sila tambah stok segera!
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Senarai Stok</CardTitle>
          <CardDescription>
            {stockItems.length} item dalam gudang
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : stockItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Tiada item stok lagi</p>
              <Button onClick={handleAdd} className="mt-4" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Item Pertama
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Bahan</TableHead>
                  <TableHead>Pakej</TableHead>
                  <TableHead className="text-right">Kuantiti</TableHead>
                  <TableHead className="text-right">Harga Pakej</TableHead>
                  <TableHead className="text-right">Harga/Unit</TableHead>
                  <TableHead className="text-right">Threshold</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockItems.map((item) => {
                  const unitPrice = parseFloat(item.purchasePrice) / parseFloat(item.packageSize);
                  return (
                    <TableRow key={item.id} data-testid={`row-stock-${item.id}`}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <span className="text-sm">{item.packageSize} {item.unit}</span>
                      </TableCell>
                      <TableCell className="text-right">{item.currentQuantity} {item.unit}</TableCell>
                      <TableCell className="text-right">RM {parseFloat(item.purchasePrice).toFixed(2)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        <span className="text-xs">RM {unitPrice.toFixed(4)}/{item.unit}</span>
                      </TableCell>
                      <TableCell className="text-right">{item.lowStockThreshold}</TableCell>
                      <TableCell>
                        {isLowStock(item) ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Rendah
                          </Badge>
                        ) : (
                          <Badge variant="secondary">OK</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleReplenish(item)}
                            data-testid={`button-replenish-stock-${item.id}`}
                            title="Tambah Stok"
                          >
                            <PackagePlus className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(item)}
                            data-testid={`button-edit-stock-${item.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id)}
                            data-testid={`button-delete-stock-${item.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Item Stok" : "Tambah Item Stok Baru"}
            </DialogTitle>
            <DialogDescription>
              Masukkan maklumat bahan mentah untuk gudang
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Bahan</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="cth: Tepung Gandum, Gula Pasir, Telur"
                        {...field}
                        data-testid="input-stock-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="cth: gram, kg, ml"
                          {...field}
                          data-testid="input-stock-unit"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="packageSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Saiz Pakej</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="cth: 500, 1.4"
                          {...field}
                          data-testid="input-stock-package-size"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purchasePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Harga Pakej (RM)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="21.90"
                          {...field}
                          data-testid="input-stock-price"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="currentQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kuantiti Semasa</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="100"
                          {...field}
                          data-testid="input-stock-quantity"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lowStockThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alert Threshold</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="5"
                          {...field}
                          data-testid="input-stock-threshold"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Catatan tambahan..."
                        className="resize-none"
                        {...field}
                        data-testid="input-stock-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-stock"
                >
                  {editingItem ? "Kemaskini" : "Tambah"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Replenish Stock Dialog */}
      <Dialog open={replenishDialogOpen} onOpenChange={setReplenishDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Stok</DialogTitle>
            <DialogDescription>
              Masukkan kuantiti tambahan untuk {replenishingItem?.name}
            </DialogDescription>
          </DialogHeader>

          <Form {...replenishForm}>
            <form onSubmit={replenishForm.handleSubmit(onReplenishSubmit)} className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Stok Semasa:</span>
                  <span className="font-medium">
                    {replenishingItem?.currentQuantity} {replenishingItem?.unit}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pakej Semasa:</span>
                  <span className="font-medium">
                    {replenishingItem?.packageSize} {replenishingItem?.unit} @ RM {replenishingItem?.purchasePrice}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Harga Per Unit:</span>
                  <span className="font-medium">
                    RM {replenishingItem && (parseFloat(replenishingItem.purchasePrice) / parseFloat(replenishingItem.packageSize)).toFixed(4)}/{replenishingItem?.unit}
                  </span>
                </div>
              </div>

              <FormField
                control={replenishForm.control}
                name="additionalQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kuantiti Tambahan</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Berapa banyak stok ditambah?"
                        {...field}
                        data-testid="input-replenish-quantity"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={replenishForm.control}
                name="newPurchasePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Harga Pakej Baru (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Jika harga berubah..."
                        {...field}
                        data-testid="input-replenish-price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={replenishForm.control}
                name="newPackageSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saiz Pakej Baru (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Jika saiz pakej berubah..."
                        {...field}
                        data-testid="input-replenish-package-size"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {replenishForm.watch("additionalQuantity") && (
                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stok Baru:</span>
                      <span className="font-semibold text-green-700 dark:text-green-400">
                        {(parseFloat(replenishingItem?.currentQuantity || "0") + 
                          parseFloat(replenishForm.watch("additionalQuantity") || "0")).toFixed(2)} {replenishingItem?.unit}
                      </span>
                    </div>
                    {(replenishForm.watch("newPurchasePrice") || replenishForm.watch("newPackageSize")) && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pakej Baru:</span>
                          <span className="font-medium">
                            {replenishForm.watch("newPackageSize") || replenishingItem?.packageSize} {replenishingItem?.unit} @ RM {replenishForm.watch("newPurchasePrice") || replenishingItem?.purchasePrice}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Harga Per Unit Baru:</span>
                          <span className="font-medium">
                            RM {(() => {
                              const newPrice = parseFloat(replenishForm.watch("newPurchasePrice") || replenishingItem?.purchasePrice || "0");
                              const newSize = parseFloat(replenishForm.watch("newPackageSize") || replenishingItem?.packageSize || "1");
                              return (newPrice / newSize).toFixed(4);
                            })()}/{replenishingItem?.unit}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReplenishDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={replenishMutation.isPending}
                  data-testid="button-save-replenish"
                >
                  {replenishMutation.isPending ? "Menyimpan..." : "Tambah Stok"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
