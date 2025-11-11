/**
 * Data Archiving System
 * Automatically archives excess data when users exceed their plan limits
 * Called after trial/grace period ends or when user downgrades
 */

import { db } from "./db";
import { 
  users, 
  products, 
  vendors, 
  resellers, 
  customers, 
  stockItems 
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { getUserPlan } from "./feature-gating";

interface ArchiveResult {
  productsArchived: number;
  vendorsArchived: number;
  resellersArchived: number;
  customersArchived: number;
  stockItemsArchived: number;
}

/**
 * Archive excess data for a user based on their plan limits
 * Archives oldest records first (FIFO) while keeping most recent data
 */
export async function archiveUserData(userId: number): Promise<ArchiveResult> {
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || user.length === 0) {
    throw new Error("User not found");
  }

  const plan = await getUserPlan(userId.toString());
  
  // Check if plan has limits property (it should be in the returned plan object)
  if (!plan || typeof plan !== 'object') {
    throw new Error("Failed to get user plan");
  }

  const result: ArchiveResult = {
    productsArchived: 0,
    vendorsArchived: 0,
    resellersArchived: 0,
    customersArchived: 0,
    stockItemsArchived: 0,
  };

  // Get limits from plan (feature-gating returns object with limits property)
  const limits = (plan as any).limits || {
    products: 0,
    vendors: 0,
    resellers: 0,
    customers: 0,
    stockItems: 0
  };

  // Archive products beyond limit
  if (limits.products > 0) {
    const allProducts = await db
      .select({ id: products.id })
      .from(products)
      .where(
        and(
          eq(products.userId, userId),
          eq(products.isArchived, 0)
        )
      )
      .orderBy(desc(products.createdAt));

    if (allProducts.length > limits.products) {
      const toArchive = allProducts.slice(limits.products);
      const ids = toArchive.map(p => p.id);
      
      if (ids.length > 0) {
        await db
          .update(products)
          .set({ isArchived: 1 })
          .where(
            and(
              eq(products.userId, userId),
              sql`${products.id} = ANY(ARRAY[${sql.join(ids.map(id => sql`${id}`), sql`, `)}])`
            )
          );
        
        result.productsArchived = toArchive.length;
      }
    }
  }

  // Archive vendors beyond limit
  if (limits.vendors > 0) {
    const allVendors = await db
      .select({ id: vendors.id })
      .from(vendors)
      .where(
        and(
          eq(vendors.userId, userId),
          eq(vendors.isArchived, 0)
        )
      )
      .orderBy(desc(vendors.createdAt));

    if (allVendors.length > limits.vendors) {
      const toArchive = allVendors.slice(limits.vendors);
      const ids = toArchive.map(v => v.id);
      
      if (ids.length > 0) {
        await db
          .update(vendors)
          .set({ isArchived: 1 })
          .where(
            and(
              eq(vendors.userId, userId),
              sql`${vendors.id} = ANY(ARRAY[${sql.join(ids.map(id => sql`${id}`), sql`, `)}])`
            )
          );
        
        result.vendorsArchived = toArchive.length;
      }
    }
  }

  // Archive resellers beyond limit
  if (limits.resellers > 0) {
    const allResellers = await db
      .select({ id: resellers.id })
      .from(resellers)
      .where(
        and(
          eq(resellers.userId, userId),
          eq(resellers.isArchived, 0)
        )
      )
      .orderBy(desc(resellers.createdAt));

    if (allResellers.length > limits.resellers) {
      const toArchive = allResellers.slice(limits.resellers);
      const ids = toArchive.map(r => r.id);
      
      if (ids.length > 0) {
        await db
          .update(resellers)
          .set({ isArchived: 1 })
          .where(
            and(
              eq(resellers.userId, userId),
              sql`${resellers.id} = ANY(ARRAY[${sql.join(ids.map(id => sql`${id}`), sql`, `)}])`
            )
          );
        
        result.resellersArchived = toArchive.length;
      }
    }
  }

  // Archive customers beyond limit
  if (limits.customers > 0) {
    const allCustomers = await db
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(
          eq(customers.userId, userId),
          eq(customers.isArchived, 0)
        )
      )
      .orderBy(desc(customers.createdAt));

    if (allCustomers.length > limits.customers) {
      const toArchive = allCustomers.slice(limits.customers);
      const ids = toArchive.map(c => c.id);
      
      if (ids.length > 0) {
        await db
          .update(customers)
          .set({ isArchived: 1 })
          .where(
            and(
              eq(customers.userId, userId),
              sql`${customers.id} = ANY(ARRAY[${sql.join(ids.map(id => sql`${id}`), sql`, `)}])`
            )
          );
        
        result.customersArchived = toArchive.length;
      }
    }
  }

  // Stock items - no hard limit, but archive if user has no products
  // (orphaned stock items from deleted/archived products)
  const activeProducts = await db
    .select({ id: products.id })
    .from(products)
    .where(
      and(
        eq(products.userId, userId),
        eq(products.isArchived, 0)
      )
    );
  
  const activeProductIds = activeProducts.map(p => p.id);
  
  if (activeProductIds.length > 0) {
    // Archive stock items that don't belong to any active product
    const orphanedStock = await db
      .select({ id: stockItems.id })
      .from(stockItems)
      .where(
        and(
          eq(stockItems.userId, userId),
          eq(stockItems.isArchived, 0),
          sql`${stockItems.productId} NOT IN (${sql.join(activeProductIds.map(id => sql`${id}`), sql`, `)})`
        )
      );

    if (orphanedStock.length > 0) {
      const ids = orphanedStock.map(s => s.id);
      await db
        .update(stockItems)
        .set({ isArchived: 1 })
        .where(
          and(
            eq(stockItems.userId, userId),
            sql`${stockItems.id} = ANY(ARRAY[${sql.join(ids.map(id => sql`${id}`), sql`, `)}])`
          )
        );
      
      result.stockItemsArchived = orphanedStock.length;
    }
  }

  return result;
}

