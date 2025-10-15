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
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Truck, Trash2, Download, Copy, ChevronDown, Share2, Receipt, Printer, Edit } from "lucide-react";
import { generateInvoicePDF, generateMiniInvoicePDF, generateThermalInvoicePDF } from "@/lib/pdf-utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDeliverySchema } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const deliveryFormSchema = insertDeliverySchema.extend({
  vendorId: z.string().min(1, "Sila pilih vendor"),
  items: z.array(z.object({
    productId: z.string().min(1, "Sila pilih produk"),
    productName: z.string(),
    quantity: z.coerce.number().min(1, "Kuantiti mestilah lebih dari 0"),
    unitPrice: z.string(),
    retailPrice: z.string().optional().default("0"), // Retail price for invoice reference
    rejectedQty: z.coerce.number().min(0).optional().default(0),
    rejectionReason: z.string().optional().default(""),
  })).min(1, "Sila tambah sekurang-kurangnya satu item"),
});

type DeliveryFormValues = z.infer<typeof deliveryFormSchema>;

export default function Deliveries() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [items, setItems] = useState([{ productId: "", productName: "", quantity: 1, unitPrice: "0", retailPrice: "0", rejectedQty: 0, rejectionReason: "" }]);
  const { toast } = useToast();

  const { data: deliveries, isLoading } = useQuery({
    queryKey: ["/api/deliveries"],
  });

  const { data: vendors } = useQuery({
    queryKey: ["/api/vendors"],
  });

  const { data: products } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: businessProfile } = useQuery({
    queryKey: ["/api/business-profile"],
  });

  const form = useForm<DeliveryFormValues>({
    resolver: zodResolver(deliveryFormSchema),
    defaultValues: {
      vendorId: "",
      vendorName: "",
      deliveryDate: new Date().toISOString().split('T')[0],
      status: "delivered",
      totalAmount: "0",
      items: [{ productId: "", productName: "", quantity: 1, unitPrice: "0", retailPrice: "0", rejectedQty: 0, rejectionReason: "" }],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: DeliveryFormValues) => {
      return apiRequest("POST", "/api/deliveries", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Berjaya!",
        description: "Penghantaran telah direkod.",
      });
      setDialogOpen(false);
      form.reset();
      setItems([{ productId: "", productName: "", quantity: 1, unitPrice: "0", retailPrice: "0", rejectedQty: 0, rejectionReason: "" }]);
    },
    onError: (error: any) => {
      toast({
        title: "Ralat!",
        description: error.message || "Stok tidak mencukupi atau ralat berlaku.",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/deliveries/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      toast({
        title: "Berjaya!",
        description: "Status telah dikemaskini.",
      });
    },
  });

  const updateRejectionMutation = useMutation({
    mutationFn: async ({ itemId, rejectedQty, rejectionReason }: { itemId: string; rejectedQty: number; rejectionReason: string }) => {
      return apiRequest("PATCH", `/api/delivery-items/${itemId}/rejection`, { 
        rejectedQty, 
        rejectionReason 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
      toast({
        title: "Berjaya!",
        description: "Tolakan telah dikemaskini. Tuntutan akan dikira semula.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ralat!",
        description: error.message || "Gagal mengemaskini tolakan.",
        variant: "destructive",
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

  const handleProductChange = (index: number, productId: string) => {
    const product = products?.find((p: any) => p.id === productId);
    if (product) {
      const currentItems = form.getValues("items");
      currentItems[index] = {
        ...currentItems[index],
        productId,
        productName: product.name,
        unitPrice: product.suggestedPrice,
        retailPrice: product.sellingPrice, // Capture retail price for invoice reference
      };
      form.setValue("items", currentItems);
      calculateTotal();
    }
  };

  const addItem = () => {
    const current = form.getValues("items");
    form.setValue("items", [...current, { productId: "", productName: "", quantity: 1, unitPrice: "0", retailPrice: "0", rejectedQty: 0, rejectionReason: "" }]);
    setItems([...items, { productId: "", productName: "", quantity: 1, unitPrice: "0", retailPrice: "0", rejectedQty: 0, rejectionReason: "" }]);
  };

  const removeItem = (index: number) => {
    const current = form.getValues("items");
    if (current.length > 1) {
      form.setValue("items", current.filter((_, i) => i !== index));
      setItems(items.filter((_, i) => i !== index));
      calculateTotal();
    }
  };

  const calculateTotal = () => {
    const itemsList = form.getValues("items");
    const total = itemsList.reduce((sum, item) => {
      const price = parseFloat(item.unitPrice) || 0;
      const qty = item.quantity || 0;
      return sum + (price * qty);
    }, 0);
    form.setValue("totalAmount", total.toFixed(2));
  };

  const duplicateYesterday = () => {
    if (!deliveries || deliveries.length === 0) {
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

    // Find yesterday's delivery
    const yesterdayDelivery = deliveries.find((delivery: any) => 
      delivery.deliveryDate === yesterdayStr
    );

    if (!yesterdayDelivery) {
      toast({
        title: "Tiada Data",
        description: "Tiada penghantaran semalam untuk disalin.",
        variant: "destructive",
      });
      return;
    }

    // Populate form with yesterday's data but update date to today
    // Deep clone the items to avoid mutating cached data
    const clonedItems = yesterdayDelivery.items ? JSON.parse(JSON.stringify(yesterdayDelivery.items)) : [];
    
    form.setValue("vendorId", yesterdayDelivery.vendorId);
    form.setValue("vendorName", yesterdayDelivery.vendorName);
    form.setValue("deliveryDate", new Date().toISOString().split('T')[0]);
    form.setValue("status", yesterdayDelivery.status); // Preserve original status
    form.setValue("items", clonedItems);
    setItems(clonedItems);
    calculateTotal();

    setDialogOpen(true);

    toast({
      title: "Berjaya!",
      description: "Data semalam telah disalin. Tarikh telah dikemaskini ke hari ini.",
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "claimed": return "default";
      case "pending": return "secondary";
      case "rejected": return "destructive";
      default: return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "claimed": return "Dibayar";
      case "pending": return "Pending";
      case "rejected": return "Ditolak";
      default: return "Dihantar";
    }
  };

  const shareDeliveryViaWhatsApp = (delivery: any) => {
    const statusLabels: { [key: string]: string } = {
      delivered: 'Dihantar',
      pending: 'Pending',
      claimed: 'Dibayar',
      rejected: 'Ditolak',
    };

    let message = `*ManisBizz - Penghantaran*\n\n` +
      `Vendor: *${delivery.vendorName}*\n` +
      `Tarikh: ${new Date(delivery.deliveryDate).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}\n` +
      `Status: ${statusLabels[delivery.status] || delivery.status}\n` +
      `Jumlah: RM ${parseFloat(delivery.totalAmount).toFixed(2)}\n\n` +
      `*Senarai Produk:*\n`;

    delivery.items?.forEach((item: any) => {
      message += `• ${item.productName}: ${item.quantity}x @ RM ${parseFloat(item.unitPrice).toFixed(2)} = RM ${parseFloat(item.totalPrice).toFixed(2)}\n`;
      if (item.rejectedQty > 0) {
        message += `  Ditolak: ${item.rejectedQty} unit`;
        if (item.rejectionReason) {
          message += ` (${item.rejectionReason})`;
        }
        message += `\n`;
      }
    });

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

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
          <h1 className="text-2xl font-semibold md:text-3xl">Penghantaran</h1>
          <p className="text-sm text-muted-foreground mt-1">Urus penghantaran ke vendor</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={duplicateYesterday}
            data-testid="button-duplicate-yesterday-delivery"
          >
            <Copy className="h-4 w-4 mr-2" />
            Salin Semalam
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-delivery">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Penghantaran
              </Button>
            </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Rekod Penghantaran Baru</DialogTitle>
              <DialogDescription>
                Masukkan maklumat penghantaran
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="vendorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleVendorChange(value);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-vendor">
                            <SelectValue placeholder="Pilih vendor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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
                  name="deliveryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tarikh Penghantaran</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-delivery-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <FormLabel>Item Dihantar</FormLabel>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={addItem}
                      data-testid="button-add-item"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Tambah Item
                    </Button>
                  </div>
                  {form.watch("items")?.map((item, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex gap-2 mb-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.productId`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <Select 
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  handleProductChange(index, value);
                                }}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid={`select-product-${index}`}>
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
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem className="w-20">
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1"
                                  placeholder="Qty"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    calculateTotal();
                                  }}
                                  data-testid={`input-item-qty-${index}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {form.watch("items").length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                            data-testid={`button-remove-item-${index}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                      
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <Button type="button" variant="ghost" size="sm" className="w-full justify-start text-xs text-muted-foreground hover:text-foreground">
                            <ChevronDown className="h-3 w-3 mr-1" />
                            Rekod Tolakan (Optional)
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-2 mt-2 pt-2 border-t">
                          <FormField
                            control={form.control}
                            name={`items.${index}.rejectedQty`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Kuantiti Ditolak</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="0"
                                    max={item.quantity || 0}
                                    placeholder="0"
                                    {...field}
                                    data-testid={`input-rejected-qty-${index}`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`items.${index}.rejectionReason`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Sebab Tolakan</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Cth: Rosak, luput, tidak sesuai..."
                                    className="resize-none h-16"
                                    {...field}
                                    data-testid={`input-rejection-reason-${index}`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  ))}
                </div>

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
                          data-testid="input-total-amount"
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
                    data-testid="button-submit-delivery"
                  >
                    {createMutation.isPending ? "Menyimpan..." : "Simpan Penghantaran"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {!deliveries || deliveries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Truck className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-medium mb-1">Tiada Penghantaran</h3>
            <p className="text-sm text-muted-foreground mb-4">Rekod penghantaran pertama anda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {deliveries.map((delivery: any) => (
            <Card key={delivery.id} className="hover-elevate" data-testid={`delivery-card-${delivery.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="truncate text-base">{delivery.vendorName}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(delivery.deliveryDate).toLocaleDateString('ms-MY')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-mono font-semibold text-lg">RM {delivery.totalAmount}</p>
                    </div>
                    <Select
                      value={delivery.status}
                      onValueChange={(value) => updateStatusMutation.mutate({ id: delivery.id, status: value })}
                    >
                      <SelectTrigger className="w-32" data-testid={`select-status-${delivery.id}`}>
                        <SelectValue>
                          <Badge variant={getStatusBadgeVariant(delivery.status)}>
                            {getStatusLabel(delivery.status)}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="delivered">Dihantar</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="claimed">Dibayar</SelectItem>
                        <SelectItem value="rejected">Ditolak</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              {delivery.items && delivery.items.length > 0 && (
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {delivery.items.map((item: any, index: number) => (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted">
                          <span className="flex-1">{item.productName}</span>
                          <span className="text-muted-foreground">{item.quantity}x</span>
                          <span className="font-mono ml-2">RM {item.totalPrice}</span>
                        </div>
                        {item.rejectedQty > 0 && (
                          <div className="ml-2 pl-3 border-l-2 border-destructive/50">
                            <div className="flex items-center gap-2 text-xs">
                              <Badge variant="destructive" className="h-5">
                                Ditolak: {item.rejectedQty} unit
                              </Badge>
                              {item.rejectionReason && (
                                <span className="text-muted-foreground italic">
                                  {item.rejectionReason}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedDelivery(delivery);
                        setEditDialogOpen(true);
                      }}
                      data-testid={`button-edit-delivery-${delivery.id}`}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Tolakan
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => generateInvoicePDF(delivery, businessProfile)}
                      data-testid={`button-download-invoice-${delivery.id}`}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Invois
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => generateMiniInvoicePDF(delivery, businessProfile)}
                      data-testid={`button-download-mini-${delivery.id}`}
                    >
                      <Receipt className="h-4 w-4 mr-2" />
                      Resit A5
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => generateThermalInvoicePDF(delivery, businessProfile)}
                      data-testid={`button-thermal-invoice-${delivery.id}`}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Thermal 58mm
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => shareDeliveryViaWhatsApp(delivery)}
                      data-testid={`button-share-delivery-${delivery.id}`}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      WhatsApp
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Edit Delivery Rejection Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Tolakan Penghantaran</DialogTitle>
            <DialogDescription>
              Kemaskini kuantiti dan sebab tolakan untuk produk yang expired/rosak selepas penghantaran.
            </DialogDescription>
          </DialogHeader>
          
          {selectedDelivery && (
            <div className="space-y-4 mt-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{selectedDelivery.vendorName}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedDelivery.invoiceNumber} - {new Date(selectedDelivery.deliveryDate).toLocaleDateString('ms-MY')}
                </p>
              </div>

              {selectedDelivery.items?.map((item: any, index: number) => (
                <Card key={item.id || index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          Kuantiti dihantar: {item.quantity} unit @ RM {item.unitPrice}
                        </p>
                      </div>
                      <p className="font-mono font-semibold">RM {item.totalPrice}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Kuantiti Ditolak</label>
                        <Input
                          type="number"
                          min="0"
                          max={item.quantity}
                          defaultValue={item.rejectedQty || 0}
                          onChange={(e) => {
                            const updatedItems = [...(selectedDelivery.items || [])];
                            updatedItems[index] = {
                              ...updatedItems[index],
                              rejectedQty: parseInt(e.target.value) || 0
                            };
                            setSelectedDelivery({
                              ...selectedDelivery,
                              items: updatedItems
                            });
                          }}
                          className="mt-1"
                          data-testid={`input-edit-rejected-qty-${index}`}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Sebab Tolakan</label>
                        <Input
                          type="text"
                          placeholder="Cth: Expired, Rosak"
                          defaultValue={item.rejectionReason || ""}
                          onChange={(e) => {
                            const updatedItems = [...(selectedDelivery.items || [])];
                            updatedItems[index] = {
                              ...updatedItems[index],
                              rejectionReason: e.target.value
                            };
                            setSelectedDelivery({
                              ...selectedDelivery,
                              items: updatedItems
                            });
                          }}
                          className="mt-1"
                          data-testid={`input-edit-rejection-reason-${index}`}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              data-testid="button-cancel-edit"
            >
              Batal
            </Button>
            <Button
              onClick={async () => {
                if (!selectedDelivery?.items) return;
                
                try {
                  // Update each item's rejection data
                  for (const item of selectedDelivery.items) {
                    await updateRejectionMutation.mutateAsync({
                      itemId: item.id,
                      rejectedQty: item.rejectedQty || 0,
                      rejectionReason: item.rejectionReason || ""
                    });
                  }
                  setEditDialogOpen(false);
                  setSelectedDelivery(null);
                } catch (error) {
                  // Error already handled in mutation
                }
              }}
              disabled={updateRejectionMutation.isPending}
              data-testid="button-save-rejection"
            >
              {updateRejectionMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
