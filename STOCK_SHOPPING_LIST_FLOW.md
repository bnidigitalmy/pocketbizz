# Stock Shopping List Integration - Flow & Implementation Plan

**Created:** November 5, 2025  
**Feature:** Checkbox selection in Stock page to add items to Shopping List

---

## 🎯 User Flow Overview

```
┌─────────────────────┐
│   STOCK PAGE        │
│  (Stok Gudang)      │
└──────────┬──────────┘
           │
           │ 1️⃣ User ticks checkboxes for items to purchase
           │
           ▼
┌─────────────────────┐
│  SELECTION ACTIONS  │
│  - Select All       │
│  - Select Low Stock │
│  - Clear Selection  │
└──────────┬──────────┘
           │
           │ 2️⃣ Floating "Add to Shopping List" button appears
           │    Shows count: "3 items selected"
           │
           ▼
┌─────────────────────┐
│  ADD TO CART DIALOG │
│  - Review items     │
│  - Edit quantities  │
│  - Add notes        │
│  - See estimates    │
└──────────┬──────────┘
           │
           │ 3️⃣ User confirms → Bulk add to shopping cart
           │
           ▼
┌─────────────────────┐
│  SHOPPING LIST PAGE │
│  (Existing feature) │
│  - Review cart      │
│  - Create PO        │
│  - Track orders     │
└──────────┬──────────┘
           │
           │ 4️⃣ Create Purchase Order → Send to supplier
           │
           ▼
┌─────────────────────┐
│  RECEIVE GOODS      │
│  - Mark PO received │
│  - Auto replenish   │
│  - Update stock     │
└─────────────────────┘
```

---

## 📊 Database Structure (Already Exists!)

### Shopping Cart Table
```typescript
shoppingCart = {
  id: uuid,
  userId: uuid (FK),
  stockItemId: uuid (FK), // Link to stock item
  stockItemName: text,    // Denormalized for display
  shortageQty: decimal,   // Quantity to purchase
  unit: text,             // Unit of measurement
  productionBatchId: uuid (optional),
  productName: text (optional),
  notes: text (optional),
  createdAt: timestamp
}
```

**Status:** ✅ Table exists, APIs exist, Shopping List page exists

---

## 🛠️ Implementation Plan

### Phase 1: Stock Page - Checkbox System

#### 1.1 Add State Management
```typescript
// In stock.tsx
const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
const [selectMode, setSelectMode] = useState(false); // Toggle selection mode

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
};
```

#### 1.2 Add Checkbox Column to Table
```tsx
<TableHeader>
  <TableRow>
    {selectMode && (
      <TableHead className="w-12">
        <Checkbox
          checked={selectedItems.size === filteredStockItems.length}
          onCheckedChange={(checked) => 
            checked ? handleSelectAll() : handleClearSelection()
          }
        />
      </TableHead>
    )}
    <TableHead>Nama Bahan</TableHead>
    {/* ... rest of headers */}
  </TableRow>
</TableHeader>

<TableBody>
  {filteredStockItems.map((item) => (
    <TableRow key={item.id}>
      {selectMode && (
        <TableCell>
          <Checkbox
            checked={selectedItems.has(item.id)}
            onCheckedChange={() => handleSelectItem(item.id)}
          />
        </TableCell>
      )}
      {/* ... rest of cells */}
    </TableRow>
  ))}
</TableBody>
```

#### 1.3 Selection Action Bar
```tsx
<div className="flex gap-2">
  {/* Toggle Selection Mode */}
  <Button
    variant={selectMode ? "default" : "outline"}
    onClick={() => {
      setSelectMode(!selectMode);
      if (selectMode) handleClearSelection();
    }}
  >
    <ShoppingCart className="h-4 w-4 mr-2" />
    {selectMode ? "Cancel Selection" : "Select for Shopping"}
  </Button>

  {/* Quick Select Buttons (shown when in select mode) */}
  {selectMode && (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSelectLowStock}
      >
        <AlertTriangle className="h-4 w-4 mr-2" />
        Pilih Stok Rendah ({lowStockCount})
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleSelectAll}
      >
        Pilih Semua
      </Button>
      
      {selectedItems.size > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearSelection}
        >
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
      )}
    </>
  )}

  {/* Existing Import/Export buttons */}
  <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
    <Upload className="h-4 w-4 mr-2" />
    Import
  </Button>
  {/* ... rest of buttons */}
</div>
```

