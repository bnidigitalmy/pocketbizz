import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { deliveryItems } from "@shared/schema";
import { eq } from "drizzle-orm";
import { 
  insertProductSchema,
  insertProductionBatchSchema,
  insertVendorSchema,
  insertDeliverySchema,
  insertSaleSchema,
  insertExpenseSchema,
  insertBusinessProfileSchema,
  insertGoogleDriveSyncLogSchema,
  insertStockItemSchema,
  insertCategorySchema,
  convertUnit,
} from "@shared/schema";
import { z } from "zod";
import { uploadPDFToGoogleDrive, listManisBizzFiles } from "./google-drive";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const productSchema = insertProductSchema.extend({
        unitsPerBatch: z.string(),
        labourCost: z.string(),
        otherCosts: z.string(),
        sellingPrice: z.string(),
        recipeItems: z.array(z.object({
          stockItemId: z.string(),
          quantityNeeded: z.string(),
          usageUnit: z.string(), // Unit used in recipe (e.g., "gram")
        })),
      }).omit({
        materialsCost: true,
        totalCostPerBatch: true,
        costPerUnit: true,
      });
      
      const data = productSchema.parse(req.body);
      const { recipeItems, ...productData } = data;
      
      // Calculate materials cost from recipe items WITH UNIT CONVERSION
      let materialsCost = 0;
      const recipeItemsWithCost = [];
      
      for (const item of recipeItems) {
        const stockItem = await storage.getStockItem(item.stockItemId);
        if (stockItem) {
          const recipeQuantity = parseFloat(item.quantityNeeded) || 0;
          const usageUnit = item.usageUnit || stockItem.unit; // Default to stock unit if not provided
          
          // Convert recipe quantity to stock's purchase unit for accurate pricing
          // Example: Recipe uses 500 gram, stock purchased in kg -> convert 500g to 0.5kg
          const convertedQuantity = convertUnit(recipeQuantity, usageUnit, stockItem.unit);
          
          const pricePerUnit = parseFloat(stockItem.purchasePrice) || 0;
          const cost = convertedQuantity * pricePerUnit;
          materialsCost += cost;
          
          recipeItemsWithCost.push({
            stockItemId: item.stockItemId,
            quantityNeeded: recipeQuantity.toFixed(2),
            usageUnit: usageUnit,
            costPerRecipe: cost.toFixed(2),
            productId: "", // Will be set in storage
          });
        }
      }
      
      // Calculate total cost per batch
      const labourCost = parseFloat(productData.labourCost) || 0;
      const otherCosts = parseFloat(productData.otherCosts) || 0;
      const totalCostPerBatch = materialsCost + labourCost + otherCosts;
      
      // Calculate cost per unit
      const unitsPerBatch = parseInt(productData.unitsPerBatch) || 1;
      const costPerUnit = unitsPerBatch > 0 ? totalCostPerBatch / unitsPerBatch : 0;
      
      const product = await storage.createProduct(
        {
          ...productData,
          unitsPerBatch: unitsPerBatch,
          labourCost: labourCost.toFixed(2),
          otherCosts: otherCosts.toFixed(2),
          materialsCost: materialsCost.toFixed(2),
          totalCostPerBatch: totalCostPerBatch.toFixed(2),
          costPerUnit: costPerUnit.toFixed(2),
        },
        recipeItemsWithCost
      );
      
      res.json(product);
    } catch (error) {
      console.error("Product creation error:", error);
      res.status(400).json({ error: "Invalid product data" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const productSchema = insertProductSchema.extend({
        unitsPerBatch: z.string(),
        labourCost: z.string(),
        otherCosts: z.string(),
        sellingPrice: z.string(),
        recipeItems: z.array(z.object({
          stockItemId: z.string(),
          quantityNeeded: z.string(),
          usageUnit: z.string(), // Unit used in recipe
        })),
      }).omit({
        materialsCost: true,
        totalCostPerBatch: true,
        costPerUnit: true,
      }).partial();
      
      const data = productSchema.parse(req.body);
      const { recipeItems, ...productData } = data;
      
      // Calculate materials cost from recipe items WITH UNIT CONVERSION if provided
      let materialsCost = 0;
      let recipeItemsWithCost: any[] = [];
      
      if (recipeItems && recipeItems.length > 0) {
        for (const item of recipeItems) {
          const stockItem = await storage.getStockItem(item.stockItemId);
          if (stockItem) {
            const recipeQuantity = parseFloat(item.quantityNeeded) || 0;
            const usageUnit = item.usageUnit || stockItem.unit;
            
            // Convert recipe quantity to stock's purchase unit
            const convertedQuantity = convertUnit(recipeQuantity, usageUnit, stockItem.unit);
            
            const pricePerUnit = parseFloat(stockItem.purchasePrice) || 0;
            const cost = convertedQuantity * pricePerUnit;
            materialsCost += cost;
            
            recipeItemsWithCost.push({
              stockItemId: item.stockItemId,
              quantityNeeded: recipeQuantity.toFixed(2),
              usageUnit: usageUnit,
              costPerRecipe: cost.toFixed(2),
              productId: id,
            });
          }
        }
        
        // Calculate total cost per batch
        const labourCost = parseFloat(productData.labourCost as string) || 0;
        const otherCosts = parseFloat(productData.otherCosts as string) || 0;
        const totalCostPerBatch = materialsCost + labourCost + otherCosts;
        
        // Calculate cost per unit
        const unitsPerBatch = parseInt(productData.unitsPerBatch as string) || 1;
        const costPerUnit = unitsPerBatch > 0 ? totalCostPerBatch / unitsPerBatch : 0;
        
        const updateData: any = {
          ...productData,
          unitsPerBatch: unitsPerBatch,
          labourCost: labourCost.toFixed(2),
          otherCosts: otherCosts.toFixed(2),
          materialsCost: materialsCost.toFixed(2),
          totalCostPerBatch: totalCostPerBatch.toFixed(2),
          costPerUnit: costPerUnit.toFixed(2),
        };
        
        const product = await storage.updateProduct(
          id,
          updateData,
          recipeItemsWithCost.length > 0 ? recipeItemsWithCost : undefined
        );
        
        res.json(product);
      } else {
        // No recipe items update, just update product data
        const updateData: any = { ...productData };
        if (productData.unitsPerBatch) {
          updateData.unitsPerBatch = parseInt(productData.unitsPerBatch as string);
        }
        
        const product = await storage.updateProduct(id, updateData, undefined);
        res.json(product);
      }
    } catch (error) {
      console.error("Product update error:", error);
      res.status(400).json({ error: "Invalid product data" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProduct(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Product deletion error:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  app.get("/api/recipe-items/:productId", async (req, res) => {
    try {
      const { productId } = req.params;
      const items = await storage.getRecipeItems(productId);
      res.json(items);
    } catch (error) {
      console.error("Recipe items fetch error:", error);
      res.status(500).json({ error: "Failed to fetch recipe items" });
    }
  });

  // Production
  app.get("/api/production", async (req, res) => {
    try {
      const batches = await storage.getProductionBatches();
      res.json(batches);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch production batches" });
    }
  });

  app.post("/api/production", async (req, res) => {
    try {
      const data = insertProductionBatchSchema.parse(req.body);
      const batch = await storage.createProductionBatch(data);
      res.json(batch);
    } catch (error) {
      res.status(400).json({ error: "Invalid batch data" });
    }
  });

  // Vendors
  app.get("/api/vendors", async (req, res) => {
    try {
      const vendors = await storage.getVendors();
      res.json(vendors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendors" });
    }
  });

  app.post("/api/vendors", async (req, res) => {
    try {
      const data = insertVendorSchema.parse(req.body);
      const vendor = await storage.createVendor(data);
      res.json(vendor);
    } catch (error) {
      res.status(400).json({ error: "Invalid vendor data" });
    }
  });

  // Vendor Commissions
  app.get("/api/vendors/:vendorId/commission", async (req, res) => {
    try {
      const { vendorId } = req.params;
      const commission = await storage.getVendorCommission(vendorId);
      res.json(commission || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendor commission" });
    }
  });

  app.post("/api/vendors/:vendorId/commission", async (req, res) => {
    try {
      const { vendorId } = req.params;
      
      // Validate commission data
      const commissionSchema = z.object({
        commissionType: z.enum(['fixed_range', 'percentage']),
        percentage: z.string().nullable().optional().transform(val => {
          if (val === null || val === undefined) return null;
          const num = parseFloat(val);
          if (isNaN(num) || num < 0 || num > 100) {
            throw new Error('Percentage must be between 0 and 100');
          }
          return val;
        }),
        ranges: z.string().nullable().optional().transform(val => {
          if (val === null || val === undefined) return null;
          try {
            const parsed = JSON.parse(val);
            if (!Array.isArray(parsed)) throw new Error('Ranges must be an array');
            
            // Validate each range
            for (const range of parsed) {
              const min = parseFloat(range.min);
              const max = parseFloat(range.max);
              const amount = parseFloat(range.amount);
              
              if (isNaN(min) || isNaN(max) || isNaN(amount)) {
                throw new Error('Range values must be numeric');
              }
              if (min < 0 || max < 0 || amount < 0) {
                throw new Error('Range values must be non-negative');
              }
              if (min >= max) {
                throw new Error('Range min must be less than max');
              }
            }
            
            return val;
          } catch (e: any) {
            throw new Error(`Invalid ranges: ${e.message}`);
          }
        }),
      });
      
      const validatedData = commissionSchema.parse(req.body);
      
      const data = {
        ...validatedData,
        vendorId,
      };
      
      const commission = await storage.createOrUpdateVendorCommission(data);
      res.json(commission);
    } catch (error: any) {
      console.error("Commission update error:", error);
      res.status(400).json({ error: "Invalid commission data", message: error.message });
    }
  });

  app.delete("/api/vendors/:vendorId/commission", async (req, res) => {
    try {
      const { vendorId } = req.params;
      await storage.deleteVendorCommission(vendorId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete commission" });
    }
  });

  // Stock Items (Warehouse Inventory)
  app.get("/api/stock", async (req, res) => {
    try {
      const items = await storage.getStockItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stock items" });
    }
  });

  app.get("/api/stock/low", async (req, res) => {
    try {
      const items = await storage.getLowStockItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch low stock items" });
    }
  });

  app.get("/api/stock/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const item = await storage.getStockItem(id);
      if (!item) {
        return res.status(404).json({ error: "Stock item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stock item" });
    }
  });

  app.post("/api/stock", async (req, res) => {
    try {
      const data = insertStockItemSchema.parse(req.body);
      const item = await storage.createStockItem(data);
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ error: "Invalid stock item data", message: error.message });
    }
  });

  app.patch("/api/stock/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertStockItemSchema.partial().parse(req.body);
      const item = await storage.updateStockItem(id, data);
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ error: "Invalid stock item data", message: error.message });
    }
  });

  app.delete("/api/stock/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteStockItem(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete stock item" });
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const data = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(data);
      res.json(category);
    } catch (error: any) {
      res.status(400).json({ error: "Invalid category data", message: error.message });
    }
  });

  // Deliveries
  app.get("/api/deliveries", async (req, res) => {
    try {
      const deliveries = await storage.getDeliveries();
      res.json(deliveries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deliveries" });
    }
  });

  app.get("/api/deliveries/recent", async (req, res) => {
    try {
      const deliveries = await storage.getDeliveries();
      res.json(deliveries.slice(0, 5));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent deliveries" });
    }
  });

  app.post("/api/deliveries", async (req, res) => {
    try {
      const deliverySchema = insertDeliverySchema.extend({
        items: z.array(z.object({
          productId: z.string(),
          productName: z.string(),
          quantity: z.number(),
          unitPrice: z.string(),
          rejectedQty: z.number().optional(),
          rejectionReason: z.string().optional(),
        })),
      });
      
      const data = deliverySchema.parse(req.body);
      const { items, ...deliveryData } = data;
      
      const deliveryItems = items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: (item.quantity * parseFloat(item.unitPrice)).toFixed(2),
        rejectedQty: item.rejectedQty || 0,
        rejectionReason: item.rejectionReason || null,
        deliveryId: "", // Will be set in storage
      }));
      
      const delivery = await storage.createDelivery(deliveryData, deliveryItems);
      res.json(delivery);
    } catch (error) {
      console.error("Delivery creation error:", error);
      res.status(400).json({ error: "Invalid delivery data" });
    }
  });

  app.patch("/api/deliveries/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await storage.updateDeliveryStatus(id, status);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to update status" });
    }
  });

  app.patch("/api/delivery-items/:itemId/rejection", async (req, res) => {
    try {
      const { itemId } = req.params;
      
      // Get the delivery item to check quantity
      const items = await db.select().from(deliveryItems).where(eq(deliveryItems.id, itemId));
      if (items.length === 0) {
        return res.status(404).json({ error: "Delivery item not found" });
      }
      
      const item = items[0];
      
      // Validate rejection data
      const rejectionSchema = z.object({
        rejectedQty: z.coerce.number().int().min(0).max(item.quantity),
        rejectionReason: z.string().nullable().optional(),
      });
      
      const validatedData = rejectionSchema.parse(req.body);
      
      await storage.updateDeliveryItemRejection(
        itemId,
        validatedData.rejectedQty,
        validatedData.rejectionReason || null
      );
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Update rejection error:", error);
      res.status(400).json({ 
        error: "Invalid rejection data", 
        message: error.message || "Rejected quantity must be between 0 and delivered quantity"
      });
    }
  });

  // Sales
  app.get("/api/sales", async (req, res) => {
    try {
      const sales = await storage.getSales();
      res.json(sales);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sales" });
    }
  });

  app.post("/api/sales", async (req, res) => {
    try {
      const data = insertSaleSchema.parse(req.body);
      const sale = await storage.createSale(data);
      res.json(sale);
    } catch (error) {
      res.status(400).json({ error: "Invalid sale data" });
    }
  });

  app.patch("/api/sales/:id/paid", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.markSalePaid(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to mark as paid" });
    }
  });

  // Expenses
  app.get("/api/expenses", async (req, res) => {
    try {
      const expenses = await storage.getExpenses();
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const data = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(data);
      res.json(expense);
    } catch (error) {
      res.status(400).json({ error: "Invalid expense data" });
    }
  });

  // Dashboard
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Reports
  app.get("/api/reports/profit-loss", async (req, res) => {
    try {
      const report = await storage.getProfitLossReport();
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profit/loss report" });
    }
  });

  app.get("/api/reports/top-products", async (req, res) => {
    try {
      const topProducts = await storage.getTopProducts();
      res.json(topProducts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch top products" });
    }
  });

  app.get("/api/reports/top-vendors", async (req, res) => {
    try {
      const topVendors = await storage.getTopVendors();
      res.json(topVendors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch top vendors" });
    }
  });

  app.get("/api/reports/monthly", async (req, res) => {
    try {
      const monthlyData = await storage.getMonthlyData();
      res.json(monthlyData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch monthly data" });
    }
  });

  // Claims
  app.get("/api/claims", async (req, res) => {
    try {
      const claims = await storage.getClaimsSummary();
      res.json(claims);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch claims summary" });
    }
  });

  app.get("/api/claims/:vendorId/details", async (req, res) => {
    try {
      const { vendorId } = req.params;
      const claimDetails = await storage.getClaimDetailsByVendor(vendorId);
      res.json(claimDetails);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch claim details" });
    }
  });

  app.patch("/api/deliveries/:id/payment-status", async (req, res) => {
    try {
      const { id } = req.params;
      const { paymentStatus } = req.body;
      const delivery = await storage.updateDeliveryPaymentStatus(id, paymentStatus);
      res.json(delivery);
    } catch (error) {
      res.status(400).json({ error: "Failed to update payment status" });
    }
  });

  // Business Profile
  app.get("/api/business-profile", async (req, res) => {
    try {
      const profile = await storage.getBusinessProfile();
      res.json(profile || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch business profile" });
    }
  });

  app.post("/api/business-profile", async (req, res) => {
    try {
      const data = insertBusinessProfileSchema.parse(req.body);
      const profile = await storage.createOrUpdateBusinessProfile(data);
      res.json(profile);
    } catch (error) {
      res.status(400).json({ error: "Invalid business profile data" });
    }
  });

  // Google Drive Sync
  app.post("/api/google-drive/upload", async (req, res) => {
    try {
      const { pdfBase64, fileName, deliveryId, vendorId, vendorName, fileType } = req.body;
      
      if (!pdfBase64 || !fileName) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Convert base64 to buffer
      const pdfBuffer = Buffer.from(pdfBase64, 'base64');
      
      // Upload to Google Drive
      const driveFile = await uploadPDFToGoogleDrive(pdfBuffer, fileName);
      
      // Log sync to database
      const syncLog = await storage.logGoogleDriveSync({
        deliveryId: deliveryId || null,
        fileName,
        fileType: fileType || 'invoice',
        driveFileId: driveFile.id,
        driveWebViewLink: driveFile.webViewLink,
        vendorId: vendorId || null,
        vendorName: vendorName || null,
      });

      res.json({ 
        success: true, 
        driveFile,
        syncLog 
      });
    } catch (error: any) {
      console.error('Google Drive upload error:', error);
      res.status(500).json({ 
        error: "Failed to upload to Google Drive",
        message: error.message 
      });
    }
  });

  app.get("/api/google-drive/files", async (req, res) => {
    try {
      const files = await listManisBizzFiles();
      res.json(files);
    } catch (error: any) {
      res.status(500).json({ 
        error: "Failed to fetch Google Drive files",
        message: error.message 
      });
    }
  });

  app.get("/api/google-drive/sync-logs", async (req, res) => {
    try {
      const logs = await storage.getGoogleDriveSyncLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sync logs" });
    }
  });

  app.get("/api/google-drive/sync-logs/:deliveryId", async (req, res) => {
    try {
      const { deliveryId } = req.params;
      const logs = await storage.getGoogleDriveSyncLogsByDelivery(deliveryId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch delivery sync logs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
