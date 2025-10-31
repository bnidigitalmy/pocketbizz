import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, TrendingUp } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const vendorSaleSchema = z.object({
  vendorId: z.string().min(1, "Sila pilih vendor"),
  vendorName: z.string(),
  saleDate: z.string().min(1, "Sila pilih tarikh"),
  items: z.array(z.object({
    productId: z.string().min(1, "Sila pilih produk"),
    productName: z.string(),
    quantitySold: z.coerce.number().min(1, "Kuantiti mestilah lebih dari 0"),
  })).min(1, "Sila tambah sekurang-kurangnya satu item"),
  notes: z.string().optional(),
});

type VendorSaleFormValues = z.infer<typeof vendorSaleSchema>;

interface VendorSalesFormProps {
  trigger?: React.ReactNode;
}

export function VendorSalesForm({ trigger }: VendorSalesFormProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([{ productId: "", productName: "", quantitySold: 1 }]);
  const { toast } = useToast();

  const form = useForm<VendorSaleFormValues>({
    resolver: zodResolver(vendorSaleSchema),
    defaultValues: {
      vendorId: "",
      vendorName: "",
      saleDate: new Date().toISOString().split('T')[0],
      items: [{ productId: "", productName: "", quantitySold: 1 }],
      notes: "",
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

  // Fetch products
  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
  });

  // Create vendor sales mutation
  const createSalesMutation = useMutation({
    mutationFn: async (data: VendorSaleFormValues) => {
      // Create individual sales records for each item
      const promises = data.items.map(item => 
        fetch("/api/vendor-sales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vendorId: data.vendorId,
            vendorName: data.vendorName,
            productId: item.productId,
            productName: item.productName,
            quantitySold: item.quantitySold,
            saleDate: data.saleDate,
            notes: data.notes,
          }),
        }).then(res => {
          if (!res.ok) throw new Error("Failed to create sale");
          return res.json();
        })
      );
      
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      toast({
        title: "Berjaya!",
        description: "Jualan vendor berjaya direkod",
      });
      setOpen(false);
      form.reset();
      setItems([{ productId: "", productName: "", quantitySold: 1 }]);
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal merekod jualan",
        variant: "destructive",
      });
    },
  });

  const addItem = () => {
    const newItems = [...items, { productId: "", productName: "", quantitySold: 1 }];
    setItems(newItems);
    form.setValue("items", newItems);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
      form.setValue("items", newItems);
    }
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        productId: product.id,
        productName: product.name,
      };
      setItems(newItems);
      form.setValue("items", newItems);
    }
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const newItems = [...items];
    newItems[index].quantitySold = quantity;
    setItems(newItems);
    form.setValue("items", newItems);
  };

  const handleVendorChange = (vendorId: string) => {
    const vendor = vendors.find(v => v.id === vendorId);
    if (vendor) {
      form.setValue("vendorId", vendor.id);
      form.setValue("vendorName", vendor.name);
    }
  };

  const onSubmit = (data: VendorSaleFormValues) => {
    createSalesMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <TrendingUp className="h-4 w-4 mr-2" />
            Update Jualan Vendor
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rekod Jualan Vendor</DialogTitle>
          <DialogDescription>
            Masukkan jualan yang dilaporkan oleh vendor
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Vendor Selection */}
            <FormField
              control={form.control}
              name="vendorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor *</FormLabel>
                  <Select 
                    onValueChange={handleVendorChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih vendor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vendors.map((vendor: any) => (
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

            {/* Sale Date */}
            <FormField
              control={form.control}
              name="saleDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tarikh Jualan *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Products Sold */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Produk Terjual *</FormLabel>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah Produk
                </Button>
              </div>

              {items.map((item, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Select 
                      value={item.productId}
                      onValueChange={(value) => handleProductChange(index, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih produk" />
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
                  <div className="w-32">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Kuantiti"
                      value={item.quantitySold}
                      onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 0)}
                    />
                  </div>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nota (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Contoh: Vendor call pagi ni report sales semalam"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={createSalesMutation.isPending}>
                {createSalesMutation.isPending ? "Menyimpan..." : "Simpan Jualan"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
