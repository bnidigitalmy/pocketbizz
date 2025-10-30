import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useInfiniteQuery } from "@tanstack/react-query";
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
import { Plus, Truck, Trash2, Download, Copy, ChevronDown, Share2, Receipt, Printer, Edit, Filter, X, AlertCircle } from "lucide-react";
import { generateInvoicePDF, generateMiniInvoicePDF, generateThermalInvoicePDF } from "@/lib/pdf-utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDeliverySchema } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { BatchPreviewInfo } from "@/components/batch-preview-info";

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
  const [filterVendor, setFilterVendor] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<any>(null);
  const [pendingDeliveryData, setPendingDeliveryData] = useState<any>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentDeliveryId, setPaymentDeliveryId] = useState<string | null>(null);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>("pending");
  const { toast } = useToast();

  const { 
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["/api/deliveries"],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(`/api/deliveries?limit=20&offset=${pageParam}`);
      if (!response.ok) throw new Error("Gagal mendapatkan data penghantaran");
      return response.json();
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage?.hasMore) {
        return allPages.reduce((acc, page) => acc + (page?.data?.length ?? 0), 0);
      }
      return undefined;
    },
    initialPageParam: 0,
  });

  // Flatten all pages into single array
  const deliveries = data?.pages.flatMap(page => page.data) || [];

  const { data: vendors = [] } = useQuery<any[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const { data: businessProfile } = useQuery({
    queryKey: ["/api/business-profile"],
  });

  // Smart defaults: Remember last selected vendor
  const getLastVendor = () => {
    try {
      return localStorage.getItem('pocketbizz_last_delivery_vendor') || "";
    } catch {
      return "";
    }
  };

  const form = useForm<DeliveryFormValues>({
    resolver: zodResolver(deliveryFormSchema),
    defaultValues: {
      vendorId: getLastVendor(),
      vendorName: "",
      deliveryDate: new Date().toISOString().split('T')[0],
      status: "delivered",
      totalAmount: "0",
      items: [{ productId: "", productName: "", quantity: 1, unitPrice: "0", retailPrice: "0", rejectedQty: 0, rejectionReason: "" }],
    },
  });

  // Fetch vendor commission when vendor is selected
  const selectedVendorId = form.watch("vendorId");
  const { data: vendorCommission } = useQuery({
    queryKey: ["/api/vendors", selectedVendorId, "commission"],
    enabled: !!selectedVendorId,
  });

  // Recalculate all item prices when vendor commission changes
  useEffect(() => {
    if (vendorCommission) {
      const currentItems = form.getValues("items");
      const updatedItems = currentItems.map(item => {
        if (item.retailPrice && parseFloat(item.retailPrice) > 0) {
          return {
            ...item,
            unitPrice: calculateVendorPrice(item.retailPrice),
          };
        }
        return item;
      });
      form.setValue("items", updatedItems);
      calculateTotal();
    }
  }, [vendorCommission]);

  const createMutation = useMutation({
    mutationFn: async (data: DeliveryFormValues & { force?: boolean }) => {
      // Transform data: ensure quantity and rejectedQty are numbers
      const transformedData = {
        ...data,
        items: data.items.map(item => ({
          ...item,
          quantity: typeof item.quantity === 'string' ? parseInt(item.quantity, 10) : item.quantity,
          rejectedQty: typeof item.rejectedQty === 'string' ? parseInt(item.rejectedQty as string, 10) : (item.rejectedQty || 0),
        })),
      };
      
      console.log('[Delivery] Creating delivery...', transformedData);
      
      const response = await fetch("/api/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transformedData),
      });
      
      if (response.status === 409) {
        const dupData = await response.json();
        throw { duplicate: true, data: dupData };
      }
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal merekod penghantaran");
      }
      
      return response.json();
    },
    onSuccess: async (data, variables) => {
      // Save last selected vendor for smart defaults
      try {
        if (variables.vendorId) {
          localStorage.setItem('pocketbizz_last_delivery_vendor', variables.vendorId);
        }
      } catch (e) {
        console.error('Failed to save last vendor:', e);
      }
      
      console.log('[Delivery] Created successfully:', data);
      
      // Small delay to ensure DB transaction completes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Reset infinite query to fetch from beginning
      console.log('[Delivery] Resetting queries...');
      await queryClient.resetQueries({ queryKey: ["/api/deliveries"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      console.log('[Delivery] Queries reset complete');
      
      toast({
        title: "Berjaya!",
        description: "Penghantaran telah direkod.",
      });
      setDialogOpen(false);
      setDuplicateWarning(null);
      setPendingDeliveryData(null);
      form.reset({
        vendorId: variables.vendorId, // Keep last vendor
        vendorName: "",
        deliveryDate: new Date().toISOString().split('T')[0],
        status: "delivered",
        totalAmount: "0",
        items: [{ productId: "", productName: "", quantity: 1, unitPrice: "0", retailPrice: "0", rejectedQty: 0, rejectionReason: "" }],
      });
      setItems([{ productId: "", productName: "", quantity: 1, unitPrice: "0", retailPrice: "0", rejectedQty: 0, rejectionReason: "" }]);
    },
    onError: (error: any) => {
      if (error.duplicate) {
        setDuplicateWarning(error.data);
        setPendingDeliveryData(form.getValues());
      } else {
        toast({
          title: "Ralat!",
          description: error.message || "Stok tidak mencukupi atau ralat berlaku.",
          variant: "destructive",
        });
      }
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/deliveries/${id}/status`, { status });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      toast({
        title: "Berjaya!",
        description: "Status telah dikemaskini.",
      });
      
      // Guided workflow: Prompt user to set payment status when marking as "claimed"
      if (variables.status === "claimed") {
        setPaymentDeliveryId(variables.id);
        setSelectedPaymentStatus("pending");
        setPaymentDialogOpen(true);
      }
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, paymentStatus }: { id: string; paymentStatus: string }) => {
      return apiRequest("PATCH", `/api/deliveries/${id}/payment-status`, { paymentStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
      toast({
        title: "Berjaya!",
        description: "Status bayaran telah dikemaskini.",
      });
      setPaymentDialogOpen(false);
      setPaymentDeliveryId(null);
    },
    onError: () => {
      toast({
        title: "Ralat!",
        description: "Gagal mengemaskini status bayaran.",
        variant: "destructive",
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

  const fetchLastDeliveryMutation = useMutation({
    mutationFn: async (vendorId: string) => {
      const response = await fetch(`/api/deliveries/last/${vendorId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Tiada rekod penghantaran lepas untuk vendor ini");
        }
        throw new Error("Gagal mendapatkan penghantaran lepas");
      }
      return response.json();
    },
    onSuccess: (lastDelivery) => {
      // Populate form with last delivery data (but update date to today)
      const itemsData = lastDelivery.items.map((item: any) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        retailPrice: item.retailPrice || "0",
        rejectedQty: 0,
        rejectionReason: "",
      }));
      
      form.setValue("items", itemsData);
      setItems(itemsData);
      
      toast({
        title: "Berjaya!",
        description: "Penghantaran lepas telah disalin. Sila semak dan kemaskini tarikh.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Maklumat",
        description: error.message,
        variant: "default",
      });
    },
  });

  // Filter deliveries based on selected filters
  const filteredDeliveries = useMemo(() => {
    if (!deliveries) return [];
    
    return deliveries.filter((delivery: any) => {
      // Filter by vendor
      if (filterVendor !== "all" && delivery.vendorId !== filterVendor) {
        return false;
      }
      
      // Filter by status
      if (filterStatus !== "all" && delivery.status !== filterStatus) {
        return false;
      }
      
      // Filter by date range
      if (filterDateFrom && delivery.deliveryDate < filterDateFrom) {
        return false;
      }
      if (filterDateTo && delivery.deliveryDate > filterDateTo) {
        return false;
      }
      
      return true;
    });
  }, [deliveries, filterVendor, filterStatus, filterDateFrom, filterDateTo]);

  const handleVendorChange = (vendorId: string) => {
    const vendor = vendors?.find((v: any) => v.id === vendorId);
    if (vendor) {
      form.setValue("vendorId", vendorId);
      form.setValue("vendorName", vendor.name);
    }
  };

  const calculateVendorPrice = (retailPrice: string): string => {
    const price = parseFloat(retailPrice) || 0;
    if (!vendorCommission || price === 0) return retailPrice;

    // Calculate commission based on type
    if ((vendorCommission as any).commissionType === "percentage") {
      const commissionPercent = parseFloat((vendorCommission as any).percentage || "0");
      const vendorPrice = price - (price * commissionPercent / 100);
      return vendorPrice.toFixed(2);
    } else if ((vendorCommission as any).commissionType === "fixed_range" && (vendorCommission as any).ranges) {
      // Parse ranges and find applicable commission
      try {
        const ranges = JSON.parse((vendorCommission as any).ranges);
        const applicableRange = ranges.find((r: any) => 
          price >= parseFloat(r.min) && price <= parseFloat(r.max)
        );
        if (applicableRange) {
          const commissionAmount = parseFloat(applicableRange.amount || "0");
          const vendorPrice = price - commissionAmount;
          return Math.max(0, vendorPrice).toFixed(2);
        }
      } catch (e) {
        console.error("Failed to parse commission ranges:", e);
      }
    }
    
    return retailPrice;
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = products?.find((p: any) => p.id === productId);
    if (product) {
      const currentItems = form.getValues("items");
      const retailPrice = product.sellingPrice || product.suggestedPrice || "0";
      // Calculate vendor price = retail price - commission
      const vendorPrice = calculateVendorPrice(retailPrice);
      
      currentItems[index] = {
        ...currentItems[index],
        productId,
        productName: product.name,
        unitPrice: vendorPrice, // Price after commission deduction
        retailPrice: retailPrice, // Keep original retail price for reference
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

  const handleExportDeliveries = () => {
    window.open('/api/reports/export-deliveries', '_blank');
    toast({
      title: "Export Berjaya",
      description: "Data penghantaran sedang dimuat turun",
    });
  };

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
            size="sm"
            onClick={handleExportDeliveries}
            data-testid="button-export-deliveries"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
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

                {/* Auto-fill from last delivery button */}
                {form.watch("vendorId") && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fetchLastDeliveryMutation.mutate(form.getValues("vendorId"))}
                    disabled={fetchLastDeliveryMutation.isPending}
                    className="w-full"
                    data-testid="button-repeat-last-delivery"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {fetchLastDeliveryMutation.isPending ? "Memuat..." : "Ulang Penghantaran Lepas"}
                  </Button>
                )}

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
                        <FormField
                          control={form.control}
                          name={`items.${index}.unitPrice`}
                          render={({ field }) => (
                            <FormItem className="w-24">
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0"
                                  step="0.01"
                                  placeholder="Harga"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    calculateTotal();
                                  }}
                                  data-testid={`input-item-price-${index}`}
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
                      
                      {/* Batch Preview - Show which batches will be used (FIFO) */}
                      {item.productId && item.quantity > 0 && (
                        <div className="mt-2">
                          <BatchPreviewInfo 
                            productId={item.productId}
                            quantity={item.quantity}
                            productName={item.productName}
                          />
                        </div>
                      )}
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

      {/* Filters */}
      {deliveries && deliveries.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              data-testid="button-toggle-filters"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? "Sembunyikan" : "Tapis"}
            </Button>
            {(filterVendor !== "all" || filterStatus !== "all" || filterDateFrom || filterDateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterVendor("all");
                  setFilterStatus("all");
                  setFilterDateFrom("");
                  setFilterDateTo("");
                }}
                data-testid="button-clear-filters"
              >
                <X className="h-4 w-4 mr-1" />
                Reset
              </Button>
            )}
            <span className="text-sm text-muted-foreground">
              {filteredDeliveries.length} daripada {deliveries.length} penghantaran
            </span>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-muted/50 rounded-lg">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Vendor</label>
                <Select value={filterVendor} onValueChange={setFilterVendor}>
                  <SelectTrigger data-testid="select-filter-vendor">
                    <SelectValue placeholder="Semua vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Vendor</SelectItem>
                    {vendors?.map((vendor: any) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger data-testid="select-filter-status">
                    <SelectValue placeholder="Semua status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="delivered">Dihantar</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="claimed">Dituntut</SelectItem>
                    <SelectItem value="rejected">Ditolak</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Dari Tarikh</label>
                <Input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  data-testid="input-filter-date-from"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Hingga Tarikh</label>
                <Input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  data-testid="input-filter-date-to"
                />
              </div>
            </div>
          )}
        </div>
      )}

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
      ) : filteredDeliveries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Filter className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-medium mb-1">Tiada Penghantaran Ditemui</h3>
            <p className="text-sm text-muted-foreground mb-4">Cuba reset penapis untuk melihat semua</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilterVendor("all");
                setFilterStatus("all");
              }}
            >
              Reset Penapis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDeliveries.map((delivery: any) => (
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
                        <SelectItem value="claimed">Dituntut</SelectItem>
                        <SelectItem value="rejected">Ditolak</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              {delivery.items && delivery.items.length > 0 && (
                <CardContent className="pt-0">
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-start mb-2 text-muted-foreground hover:text-foreground" data-testid={`button-toggle-items-${delivery.id}`}>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        {delivery.items.length} produk
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="space-y-2 mb-4">
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
                    </CollapsibleContent>
                  </Collapsible>
                  <div className="space-y-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setSelectedDelivery(delivery);
                        setEditDialogOpen(true);
                      }}
                      data-testid={`button-edit-delivery-${delivery.id}`}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Tolakan
                    </Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
                  </div>
                </CardContent>
              )}
            </Card>
          ))}

          {/* Load More Button */}
          {hasNextPage && (
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                data-testid="button-load-more-deliveries"
              >
                {isFetchingNextPage ? "Memuatkan..." : "Muatkan Lagi"}
              </Button>
            </div>
          )}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t">
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

      {/* Duplicate Warning Dialog */}
      <Dialog open={!!duplicateWarning} onOpenChange={(open) => !open && setDuplicateWarning(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Penghantaran Sudah Wujud
            </DialogTitle>
            <DialogDescription>
              {duplicateWarning?.message}
            </DialogDescription>
          </DialogHeader>
          
          {duplicateWarning?.existingDelivery && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">Penghantaran Sedia Ada:</p>
              <div className="text-sm text-muted-foreground">
                <p>Invois: {duplicateWarning.existingDelivery.invoiceNumber}</p>
                <p className="font-mono font-semibold text-foreground">
                  Jumlah: RM {duplicateWarning.existingDelivery.totalAmount}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDuplicateWarning(null);
                setPendingDeliveryData(null);
              }}
              data-testid="button-cancel-duplicate"
            >
              Batal
            </Button>
            <Button
              onClick={() => {
                if (pendingDeliveryData) {
                  createMutation.mutate({ ...pendingDeliveryData, force: true });
                }
              }}
              data-testid="button-confirm-duplicate"
            >
              Ya, Sambung Juga
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Guided Claims Workflow - Payment Status Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent data-testid="dialog-payment-status">
          <DialogHeader>
            <DialogTitle>Tetapkan Status Bayaran</DialogTitle>
            <DialogDescription>
              Penghantaran telah ditandakan sebagai "Dituntut". Sila tetapkan status bayaran untuk rekod tuntutan yang lebih teratur.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status Bayaran</label>
              <Select value={selectedPaymentStatus} onValueChange={setSelectedPaymentStatus}>
                <SelectTrigger data-testid="select-payment-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Belum Bayar</Badge>
                      <span className="text-xs text-muted-foreground">- Menunggu pembayaran</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="partial">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Sebahagian</Badge>
                      <span className="text-xs text-muted-foreground">- Bayaran ansuran</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="settled">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500/10 text-green-600 border-green-200">Selesai</Badge>
                      <span className="text-xs text-muted-foreground">- Sudah dibayar penuh</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                💡 <strong>Petua:</strong> Status bayaran ini akan kelihatan dalam halaman Tuntutan untuk memudahkan tracking pembayaran daripada vendor.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPaymentDialogOpen(false);
                setPaymentDeliveryId(null);
              }}
              data-testid="button-cancel-payment"
            >
              Nanti
            </Button>
            <Button
              onClick={() => {
                if (paymentDeliveryId) {
                  updatePaymentMutation.mutate({
                    id: paymentDeliveryId,
                    paymentStatus: selectedPaymentStatus,
                  });
                }
              }}
              disabled={updatePaymentMutation.isPending}
              data-testid="button-submit-payment"
            >
              {updatePaymentMutation.isPending ? "Menyimpan..." : "Simpan Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