/**
 * Restore all archived data for a user
 * Called when user upgrades to a higher plan
 */
export async function restoreUserData(userId: number): Promise<ArchiveResult> {
  const result: ArchiveResult = {
    productsArchived: 0,
    vendorsArchived: 0,
    resellersArchived: 0,
    customersArchived: 0,
    stockItemsArchived: 0,
  };

  // Count and restore products
  const archivedProducts = await db
    .select({ id: products.id })
    .from(products)
    .where(
      and(
        eq(products.userId, userId),
        eq(products.isArchived, 1)
      )
    );
  
  if (archivedProducts.length > 0) {
    await db
      .update(products)
      .set({ isArchived: 0 })
      .where(
        and(
          eq(products.userId, userId),
          eq(products.isArchived, 1)
        )
      );
    result.productsArchived = archivedProducts.length;
  }

  // Count and restore vendors
  const archivedVendors = await db
    .select({ id: vendors.id })
    .from(vendors)
    .where(
      and(
        eq(vendors.userId, userId),
        eq(vendors.isArchived, 1)
      )
    );
  
  if (archivedVendors.length > 0) {
    await db
      .update(vendors)
      .set({ isArchived: 0 })
      .where(
        and(
          eq(vendors.userId, userId),
          eq(vendors.isArchived, 1)
        )
      );
    result.vendorsArchived = archivedVendors.length;
  }

  // Count and restore resellers
  const archivedResellers = await db
    .select({ id: resellers.id })
    .from(resellers)
    .where(
      and(
        eq(resellers.userId, userId),
        eq(resellers.isArchived, 1)
      )
    );
  
  if (archivedResellers.length > 0) {
    await db
      .update(resellers)
      .set({ isArchived: 0 })
      .where(
        and(
          eq(resellers.userId, userId),
          eq(resellers.isArchived, 1)
        )
      );
    result.resellersArchived = archivedResellers.length;
  }

  // Count and restore customers
  const archivedCustomers = await db
    .select({ id: customers.id })
    .from(customers)
    .where(
      and(
        eq(customers.userId, userId),
        eq(customers.isArchived, 1)
      )
    );
  
  if (archivedCustomers.length > 0) {
    await db
      .update(customers)
      .set({ isArchived: 0 })
      .where(
        and(
          eq(customers.userId, userId),
          eq(customers.isArchived, 1)
        )
      );
    result.customersArchived = archivedCustomers.length;
  }

  // Count and restore stock items
  const archivedStockItems = await db
    .select({ id: stockItems.id })
    .from(stockItems)
    .where(
      and(
        eq(stockItems.userId, userId),
        eq(stockItems.isArchived, 1)
      )
    );
  
  if (archivedStockItems.length > 0) {
    await db
      .update(stockItems)
      .set({ isArchived: 0 })
      .where(
        and(
          eq(stockItems.userId, userId),
          eq(stockItems.isArchived, 1)
        )
      );
    result.stockItemsArchived = archivedStockItems.length;
  }

  return result;
}

/**
 * Check and enforce grace period expiration
 * Should be run periodically (e.g., daily cron job)
 */
export async function enforceGracePeriod() {
  // Find users whose grace period has expired and have no active subscription
  const expiredUsers = await db
    .select()
    .from(users)
    .where(
      and(
        sql`${users.graceEndsAt} < NOW()`,
        eq(users.subscriptionTier, "free")
      )
    );

  const results = [];
  for (const user of expiredUsers) {
    try {
      const archiveResult = await archiveUserData(user.id);
      
      // Clear grace period after archiving
      await db
        .update(users)
        .set({ 
          graceEndsAt: null,
          isOnTrial: false 
        })
        .where(eq(users.id, user.id));

      results.push({
        userId: user.id,
        email: user.email,
        archived: archiveResult,
      });

      console.log(`Archived data for user ${user.id}:`, archiveResult);
    } catch (error) {
      console.error(`Failed to archive data for user ${user.id}:`, error);
    }
  }

  return results;
}
