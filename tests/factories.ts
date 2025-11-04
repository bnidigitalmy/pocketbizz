import { randomBytes } from 'crypto';

/**
 * Generate mock data for testing
 */
export const mockData = {
  user: (overrides = {}) => ({
    id: randomBytes(16).toString('hex'),
    email: `test-${Date.now()}@example.com`,
    password: 'Test123!@#',
    fullName: 'Test User',
    businessName: 'Test Business',
    isAdmin: false,
    createdAt: new Date(),
    ...overrides,
  }),

  product: (userId: string, overrides = {}) => ({
    id: randomBytes(16).toString('hex'),
    userId,
    name: `Test Product ${Date.now()}`,
    category: 'Bakery',
    costPerUnit: '10.00',
    sellingPrice: '15.00',
    unit: 'pcs',
    description: 'Test product description',
    createdAt: new Date(),
    ...overrides,
  }),

  vendor: (userId: string, overrides = {}) => ({
    id: randomBytes(16).toString('hex'),
    userId,
    name: `Test Vendor ${Date.now()}`,
    contactPerson: 'John Doe',
    phone: '0123456789',
    state: 'Selangor',
    createdAt: new Date(),
    ...overrides,
  }),

  sale: (userId: string, overrides = {}) => ({
    id: randomBytes(16).toString('hex'),
    userId,
    receiptNumber: `RCP-${Date.now()}`,
    saleDate: new Date().toISOString().split('T')[0],
    totalAmount: '100.00',
    paymentMethod: 'cash' as const,
    createdAt: new Date(),
    ...overrides,
  }),

  salesItem: (saleId: string, productId: string, userId: string, overrides = {}) => ({
    id: randomBytes(16).toString('hex'),
    saleId,
    productId,
    userId,
    productName: 'Test Product',
    quantity: 5,
    unitPrice: '15.00',
    totalPrice: '75.00',
    ...overrides,
  }),
};

/**
 * Clean test data helpers
 */
export const cleanTestData = {
  email: (base: string) => `test-${base}-${Date.now()}@example.com`,
  name: (base: string) => `Test ${base} ${Date.now()}`,
  receiptNumber: () => `TEST-${Date.now()}`,
};
