import dotenv from 'dotenv';
dotenv.config();

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

const PASSWORD = 'Bani@#243643'; // Same password for all demo accounts

const demoAccounts = [
  {
    email: 'trial@pocketbizz.my',
    name: 'Demo Trial User',
    businessName: 'Trial Bakery',
    plan: 'trial',
    description: 'On 14-day free trial - exploring all features'
  },
  {
    email: 'basic@pocketbizz.my',
    name: 'Siti Homebaker',
    businessName: 'Siti Homemade Kuih',
    plan: 'basic',
    description: 'Basic plan - Small homebaker with 1 user, 50 products limit'
  },
  {
    email: 'pro@pocketbizz.my',
    name: 'Ahmad Cafe Owner',
    businessName: 'Ahmad Cafe & Bakery',
    plan: 'pro',
    description: 'Pro plan - Medium F&B business with vendors and FIFO tracking'
  },
  {
    email: 'premium@pocketbizz.my',
    name: 'Fatimah Enterprise',
    businessName: 'Fatimah Catering Enterprise',
    plan: 'premium',
    description: 'Premium plan - Multi-branch catering business'
  }
];

// Mock data generators
function generateProducts(userId, planName, count) {
  const products = [];
  
  if (planName === 'trial' || planName === 'basic') {
    // Homebaker products
    const items = [
      { name: 'Kuih Lapis', category: 'Kuih Tradisional', price: 25, cost: 12 },
      { name: 'Kuih Bahulu', category: 'Kuih Tradisional', price: 18, cost: 8 },
      { name: 'Kek Batik', category: 'Kek', price: 35, cost: 15 },
      { name: 'Brownies Coklat', category: 'Kek', price: 28, cost: 13 },
      { name: 'Kuih Tart Nenas', category: 'Biskut', price: 22, cost: 10 },
      { name: 'Kuih Bangkit', category: 'Biskut', price: 20, cost: 9 },
      { name: 'Kek Red Velvet', category: 'Kek', price: 45, cost: 20 },
      { name: 'Cupcake Vanilla', category: 'Kek', price: 8, cost: 3.5 },
      { name: 'Donut Coklat', category: 'Pastri', price: 3.5, cost: 1.5 },
      { name: 'Roti Canai Frozen (10pcs)', category: 'Frozen', price: 15, cost: 6 }
    ];
    
    for (let i = 0; i < Math.min(count, items.length); i++) {
      const item = items[i];
      products.push({
        userId,
        name: item.name,
        category: item.category,
        sellingPrice: item.price.toString(),
        costPrice: item.cost.toString(),
        sku: `SKU-${String(i + 1).padStart(4, '0')}`,
        description: `${item.name} - Sedap dan berkualiti`,
        isActive: 1,
      });
    }
  } else if (planName === 'pro') {
    // Cafe/Bakery products
    const items = [
      { name: 'Nasi Lemak Special', category: 'Makanan', price: 12, cost: 5 },
      { name: 'Mee Goreng', category: 'Makanan', price: 10, cost: 4 },
      { name: 'Roti Bakar Kaya', category: 'Roti', price: 5, cost: 2 },
      { name: 'Kopi O', category: 'Minuman', price: 2.5, cost: 0.8 },
      { name: 'Teh Tarik', category: 'Minuman', price: 3, cost: 1 },
      { name: 'Milo Ais', category: 'Minuman', price: 4, cost: 1.5 },
      { name: 'Croissant Butter', category: 'Pastri', price: 6, cost: 2.5 },
      { name: 'Danish Coklat', category: 'Pastri', price: 7, cost: 3 },
      { name: 'Sandwich Telur', category: 'Makanan', price: 8, cost: 3.5 },
      { name: 'Cake Slice Oreo', category: 'Kek', price: 12, cost: 5 },
      { name: 'Puff Curry', category: 'Pastri', price: 4, cost: 1.8 },
      { name: 'Bihun Goreng', category: 'Makanan', price: 9, cost: 3.8 },
      { name: 'Air Sirap', category: 'Minuman', price: 2, cost: 0.5 },
      { name: 'Nescafe Ais', category: 'Minuman', price: 3.5, cost: 1.2 },
      { name: 'Kuih Seri Muka', category: 'Kuih', price: 3, cost: 1.2 }
    ];
    
    for (let i = 0; i < Math.min(count, items.length); i++) {
      const item = items[i];
      products.push({
        userId,
        name: item.name,
        category: item.category,
        sellingPrice: item.price.toString(),
        costPrice: item.cost.toString(),
        sku: `PRO-${String(i + 1).padStart(4, '0')}`,
        description: `${item.name} - Popular choice`,
        isActive: 1,
      });
    }
  } else {
    // Premium - Catering business
    const items = [
      { name: 'Nasi Minyak (100 pax)', category: 'Katering', price: 500, cost: 250 },
      { name: 'Ayam Percik (50 pcs)', category: 'Lauk', price: 300, cost: 150 },
      { name: 'Kambing Bakar (1 ekor)', category: 'Lauk', price: 1200, cost: 600 },
      { name: 'Dalca Sayur (50 pax)', category: 'Lauk', price: 200, cost: 80 },
      { name: 'Nasi Briyani (100 pax)', category: 'Katering', price: 600, cost: 280 },
      { name: 'Rendang Daging (5kg)', category: 'Lauk', price: 350, cost: 180 },
      { name: 'Sambal Udang (3kg)', category: 'Lauk', price: 280, cost: 150 },
      { name: 'Kuih Muih Assorted (100 pcs)', category: 'Kuih', price: 150, cost: 60 },
      { name: 'Meja & Kerusi (Set 10 org)', category: 'Peralatan', price: 80, cost: 30 },
      { name: 'Canopy 10x10', category: 'Peralatan', price: 150, cost: 50 },
      { name: 'Air Sirap Cordial (50 pax)', category: 'Minuman', price: 50, cost: 15 },
      { name: 'Nasi Tomato (100 pax)', category: 'Katering', price: 550, cost: 260 },
      { name: 'Ikan Bakar (20 ekor)', category: 'Lauk', price: 250, cost: 120 },
      { name: 'Pajeri Nenas (50 pax)', category: 'Lauk', price: 180, cost: 70 },
      { name: 'Kek Pengantin 3 Tier', category: 'Kek', price: 800, cost: 350 }
    ];
    
    for (let i = 0; i < Math.min(count, items.length); i++) {
      const item = items[i];
      products.push({
        userId,
        name: item.name,
        category: item.category,
        sellingPrice: item.price.toString(),
        costPrice: item.cost.toString(),
        sku: `PREM-${String(i + 1).padStart(4, '0')}`,
        description: `${item.name} - Quality catering service`,
        isActive: 1,
      });
    }
  }
  
  return products;
}

