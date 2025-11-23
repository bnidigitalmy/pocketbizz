import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DatabaseStorage } from '../server/storage';
import { mockData } from './factories';
import { TestDbHelper } from './helpers';
import bcrypt from 'bcryptjs';
import { db } from '../server/db';
import { users } from '@shared/schema';

describe('Storage Layer', () => {
  let storage: DatabaseStorage;
  let testUserId: string;

  beforeAll(async () => {
    storage = new DatabaseStorage();
    
    // Create a test user
    const userData = mockData.user();
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const [user] = await db.insert(users).values({
      email: userData.email,
      password: hashedPassword,
      fullName: userData.fullName,
      businessName: userData.businessName,
    }).returning();
    
    testUserId = user.id;
  });

  afterAll(async () => {
    await TestDbHelper.cleanupUserData(testUserId);
  });

  describe('Products', () => {
    it('should create and retrieve product', async () => {
      const productData = mockData.product(testUserId);
      
      const created = await storage.createProduct(testUserId, productData, []);
      expect(created).toHaveProperty('id');
      expect(created.name).toBe(productData.name);

      const retrieved = await storage.getProduct(testUserId, created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
    });

    it('should list all user products', async () => {
      const products = await storage.getProducts(testUserId);
      expect(Array.isArray(products)).toBe(true);
    });

    it('should update product', async () => {
      const productData = mockData.product(testUserId);
      const created = await storage.createProduct(testUserId, productData, []);

      const updateData = { name: 'Updated Name' };
      const updated = await storage.updateProduct(testUserId, created.id, updateData);
      
      expect(updated.name).toBe(updateData.name);
    });

    it('should delete product', async () => {
      const productData = mockData.product(testUserId);
      const created = await storage.createProduct(testUserId, productData, []);

      await storage.deleteProduct(testUserId, created.id);

      const retrieved = await storage.getProduct(testUserId, created.id);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('Vendors', () => {
    it('should create and retrieve vendor', async () => {
      const vendorData = mockData.vendor(testUserId);
      
      const created = await storage.createVendor(testUserId, vendorData);
      expect(created).toHaveProperty('id');
      expect(created.name).toBe(vendorData.name);

      const retrieved = await storage.getVendor(testUserId, created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
    });

    it('should list all user vendors', async () => {
      const vendors = await storage.getVendors(testUserId);
      expect(Array.isArray(vendors)).toBe(true);
    });
  });

  describe('Sales', () => {
    it('should create sale with items', async () => {
      // Create a product first
      const product = await storage.createProduct(
        testUserId,
        mockData.product(testUserId),
        []
      );

      // Create production batch for inventory
      await storage.createProductionBatch(testUserId, {
        productId: product.id,
        batchDate: new Date().toISOString().split('T')[0],
        quantityProduced: 100,
        unitCost: '10.00',
        totalCost: '1000.00',
        batchNumber: `BATCH-${Date.now()}`,
        unit: 'pcs',
      });

      // Create sale
      const saleData = mockData.sale(testUserId);
      const saleItems = [
        mockData.salesItem('temp-id', product.id, testUserId, {
          quantity: 5,
          productName: product.name,
        }),
      ];

      const created = await storage.createSale(testUserId, saleData, saleItems);
      expect(created).toHaveProperty('id');
      expect(created.receiptNumber).toBeDefined();

      // Retrieve sale
      const retrieved = await storage.getSale(testUserId, created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved.items).toHaveLength(1);
    });

    it('should paginate sales list', async () => {
      const result = await storage.getSales(testUserId, 10, 0);
      
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('hasMore');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.data)).toBe(true);
    });
  });
});