#### 1.4 Floating Add to Cart Button
```tsx
{/* Floating Action Button (appears when items selected) */}
{selectedItems.size > 0 && (
  <div className="fixed bottom-6 right-6 z-50">
    <Button
      size="lg"
      className="shadow-lg gap-2 px-6"
      onClick={() => setAddToCartDialogOpen(true)}
    >
      <ShoppingCart className="h-5 w-5" />
      Tambah ke Senarai Belian
      <Badge variant="secondary" className="ml-2">
        {selectedItems.size}
      </Badge>
    </Button>
  </div>
)}
```

---

### Phase 2: Add to Cart Dialog

#### 2.1 Dialog Component
```tsx
<Dialog open={addToCartDialogOpen} onOpenChange={setAddToCartDialogOpen}>
  <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
    <DialogHeader>
      <DialogTitle>Tambah ke Senarai Belian</DialogTitle>
      <DialogDescription>
        Semak dan laraskan kuantiti untuk {selectedItems.size} item dipilih
      </DialogDescription>
    </DialogHeader>

    <div className="flex-1 overflow-y-auto space-y-4">
      {/* Summary Card */}
      <Card className="bg-primary/5">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Jumlah Item</p>
              <p className="text-2xl font-bold">{selectedItems.size}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Anggaran Kos</p>
              <p className="text-2xl font-bold">
                RM {estimatedTotal.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Item Stok Rendah</p>
              <p className="text-2xl font-bold text-amber-600">
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
            <CardContent className="pt-4">
              <div className="flex items-start gap-4">
                {/* Item Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{item.name}</h4>
                    {isLowStock(item) && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Rendah
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span>Stok: {item.currentQuantity} {item.unit}</span>
                    <span>Threshold: {item.lowStockThreshold} {item.unit}</span>
                    <span>Pakej: {item.packageSize} {item.unit} @ RM {item.purchasePrice}</span>
                  </div>
                </div>

                {/* Quantity Input */}
                <div className="w-48">
                  <Label className="text-xs">Kuantiti Beli</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="number"
                      step="0.01"
                      value={cartQuantities[item.id] || suggestedQuantity(item)}
                      onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground self-center">
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
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Optional Notes */}
              <div className="mt-3">
                <Textarea
                  placeholder="Catatan (optional)..."
                  value={itemNotes[item.id] || ""}
                  onChange={(e) => handleNotesChange(item.id, e.target.value)}
                  className="h-16 text-sm"
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
        disabled={addToCartMutation.isPending}
      >
        {addToCartMutation.isPending ? (
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
```

#### 2.2 Helper Functions
```typescript
// Calculate suggested quantity (to bring stock above threshold)
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
```

---

### Phase 3: Backend API

#### 3.1 Bulk Add to Cart Endpoint
```typescript
// In server/routes.ts

// POST /api/shopping-cart/bulk - Add multiple items to cart
app.post("/api/shopping-cart/bulk", requireAuth, async (req, res) => {
  try {
    const schema = z.object({
      items: z.array(z.object({
        stockItemId: z.string().uuid(),
        shortageQty: z.string(),
        notes: z.string().optional(),
      })),
    });

    const { items } = schema.parse(req.body);
    const userId = req.user!.id;

    // Get stock items details
    const stockItemIds = items.map(item => item.stockItemId);
    const stockItemsData = await storage.getStockItemsByIds(stockItemIds, userId);

    // Check for duplicates in cart
    const existingCartItems = await storage.getShoppingCart(userId);
    const existingStockIds = new Set(existingCartItems.map(item => item.stockItemId));

    const results = {
      added: [] as string[],
      skipped: [] as string[],
      errors: [] as { stockItemId: string; error: string }[],
    };

    // Add items to cart
    for (const item of items) {
      try {
        // Check if already in cart
        if (existingStockIds.has(item.stockItemId)) {
          results.skipped.push(item.stockItemId);
          continue;
        }

        // Get stock item details
        const stockItem = stockItemsData.find(s => s.id === item.stockItemId);
        if (!stockItem) {
          results.errors.push({
            stockItemId: item.stockItemId,
            error: "Stock item not found",
          });
          continue;
        }

        // Insert into cart
        await storage.addToShoppingCart({
          userId,
          stockItemId: item.stockItemId,
          stockItemName: stockItem.name,
          shortageQty: item.shortageQty,
          unit: stockItem.unit,
          notes: item.notes || null,
          productionBatchId: null,
          productName: null,
        });

        results.added.push(item.stockItemId);
      } catch (error: any) {
        results.errors.push({
          stockItemId: item.stockItemId,
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      message: `${results.added.length} items added to shopping list`,
      results,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});
```

#### 3.2 Storage Layer
```typescript
// In server/storage.ts

async getStockItemsByIds(ids: string[], userId: string): Promise<StockItem[]> {
  return await db
    .select()
    .from(stockItems)
    .where(
      and(
        inArray(stockItems.id, ids),
        eq(stockItems.userId, userId)
      )
    );
}
```

