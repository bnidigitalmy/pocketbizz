import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { TestAuthHelper } from './helpers';
import { mockData } from './factories';

describe('Products API', () => {
  let app: express.Express;
  let authHelper: TestAuthHelper;
  let testUser: any;
  let testCookie: string;

  beforeAll(async () => {
    const { setupTestApp } = await import('../server/index');
    app = setupTestApp ? setupTestApp() : express();
    authHelper = new TestAuthHelper(app);
    
    const auth = await authHelper.createAuthenticatedUser();
    testUser = auth.user;
    testCookie = auth.cookie;
  });

  afterAll(async () => {
    await authHelper.cleanup();
  });

  describe('POST /api/products', () => {
    it('should create a new product', async () => {
      const agent = authHelper.getAuthenticatedAgent(testCookie);
      
      const productData = {
        name: `Test Product ${Date.now()}`,
        category: 'Bakery',
        costPerUnit: '10.50',
        sellingPrice: '15.00',
        unit: 'pcs',
        description: 'Delicious test product',
      };

      const response = await agent
        .post('/api/products')
        .send(productData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(productData.name);
      expect(response.body.userId).toBe(testUser.id);
    });

    it('should reject product without required fields', async () => {
      const agent = authHelper.getAuthenticatedAgent(testCookie);
      
      const invalidData = {
        name: 'Test Product',
        // Missing required fields
      };

      await agent
        .post('/api/products')
        .send(invalidData)
        .expect(400);
    });
  });

  describe('GET /api/products', () => {
    it('should return all user products', async () => {
      const agent = authHelper.getAuthenticatedAgent(testCookie);
      
      const response = await agent.get('/api/products').expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((product: any) => {
        expect(product.userId).toBe(testUser.id);
      });
    });

    it('should require authentication', async () => {
      const { app } = await import('../server/index');
      const request = await import('supertest');
      await request.default(app).get('/api/products').expect(401);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return specific product', async () => {
      const agent = authHelper.getAuthenticatedAgent(testCookie);
      
      // Create a product first
      const productData = mockData.product(testUser.id);
      const createResponse = await agent
        .post('/api/products')
        .send(productData);
      
      const productId = createResponse.body.id;

      const response = await agent
        .get(`/api/products/${productId}`)
        .expect(200);

      expect(response.body.id).toBe(productId);
      expect(response.body.userId).toBe(testUser.id);
    });

    it('should return 404 for non-existent product', async () => {
      const agent = authHelper.getAuthenticatedAgent(testCookie);
      
      await agent
        .get('/api/products/non-existent-id')
        .expect(404);
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should update existing product', async () => {
      const agent = authHelper.getAuthenticatedAgent(testCookie);
      
      // Create product
      const productData = mockData.product(testUser.id);
      const createResponse = await agent.post('/api/products').send(productData);
      const productId = createResponse.body.id;

      // Update product
      const updateData = {
        name: 'Updated Product Name',
        sellingPrice: '20.00',
      };

      const response = await agent
        .put(`/api/products/${productId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.sellingPrice).toBe(updateData.sellingPrice);
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete product', async () => {
      const agent = authHelper.getAuthenticatedAgent(testCookie);
      
      // Create product
      const productData = mockData.product(testUser.id);
      const createResponse = await agent.post('/api/products').send(productData);
      const productId = createResponse.body.id;

      // Delete product
      await agent.delete(`/api/products/${productId}`).expect(204);

      // Verify deletion
      await agent.get(`/api/products/${productId}`).expect(404);
    });
  });
});