function generateStockItems(userId, products) {
  const stockItems = [];
  const rawMaterials = [
    { name: 'Tepung Gandum (1kg)', unit: 'kg', lowStock: 5, price: 6 },
    { name: 'Gula Pasir (1kg)', unit: 'kg', lowStock: 5, price: 4 },
    { name: 'Mentega (500g)', unit: 'pack', lowStock: 3, price: 12 },
    { name: 'Telur Grade A (10 biji)', unit: 'tray', lowStock: 2, price: 8 },
    { name: 'Susu Fresh (1L)', unit: 'L', lowStock: 3, price: 7 },
    { name: 'Coklat Powder (500g)', unit: 'pack', lowStock: 2, price: 15 },
    { name: 'Vanilla Essence (100ml)', unit: 'btl', lowStock: 1, price: 10 },
    { name: 'Baking Powder (100g)', unit: 'pack', lowStock: 2, price: 5 },
    { name: 'Santan (1L)', unit: 'pack', lowStock: 2, price: 6 },
    { name: 'Pewarna Makanan Set', unit: 'set', lowStock: 1, price: 18 }
  ];
  
  rawMaterials.forEach((item, idx) => {
    const currentStock = Math.floor(Math.random() * 20) + 5;
    stockItems.push({
      userId,
      name: item.name,
      unit: item.unit,
      currentQuantity: currentStock.toString(),
      minimumQuantity: item.lowStock.toString(),
      purchasePrice: item.price.toString(),
      category: 'Bahan Mentah',
      storageLocation: 'Store Room',
      isActive: 1,
    });
  });
  
  return stockItems;
}