---

### Phase 4: Mutation & Integration

#### 4.1 React Query Mutation
```typescript
// In stock.tsx

const bulkAddToCartMutation = useMutation({
  mutationFn: async (data: { items: Array<{ stockItemId: string; shortageQty: string; notes?: string }> }) => {
    return await apiRequest<{
      success: boolean;
      message: string;
      results: {
        added: string[];
        skipped: string[];
        errors: Array<{ stockItemId: string; error: string }>;
      };
    }>("POST", "/api/shopping-cart/bulk", data);
  },
  onSuccess: (response) => {
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
    });

    // Clear selection and close dialog
    handleClearSelection();
    setAddToCartDialogOpen(false);
    setSelectMode(false);

    // Ask if user wants to view shopping list
    toast({
      title: "Lihat Senarai Belian?",
      description: "Item telah ditambah ke senarai belian",
      action: (
        <Button
          size="sm"
          onClick={() => setLocation("/shopping-list")}
        >
          Lihat
        </Button>
      ),
    });
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
```

---

## 🎨 UI/UX Enhancements

### Smart Suggestions
1. **Auto-calculate shortage:** `threshold - currentQuantity`
2. **Round up to packages:** `Math.ceil(shortage / packageSize) * packageSize`
3. **Visual indicators:**
   - 🔴 Red badge for out of stock
   - 🟡 Amber badge for low stock
   - ✅ Green badge for adequate stock

### Keyboard Shortcuts
- `Ctrl/Cmd + A`: Select all items
- `Ctrl/Cmd + L`: Select low stock items
- `Escape`: Clear selection / Close dialog

### Responsive Design
- Mobile: Stack items vertically, full-width inputs
- Tablet: 2-column grid for items
- Desktop: 3-column grid with detailed view

---

## 🧪 Testing Checklist

### Selection System
- [ ] Toggle selection mode on/off
- [ ] Select individual items with checkbox
- [ ] Select all items
- [ ] Select only low stock items
- [ ] Clear selection
- [ ] Selection persists during filtering
- [ ] Floating button shows correct count

### Add to Cart Dialog
- [ ] Dialog opens with selected items
- [ ] Shows correct item details
- [ ] Quantity inputs work correctly
- [ ] Suggested quantities calculate properly
- [ ] Notes can be added per item
- [ ] Remove item from selection
- [ ] Estimated total calculates correctly
- [ ] Cancel clears state

### Backend Integration
- [ ] Bulk add API endpoint works
- [ ] Handles duplicate items (skip)
- [ ] Validates stock item exists
- [ ] Returns proper error messages
- [ ] Shopping cart updates correctly

### Complete Flow
- [ ] Stock → Select → Add to Cart → Shopping List
- [ ] Shopping List → Create PO → Send
- [ ] Receive PO → Stock replenished
- [ ] Low stock alerts update correctly

---

## 📈 Future Enhancements

### Phase 2 (Optional)
1. **Auto-reorder system:** Automatically add low stock items to cart weekly
2. **Supplier preferences:** Remember which supplier for each stock item
3. **Price history:** Track price changes over time
4. **Bulk actions:** Edit multiple quantities at once
5. **Templates:** Save common shopping lists
6. **Budget alerts:** Warn when total exceeds budget

### Phase 3 (Advanced)
1. **Predictive ordering:** ML-based prediction of stock needs
2. **Supplier comparison:** Compare prices across suppliers
3. **Contract management:** Track supplier contracts and terms
4. **Delivery scheduling:** Schedule recurring deliveries
5. **QR code scanning:** Scan items to add to cart

---

## 🚀 Deployment Notes

### Database Changes
✅ No migration needed - `shoppingCart` table already exists

### API Changes
- Add new endpoint: `POST /api/shopping-cart/bulk`
- Add storage method: `getStockItemsByIds()`

### Frontend Changes
- Update `client/src/pages/stock.tsx`
- No new dependencies needed (Checkbox already in shadcn/ui)

### Testing Requirements
- Unit tests for selection logic
- Integration tests for bulk add API
- E2E tests for complete flow

---

## 📝 Implementation Steps

1. ✅ Documentation complete
2. ⏳ Add checkbox system to Stock page
3. ⏳ Create Add to Cart dialog
4. ⏳ Implement backend bulk API
5. ⏳ Add React Query mutation
6. ⏳ Test complete flow
7. ⏳ Deploy to production

**Estimated Time:** 3-4 hours for complete implementation

---

**Status:** Ready for implementation 🚀
