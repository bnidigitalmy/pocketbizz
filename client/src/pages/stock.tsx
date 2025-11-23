import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, AlertTriangle, Package, PackagePlus, Upload, Download, FileSpreadsheet, ShoppingCart, X, History } from "lucide-react";
import { SmartFilters } from "@/components/smart-filters";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocation } from "wouter";
import { 
  exportToExcel, 
  exportToCSV, 
  parseExcelFile, 
  parseCSVFile, 
  downloadSampleTemplate, 
  validateImportData,
  type StockItemImport 
} from "@/lib/import-export";
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
  FormDescription,
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
  const [, setLocation] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [replenishDialogOpen, setReplenishDialogOpen] = useState(false);
  const [replenishingItem, setReplenishingItem] = useState<StockItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<StockItem | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Shopping List Selection State
  const [selectMode, setSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [addToCartDialogOpen, setAddToCartDialogOpen] = useState(false);
  const [cartQuantities, setCartQuantities] = useState<Record<string, string>>({});
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});

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

  const handleDelete = (item: StockItem) => {
    setItemToDelete(item);
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

  // Filter stock items first (needed by selection handlers)
  const filteredStockItems = useMemo(() => {
    return stockItems.filter((item) => {
      if (filters.lowStock && !isLowStock(item)) return false;
      if (filters.outOfStock && parseFloat(item.currentQuantity) > 0) return false;
      if (filters.inStock && parseFloat(item.currentQuantity) <= 0) return false;
      
      if (filters.priceMin && parseFloat(item.purchasePrice) < parseFloat(filters.priceMin)) return false;
      if (filters.priceMax && parseFloat(item.purchasePrice) > parseFloat(filters.priceMax)) return false;
      
      if (filters.searchText && !item.name.toLowerCase().includes(filters.searchText.toLowerCase())) return false;
      
      return true;
    });
  }, [stockItems, filters]);

  const lowStockCount = stockItems.filter(isLowStock).length;

  // Selection handlers for Shopping List
  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedItems(new Set(filteredStockItems.map(item => item.id)));
  };

  const handleSelectLowStock = () => {
    const lowStockIds = filteredStockItems
      .filter(item => isLowStock(item))
      .map(item => item.id);
    setSelectedItems(new Set(lowStockIds));
  };

  const handleClearSelection = () => {
    setSelectedItems(new Set());
    setCartQuantities({});
    setItemNotes({});
  };

  const handleRemoveFromSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
  };

  const handleQuantityChange = (itemId: string, value: string) => {
    setCartQuantities(prev => ({
      ...prev,
      [itemId]: value,
    }));
  };

  const handleNotesChange = (itemId: string, value: string) => {
    setItemNotes(prev => ({
      ...prev,
      [itemId]: value,
    }));
  };

  // Calculate suggested quantity to bring stock above threshold
  const suggestedQuantity = (item: StockItem): string => {
    const current = parseFloat(item.currentQuantity);
    const threshold = parseFloat(item.lowStockThreshold);
    const packageSize = parseFloat(item.packageSize);
    
    if (current >= threshold) return packageSize.toString();
    
    // Calculate shortage
    const shortage = threshold - current;
    // Round up to nearest package
    const packagesNeeded = Math.ceil(shortage / packageSize);
    return (packagesNeeded * packageSize).toString();
  };

  // Get selected stock items
  const selectedStockItems = useMemo(() => {
    return filteredStockItems.filter(item => selectedItems.has(item.id));
  }, [filteredStockItems, selectedItems]);

  // Calculate estimated total cost
  const estimatedTotal = useMemo(() => {
    return selectedStockItems.reduce((total, item) => {
      const qty = parseFloat(cartQuantities[item.id] || suggestedQuantity(item));
      const pkgSize = parseFloat(item.packageSize);
      const pkgPrice = parseFloat(item.purchasePrice);
      const packagesNeeded = Math.ceil(qty / pkgSize);
      return total + (packagesNeeded * pkgPrice);
    }, 0);
  }, [selectedStockItems, cartQuantities]);

  // Count low stock items in selection
  const selectedLowStockCount = useMemo(() => {
    return selectedStockItems.filter(item => isLowStock(item)).length;
  }, [selectedStockItems]);

  // Bulk add to cart mutation
  const bulkAddToCartMutation = useMutation({
    mutationFn: async (data: { items: Array<{ stockItemId: string; shortageQty: string; notes?: string }> }) => {
      const response = await apiRequest("POST", "/api/shopping-cart/bulk", data);
      return await response.json();
    },
    onSuccess: (response: {
      success: boolean;
      message: string;
      results: {
        added: string[];
        skipped: string[];
        errors: Array<{ stockItemId: string; error: string }>;
      };
    }) => {
      // Refresh shopping cart
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-cart"] });
      
      // Show success message
      const { results } = response;
      const successCount = results.added.length;
      const skippedCount = results.skipped.length;
      const errorCount = results.errors.length;

      let description = `${successCount} item ditambah ke senarai belian`;
      if (skippedCount > 0) {
        description += `. ${skippedCount} item sudah dalam senarai`;
      }
      if (errorCount > 0) {
        description += `. ${errorCount} item gagal ditambah`;
      }

      toast({
        title: "Berjaya!",
        description,
        action: (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setLocation("/shopping-list")}
          >
            Lihat Senarai
          </Button>
        ),
      });

      // Clear selection and close dialog
      handleClearSelection();
      setAddToCartDialogOpen(false);
      setSelectMode(false);
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal menambah item ke senarai",
        variant: "destructive",
      });
    },
  });

  const handleBulkAddToCart = () => {
    const items = selectedStockItems.map(item => ({
      stockItemId: item.id,
      shortageQty: cartQuantities[item.id] || suggestedQuantity(item),
      notes: itemNotes[item.id] || undefined,
    }));

    bulkAddToCartMutation.mutate({ items });
  };

  // Export functions
  const handleExportExcel = async () => {
    try {
      // Fetch stock items directly from the state
      if (!stockItems || stockItems.length === 0) {
        toast({
          title: "Tiada Data",
          description: "Tiada item stok untuk dieksport.",
          variant: "destructive",
        });
        return;
      }

      // Transform data to export format
      const exportData = stockItems.map(item => ({
        'Item Name': item.name,
        'Unit': item.unit,
        'Package Size': item.packageSize,
        'Purchase Price (RM)': item.purchasePrice,
        'Current Quantity': item.currentQuantity,
        'Low Stock Threshold': item.lowStockThreshold,
        'Notes': item.notes || '',
      }));

      const filename = `stock-items-${new Date().toISOString().split('T')[0]}.xlsx`;
      exportToExcel(exportData, filename);
      
      toast({
        title: "Berjaya!",
        description: "Stok telah dieksport ke Excel.",
      });
    } catch (error: any) {
      console.error("Export Excel error:", error);
      toast({
        title: "Ralat",
        description: error.message || "Gagal mengeksport data.",
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = async () => {
    try {
      // Fetch stock items directly from the state
      if (!stockItems || stockItems.length === 0) {
        toast({
          title: "Tiada Data",
          description: "Tiada item stok untuk dieksport.",
          variant: "destructive",
        });
        return;
      }

      // Transform data to export format
      const exportData = stockItems.map(item => ({
        'Item Name': item.name,
        'Unit': item.unit,
        'Package Size': item.packageSize,
        'Purchase Price (RM)': item.purchasePrice,
        'Current Quantity': item.currentQuantity,
        'Low Stock Threshold': item.lowStockThreshold,
        'Notes': item.notes || '',
      }));

      const filename = `stock-items-${new Date().toISOString().split('T')[0]}.csv`;
      exportToCSV(exportData, filename);
      
      toast({
        title: "Berjaya!",
        description: "Stok telah dieksport ke CSV.",
      });
    } catch (error: any) {
      console.error("Export CSV error:", error);
      toast({
        title: "Ralat",
        description: error.message || "Gagal mengeksport data.",
        variant: "destructive",
      });
    }
  };

  // Import function
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      // Parse file based on type
      let importData: StockItemImport[];
      
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        importData = await parseExcelFile(file);
      } else if (file.name.endsWith('.csv')) {
        importData = await parseCSVFile(file);
      } else {
        throw new Error('Format fail tidak disokong. Sila gunakan .xlsx, .xls, atau .csv');
      }

      // Validate data
      const validation = validateImportData(importData);
      if (!validation.valid) {
        throw new Error(`Ralat validasi:\n${validation.errors.join('\n')}`);
      }

      // Send to backend
      const res = await apiRequest("POST", "/api/stock/import", {
        items: importData,
        mode: importMode,
      });
      const response = await res.json();

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock/low"] });

      toast({
        title: "Berjaya!",
        description: response.message,
      });

      if (response.results.errors.length > 0) {
        // Show errors in a separate toast
        const errorSummary = response.results.errors.slice(0, 5).map((err: any) => 
          `Row ${err.row}: ${err.error}`
        ).join('\n');
        
        toast({
          title: "Beberapa item gagal diimport",
          description: errorSummary + (response.results.errors.length > 5 ? `\n...dan ${response.results.errors.length - 5} lagi` : ''),
          variant: "destructive",
        });
      }

      setImportDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Ralat Import",
        description: error.message || "Gagal mengimport data.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="container mx-auto py-4 md:py-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Stok Gudang</h1>
          <p className="text-muted-foreground text-sm md:text-base">Urus bahan mentah dan inventori</p>
        </div>
        <div className="flex gap-2 flex-wrap w-full sm:w-auto">
          {/* Selection Mode Toggle */}
          <Button
            variant={selectMode ? "default" : "outline"}
            onClick={() => {
              setSelectMode(!selectMode);
              if (selectMode) handleClearSelection();
            }}
            data-testid="button-toggle-select-mode"
            className="flex-1 sm:flex-none"
            size="sm"
          >
            <ShoppingCart className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">{selectMode ? "Batal Pilihan" : "Pilih untuk Beli"}</span>
            <span className="sm:hidden">{selectMode ? "Batal" : "Pilih"}</span>
          </Button>

          {/* Quick Select Buttons (shown when in select mode) */}
          {selectMode && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectLowStock}
                disabled={lowStockCount === 0}
                data-testid="button-select-low-stock"
                className="flex-1 sm:flex-none"
              >
                <AlertTriangle className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden md:inline">Pilih Stok Rendah ({lowStockCount})</span>
                <span className="md:hidden">Rendah ({lowStockCount})</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                data-testid="button-select-all"
              >
                <span className="hidden sm:inline">Pilih Semua</span>
                <span className="sm:hidden">Semua</span>
              </Button>
              
              {selectedItems.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelection}
                  data-testid="button-clear-selection"
                >
                  <X className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Clear ({selectedItems.size})</span>
                </Button>
              )}
            </>
          )}

          {/* Divider when in select mode */}
          {selectMode && <div className="hidden sm:block border-l h-8 self-center" />}

          {/* Regular action buttons */}
          {!selectMode && (
            <>
              <Button 
                variant="outline" 
                onClick={() => setImportDialogOpen(true)}
                data-testid="button-import-stock"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button 
                variant="outline" 
                onClick={handleExportExcel}
                data-testid="button-export-excel"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
              <Button 
                variant="outline" 
                onClick={handleExportCSV}
                data-testid="button-export-csv"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={handleAdd} data-testid="button-add-stock">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Stok
              </Button>
            </>
          )}
        </div>
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
          <div className="flex flex-col gap-4">
            <div>
              <CardTitle>Senarai Stok</CardTitle>
              <CardDescription>
                {filteredStockItems.length} item ditunjukkan ({stockItems.length} jumlah)
              </CardDescription>
            </div>
            <SmartFilters
              quickFilters={[
                { id: "lowStock", label: "Stok Rendah", icon: <AlertTriangle className="h-3 w-3" /> },
                { id: "outOfStock", label: "Habis Stok", icon: <Package className="h-3 w-3" /> },
                { id: "inStock", label: "Ada Stok", icon: <PackagePlus className="h-3 w-3" /> },
              ]}
              advancedFilters={[
                {
                  type: "range",
                  label: "Julat Harga",
                  key: "price",
                  placeholder: "Min - Max",
                },
                {
                  type: "text",
                  label: "Cari Nama",
                  key: "searchText",
                  placeholder: "Cari bahan...",
                },
              ]}
              activeFilters={filters}
              onFilterChange={setFilters}
              onClearAll={() => setFilters({})}
            />
          </div>
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
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  {selectMode && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedItems.size === filteredStockItems.length && filteredStockItems.length > 0}
                        onCheckedChange={(checked) => 
                          checked ? handleSelectAll() : handleClearSelection()
                        }
                        data-testid="checkbox-select-all"
                      />
                    </TableHead>
                  )}
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
                {filteredStockItems.map((item) => {
                  const unitPrice = parseFloat(item.purchasePrice) / parseFloat(item.packageSize);
                  return (
                    <TableRow key={item.id} data-testid={`row-stock-${item.id}`}>
                      {selectMode && (
                        <TableCell>
                          <Checkbox
                            checked={selectedItems.has(item.id)}
                            onCheckedChange={() => handleSelectItem(item.id)}
                            data-testid={`checkbox-stock-${item.id}`}
                          />
                        </TableCell>
                      )}
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
                            onClick={() => setLocation(`/stock/${item.id}/history`)}
                            title="Sejarah Pergerakan"
                          >
                            <History className="h-4 w-4 text-blue-600" />
                          </Button>
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
                            onClick={() => handleDelete(item)}
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
            </div>
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
                      <FormDescription className="text-xs">
                        Saiz 1 pakej/botol/kotak yang dibeli
                      </FormDescription>
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
                  render={({ field }) => {
                    const packageSize = parseFloat(form.watch("packageSize") || "1");
                    const currentQty = parseFloat(field.value || "0");
                    const unit = form.watch("unit") || "";
                    const totalUnits = packageSize * currentQty;
                    
                    return (
                      <FormItem>
                        <FormLabel>Kuantiti Semasa (Pakej)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="3"
                            {...field}
                            data-testid="input-stock-quantity"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          {currentQty > 0 && packageSize > 0 && unit ? (
                            <span className="font-medium text-primary">
                              = {totalUnits.toFixed(2)} {unit} total
                            </span>
                          ) : (
                            "Berapa pakej/botol/kotak ada sekarang"
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Padam Item Stok</AlertDialogTitle>
            <AlertDialogDescription>
              Adakah anda pasti mahu memadam <span className="font-semibold">{itemToDelete?.name}</span>? 
              Tindakan ini tidak boleh dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (itemToDelete) {
                  deleteMutation.mutate(itemToDelete.id);
                  setItemToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Mempadam..." : "Padam"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Stok dari Excel/CSV</DialogTitle>
            <DialogDescription>
              Muat naik fail Excel (.xlsx, .xls) atau CSV untuk import stok secara pukal
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Import Mode Selection */}
            <div className="space-y-2">
              <Label>Mod Import</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={(e) => setImportMode(e.target.value as 'append' | 'replace')}
                    className="cursor-pointer"
                  />
                  <span>Tambah ke senarai sedia ada</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={(e) => setImportMode(e.target.value as 'append' | 'replace')}
                    className="cursor-pointer"
                  />
                  <span className="text-destructive">Ganti semua data</span>
                </label>
              </div>
              {importMode === 'replace' && (
                <p className="text-sm text-destructive">
                  ⚠️ Amaran: Semua stok sedia ada akan dipadam dan diganti dengan data baru!
                </p>
              )}
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file-upload">Pilih Fail</Label>
              <div className="flex gap-2">
                <Input
                  id="file-upload"
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  disabled={isImporting}
                  className="cursor-pointer"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Format yang disokong: .xlsx, .xls, .csv
              </p>
            </div>

            {/* Sample Template */}
            <div className="space-y-2">
              <Label>Template</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={downloadSampleTemplate}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Muat Turun Template Contoh
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Gunakan template ini sebagai rujukan format yang betul
              </p>
            </div>

            {/* Format Requirements */}
            <div className="rounded-lg border p-4 bg-muted/50">
              <h4 className="font-medium mb-2">Format yang diperlukan:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <strong>Item Name</strong>: Nama bahan (wajib)</li>
                <li>• <strong>Unit</strong>: Unit ukuran (wajib) - contoh: kg, gram, liter, pcs</li>
                <li>• <strong>Package Size</strong>: Saiz pakej (nombor positif)</li>
                <li>• <strong>Purchase Price (RM)</strong>: Harga beli (nombor positif)</li>
                <li>• <strong>Current Quantity</strong>: Kuantiti semasa</li>
                <li>• <strong>Low Stock Threshold</strong>: Ambang stok rendah</li>
                <li>• <strong>Notes</strong>: Catatan (optional)</li>
              </ul>
            </div>

            {isImporting && (
              <div className="flex items-center justify-center py-4 gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span>Sedang mengimport...</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(false)}
              disabled={isImporting}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to Shopping List Dialog */}
      <Dialog open={addToCartDialogOpen} onOpenChange={setAddToCartDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[85vh] sm:max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Tambah ke Senarai Belian</DialogTitle>
            <DialogDescription className="text-sm">
              Semak dan laraskan kuantiti untuk {selectedItems.size} item dipilih
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 pr-1 sm:pr-2">
            {/* Summary Card */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4 sm:pt-6">
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Jumlah</p>
                    <p className="text-xl sm:text-2xl font-bold">{selectedItems.size}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Anggaran</p>
                    <p className="text-lg sm:text-2xl font-bold">
                      <span className="text-xs sm:text-base">RM</span> {estimatedTotal.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Rendah</p>
                    <p className="text-xl sm:text-2xl font-bold text-amber-600">
                      {selectedLowStockCount}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items List with Editable Quantities */}
            <div className="space-y-3">
              {selectedStockItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="pt-3 sm:pt-4">
                    {/* Mobile: Stack vertically, Desktop: Horizontal */}
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                      {/* Item Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-sm sm:text-base">{item.name}</h4>
                          {isLowStock(item) && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Rendah
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1 text-xs sm:text-sm text-muted-foreground">
                          <span>Stok: {item.currentQuantity} {item.unit}</span>
                          <span>Threshold: {item.lowStockThreshold} {item.unit}</span>
                          <span className="hidden sm:inline">Pakej: {item.packageSize} {item.unit} @ RM {item.purchasePrice}</span>
                          <span className="sm:hidden">Pakej: {item.packageSize} {item.unit} @ RM {item.purchasePrice}</span>
                        </div>
                      </div>

                      {/* Quantity Input + Remove Button */}
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="flex-1 sm:w-40">
                          <Label className="text-xs">Kuantiti Beli</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              type="number"
                              step="0.01"
                              value={cartQuantities[item.id] || suggestedQuantity(item)}
                              onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                              className="w-16 sm:w-20 text-sm"
                            />
                            <span className="text-xs sm:text-sm text-muted-foreground self-center">
                              {item.unit}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Cadangan: {suggestedQuantity(item)} {item.unit}
                          </p>
                        </div>

                        {/* Remove Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFromSelection(item.id)}
                          className="mt-5"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Optional Notes */}
                    <div className="mt-3">
                      <Textarea
                        placeholder="Catatan (optional)..."
                        value={itemNotes[item.id] || ""}
                        onChange={(e) => handleNotesChange(item.id, e.target.value)}
                        className="h-14 sm:h-16 text-xs sm:text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setAddToCartDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              onClick={handleBulkAddToCart}
              disabled={bulkAddToCartMutation.isPending}
            >
              {bulkAddToCartMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Menambah...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Tambah {selectedItems.size} Item
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Action Button (appears when items selected) */}
      {selectedItems.size > 0 && (
        <div className="fixed bottom-6 right-6 z-50 lg:bottom-6 bottom-20">
          <Button
            size="lg"
            className="shadow-lg gap-2 px-6"
            onClick={() => setAddToCartDialogOpen(true)}
            data-testid="button-add-to-shopping-list"
          >
            <ShoppingCart className="h-5 w-5" />
            Tambah ke Senarai Belian
            <Badge variant="secondary" className="ml-2">
              {selectedItems.size}
            </Badge>
          </Button>
        </div>
      )}
    </div>
  );
}