function generateCustomers(userId, count) {
  const customers = [];
  const names = [
    { name: 'Nurul Aina', phone: '0123456789', area: 'Bangsar' },
    { name: 'Muhammad Hafiz', phone: '0134567890', area: 'Subang Jaya' },
    { name: 'Siti Aminah', phone: '0145678901', area: 'Shah Alam' },
    { name: 'Ahmad Zaki', phone: '0156789012', area: 'Petaling Jaya' },
    { name: 'Farah Nadia', phone: '0167890123', area: 'Damansara' },
    { name: 'Ismail Ibrahim', phone: '0178901234', area: 'Puchong' },
    { name: 'Zarina Zainol', phone: '0189012345', area: 'Kajang' },
    { name: 'Khairul Anuar', phone: '0192345678', area: 'Ampang' },
    { name: 'Nora Haslinda', phone: '0113456789', area: 'Cheras' },
    { name: 'Rahman Ali', phone: '0124567890', area: 'Kepong' }
  ];
  
  for (let i = 0; i < Math.min(count, names.length); i++) {
    const customer = names[i];
    customers.push({
      userId,
      name: customer.name,
      phone: customer.phone,
      email: `${customer.name.toLowerCase().replace(' ', '.')}@gmail.com`,
      address: `${Math.floor(Math.random() * 100) + 1}, Jalan ${customer.area}`,
      notes: `Regular customer dari ${customer.area}`,
      isActive: 1,
    });
  }
  
  return customers;
}

function generateSales(userId, customers, products, count) {
  const sales = [];
  const today = new Date();
  const userIdShort = userId.substring(0, 8); // Use part of user ID for uniqueness
  
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 30); // Sales from last 30 days
    const saleDate = new Date(today);
    saleDate.setDate(saleDate.getDate() - daysAgo);
    
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const product = products[Math.floor(Math.random() * products.length)];
    const quantity = Math.floor(Math.random() * 5) + 1;
    const unitPrice = parseFloat(product.sellingPrice);
    const totalAmount = (quantity * unitPrice).toFixed(2);
    
    // Generate unique receipt number per user: RCP-USERID-TIMESTAMP-SEQ
    const timestamp = Date.now();
    const receiptNum = `RCP-${userIdShort}-${timestamp}-${String(i + 1).padStart(3, '0')}`;
    
    sales.push({
      userId,
      customerId: customer.id,
      receiptNumber: receiptNum,
      saleDate: saleDate.toISOString(),
      totalAmount: totalAmount,
      paymentMethod: ['tunai', 'online', 'kredit'][Math.floor(Math.random() * 3)],
      status: 'completed',
      notes: `Order dari ${customer.name}`,
    });
  }
  
  return sales;
}

function generateVendors(userId) {
  return [
    {
      userId,
      name: 'Kak Aminah Kuih Specialist',
      phone: '0123334444',
      email: 'aminah.kuih@gmail.com',
      businessName: 'Aminah Homemade',
      commissionRate: '15',
      isActive: 1,
    },
    {
      userId,
      name: 'Abang Rizal Bakery',
      phone: '0124445555',
      email: 'rizal.bakery@gmail.com',
      businessName: 'Rizal Fresh Bakery',
      commissionRate: '20',
      isActive: 1,
    },
    {
      userId,
      name: 'Cik Sarah Pastry',
      phone: '0125556666',
      email: 'sarah.pastry@gmail.com',
      businessName: 'Sarah Delights',
      commissionRate: '18',
      isActive: 1,
    }
  ];
}

