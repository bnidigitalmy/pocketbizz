import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProductSchema,
  insertProductionBatchSchema,
  insertVendorSchema,
  insertDeliverySchema,
  insertSaleSchema,
  insertExpenseSchema,
  insertBusinessProfileSchema,
} from "@shared/schema";
import { z } from "zod";

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
        ingredients: z.array(z.object({
          name: z.string(),
          quantity: z.string(),
          unitPrice: z.string(),
        })),
      });
      
      const data = productSchema.parse(req.body);
      const { ingredients: ingredientsList, ...productData } = data;
      
      // Calculate total cost from ingredients (sum of all ingredient unit prices)
      const totalCost = ingredientsList.reduce((sum, ing) => {
        const price = parseFloat(ing.unitPrice) || 0;
        return sum + price;
      }, 0);
      
      const ingredientsWithCost = ingredientsList.map(ing => {
        const unitPrice = parseFloat(ing.unitPrice) || 0;
        return {
          name: ing.name,
          quantity: ing.quantity,
          unitPrice: unitPrice.toFixed(2),
          totalCost: unitPrice.toFixed(2),
          productId: "", // Will be set in storage
        };
      });
      
      const product = await storage.createProduct(
        {
          ...productData,
          costPerUnit: totalCost.toFixed(2),
        },
        ingredientsWithCost
      );
      
      res.json(product);
    } catch (error) {
      console.error("Product creation error:", error);
      res.status(400).json({ error: "Invalid product data" });
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

  const httpServer = createServer(app);
  return httpServer;
}