function generateSuppliers(userId) {
  return [
    {
      userId,
      name: 'Federal Flour Mills',
      contactPerson: 'En. Kumar',
      phone: '0387776666',
      email: 'sales@federalflour.com',
      address: 'Shah Alam Industrial Park',
      paymentTerms: 'Net 30',
      isActive: 1,
    },
    {
      userId,
      name: 'Golden Fresh Eggs Supplier',
      contactPerson: 'Pn. Lim',
      phone: '0388887777',
      email: 'orders@goldeneggs.com',
      address: 'Selayang Wholesale Market',
      paymentTerms: 'COD',
      isActive: 1,
    },
    {
      userId,
      name: 'Dairy Farm Malaysia',
      contactPerson: 'En. Ahmad',
      phone: '0389998888',
      email: 'ahmad@dairyfarm.my',
      address: 'Sungai Buloh',
      paymentTerms: 'Net 15',
      isActive: 1,
    }
  ];
}

async function seedDemoAccounts() {
  console.log('🌱 Starting demo accounts seeding...\n');
  
  try {
    // Get subscription plans
    const plans = await db.query.subscriptionPlans.findMany();
    const trialPlan = plans.find(p => p.name === 'trial');
    const basicPlan = plans.find(p => p.name === 'basic');
    const proPlan = plans.find(p => p.name === 'pro');
    const premiumPlan = plans.find(p => p.name === 'premium');
    
    if (!trialPlan || !basicPlan || !proPlan || !premiumPlan) {
      throw new Error('Subscription plans not found. Please run seed-pricing-plans.js first.');
    }
    
    const hashedPassword = await bcrypt.hash(PASSWORD, 10);
    
    for (const account of demoAccounts) {
      console.log(`\n📧 Creating account: ${account.email}`);
      console.log(`   Business: ${account.businessName}`);
      console.log(`   Plan: ${account.plan.toUpperCase()}`);
      
      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(schema.users.email, account.email),
      });
      
      let user;
      if (existingUser) {
        console.log(`   ⚠️  User already exists, deleting old data...`);
        
        // Delete related data
        await db.delete(schema.sales).where(eq(schema.sales.userId, existingUser.id));
        await db.delete(schema.customers).where(eq(schema.customers.userId, existingUser.id));
        await db.delete(schema.vendors).where(eq(schema.vendors.userId, existingUser.id));
        await db.delete(schema.suppliers).where(eq(schema.suppliers.userId, existingUser.id));
        await db.delete(schema.stockMovements).where(eq(schema.stockMovements.userId, existingUser.id));
        await db.delete(schema.stockItems).where(eq(schema.stockItems.userId, existingUser.id));
        await db.delete(schema.products).where(eq(schema.products.userId, existingUser.id));
        await db.delete(schema.userSubscriptions).where(eq(schema.userSubscriptions.userId, existingUser.id));
        
        // Update user
        await db.update(schema.users)
          .set({
            name: account.name,
            password: hashedPassword,
            isOnTrial: account.plan === 'trial' ? 1 : 0,
            trialEndsAt: account.plan === 'trial' ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null,
            graceEndsAt: account.plan === 'trial' ? new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) : null,
            updatedAt: new Date(),
          })
          .where(eq(schema.users.id, existingUser.id));
        
        user = await db.query.users.findFirst({
          where: eq(schema.users.id, existingUser.id),
        });
      } else {
        // Create new user
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 14);
        
        const graceEndsAt = new Date(trialEndsAt);
        graceEndsAt.setDate(graceEndsAt.getDate() + 7);
        
        const [newUser] = await db.insert(schema.users).values({
          email: account.email,
          password: hashedPassword,
          name: account.name,
          isOnTrial: account.plan === 'trial' ? 1 : 0,
          trialEndsAt: account.plan === 'trial' ? trialEndsAt : null,
          graceEndsAt: account.plan === 'trial' ? graceEndsAt : null,
          isAdmin: 0,
        }).returning();
        
        user = newUser;
      }
      
      console.log(`   ✓ User created/updated: ${user.id}`);
      
      // Create subscription if not trial
      if (account.plan !== 'trial') {
        let plan, productCount, duration;
        
        if (account.plan === 'basic') {
          plan = basicPlan;
          productCount = 30; // Within 50 limit
          duration = 6; // 6 months
        } else if (account.plan === 'pro') {
          plan = proPlan;
          productCount = 150; // Within 200 limit
          duration = 6;
        } else {
          plan = premiumPlan;
          productCount = 50; // Unlimited but realistic
          duration = 12; // 12 months
        }
        
        const subscriptionStarts = new Date();
        const subscriptionEnds = new Date();
        subscriptionEnds.setMonth(subscriptionEnds.getMonth() + duration);
        
        // Calculate price with discount
        const monthlyPrice = parseFloat(plan.monthlyPrice);
        let totalPrice = monthlyPrice * duration;
        
        if (duration === 6 && plan.discount6Months) {
          totalPrice = totalPrice * (1 - parseFloat(plan.discount6Months) / 100);
        } else if (duration === 12 && plan.discount12Months) {
          totalPrice = totalPrice * (1 - parseFloat(plan.discount12Months) / 100);
        }
        
        await db.insert(schema.userSubscriptions).values({
          userId: user.id,
          planId: plan.id,
          planName: plan.name,
          durationMonths: duration,
          subscriptionStartsAt: subscriptionStarts,
          subscriptionEndsAt: subscriptionEnds,
          totalPaid: Math.round(totalPrice).toString(),
          status: 'active',
          paymentMethod: 'online_banking',
          paymentProvider: 'bcl_bayarcash',
          externalTransactionId: `DEMO-${Date.now()}-${user.id}`,
        });
        
        console.log(`   ✓ Subscription created: ${plan.displayName} (${duration} months)`);
        
        // Update user trial status
        await db.update(schema.users)
          .set({ isOnTrial: 0, trialEndsAt: null })
          .where(eq(schema.users.id, user.id));
      }
      
      // Generate products based on plan limits
      let productCount;
      if (account.plan === 'trial') productCount = 10;
      else if (account.plan === 'basic') productCount = 30;
      else if (account.plan === 'pro') productCount = 150;
      else productCount = 50;
      
      const products = generateProducts(user.id, account.plan, productCount);
      const insertedProducts = await db.insert(schema.products).values(products).returning();
      console.log(`   ✓ Products created: ${insertedProducts.length}`);
      
      // Generate stock items
      const stockItems = generateStockItems(user.id, insertedProducts);
      const insertedStockItems = await db.insert(schema.stockItems).values(stockItems).returning();
      console.log(`   ✓ Stock items created: ${insertedStockItems.length}`);
      
      // Generate customers
      const customerCount = account.plan === 'trial' ? 5 : account.plan === 'basic' ? 15 : 30;
      const customers = generateCustomers(user.id, customerCount);
      const insertedCustomers = await db.insert(schema.customers).values(customers).returning();
      console.log(`   ✓ Customers created: ${insertedCustomers.length}`);
      
      // Generate sales
      const salesCount = account.plan === 'trial' ? 8 : account.plan === 'basic' ? 25 : 50;
      const sales = generateSales(user.id, insertedCustomers, insertedProducts, salesCount);
      const insertedSales = await db.insert(schema.sales).values(sales).returning();
      console.log(`   ✓ Sales created: ${insertedSales.length}`);
      
      // Generate vendors (PRO and PREMIUM only)
      if (account.plan === 'pro' || account.plan === 'premium') {
        const vendors = generateVendors(user.id);
        const insertedVendors = await db.insert(schema.vendors).values(vendors).returning();
        console.log(`   ✓ Vendors created: ${insertedVendors.length}`);
      }
      
      // Generate suppliers
      const suppliers = generateSuppliers(user.id);
      const insertedSuppliers = await db.insert(schema.suppliers).values(suppliers).returning();
      console.log(`   ✓ Suppliers created: ${insertedSuppliers.length}`);
      
      console.log(`   ✅ ${account.email} setup complete!`);
    }
    
    console.log('\n🎉 All demo accounts created successfully!\n');
    console.log('📋 Login credentials:');
    console.log('   Email: trial@pocketbizz.my | Password: Bani@#243643');
    console.log('   Email: basic@pocketbizz.my | Password: Bani@#243643');
    console.log('   Email: pro@pocketbizz.my | Password: Bani@#243643');
    console.log('   Email: premium@pocketbizz.my | Password: Bani@#243643\n');
    
  } catch (error) {
    console.error('❌ Error seeding demo accounts:', error);
    throw error;
  }
}

seedDemoAccounts();
