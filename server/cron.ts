/**
 * Scheduled Tasks (Cron Jobs)
 * 
 * This module handles periodic background tasks for PocketBizz.
 * In production, these should be triggered by external cron services like:
 * - Railway Cron Jobs
 * - GitHub Actions scheduled workflows
 * - Vercel Cron
 * - Or internal node-cron for self-hosted deployments
 */

import { enforceGracePeriod } from "./archiving";
import { processBCLWebhook, testBCLWebhook } from "./bcl-webhook";
import { storage } from "./storage";
import { db } from "@db";
import { bookings, stockItems } from "@shared/schema";
import { eq, and, lte, gte, sql } from "drizzle-orm";

/**
 * Daily task to check and enforce grace period expiration
 * Archives data for users whose grace period has ended
 * 
 * Recommended schedule: Run daily at 2 AM server time
 * Cron expression: 0 2 * * *
 */
export async function runDailyGracePeriodCheck() {
  console.log('[CRON] Starting daily grace period check...');
  
  try {
    const results = await enforceGracePeriod();
    
    console.log(`[CRON] Grace period check complete. Processed ${results.length} users.`);
    
    if (results.length > 0) {
      console.log('[CRON] Archive summary:');
      results.forEach(r => {
        console.log(`  - User ${r.userId} (${r.email}):`, r.archived);
      });
    }
    
    return {
      success: true,
      processed: results.length,
      results,
    };
  } catch (error) {
    console.error('[CRON] Grace period check failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Daily reminder notifications
 * Sends reminders for upcoming bookings, low stock, etc.
 * 
 * Recommended schedule: Run daily at 9 AM server time
 * Cron expression: 0 9 * * *
 */
export async function runDailyReminders() {
  console.log('[CRON] Starting daily reminders...');
  
  try {
    let notificationCount = 0;

    // Get all active users (not suspended)
    const users = await db.query.users.findMany({
      where: (users, { eq }) => eq(users.suspended, 0),
    });

    for (const user of users) {
      // 1. Check for bookings tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      const upcomingBookings = await db.select()
        .from(bookings)
        .where(and(
          eq(bookings.userId, user.id),
          gte(bookings.pickupDate, tomorrow),
          lte(bookings.pickupDate, dayAfterTomorrow)
        ));

      if (upcomingBookings.length > 0) {
        await storage.createNotification({
          userId: user.id,
          type: 'reminder',
          priority: 'high',
          title: 'Pengingat: Tempahan Esok',
          message: `Anda ada ${upcomingBookings.length} tempahan untuk esok (${tomorrow.toLocaleDateString('ms-MY')})`,
          actionUrl: '/bookings',
          metadata: { bookingCount: upcomingBookings.length, date: tomorrow.toISOString() },
        });
        notificationCount++;
      }

      // 2. Check for low stock items
      const lowStockItems = await db.select()
        .from(stockItems)
        .where(and(
          eq(stockItems.userId, user.id),
          sql`${stockItems.currentQuantity}::decimal <= ${stockItems.lowStockThreshold}::decimal`
        ))
        .limit(5);

      if (lowStockItems.length > 0) {
        const itemNames = lowStockItems.map(item => item.name).join(', ');
        await storage.createNotification({
          userId: user.id,
          type: 'stock',
          priority: 'urgent',
          title: 'Amaran: Stok Rendah',
          message: `${lowStockItems.length} bahan stok rendah: ${itemNames}`,
          actionUrl: '/stock',
          metadata: { stockCount: lowStockItems.length },
        });
        notificationCount++;
      }

      // 3. Check for bookings today that need to be started
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);

      const todayBookings = await db.select()
        .from(bookings)
        .where(and(
          eq(bookings.userId, user.id),
          gte(bookings.pickupDate, today),
          lte(bookings.pickupDate, endOfToday),
          eq(bookings.status, 'pending' as any)
        ));

      if (todayBookings.length > 0) {
        await storage.createNotification({
          userId: user.id,
          type: 'reminder',
          priority: 'high',
          title: 'Pengingat: Order Hari Ini',
          message: `${todayBookings.length} tempahan perlu siap hari ini!`,
          actionUrl: '/bookings',
          metadata: { bookingCount: todayBookings.length },
        });
        notificationCount++;
      }
    }

    console.log(`[CRON] Daily reminders complete. Created ${notificationCount} notifications for ${users.length} users.`);
    
    return {
      success: true,
      userCount: users.length,
      notificationCount,
    };
  } catch (error) {
    console.error('[CRON] Daily reminders failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Manual trigger endpoint for testing
 * Should be protected in production (admin-only or with secret token)
 */
export function registerCronEndpoints(app: any) {
  // Manual trigger for grace period enforcement (for testing/admin)
  app.post("/api/cron/enforce-grace-period", async (req: any, res: any) => {
    // Authentication: Check for secret token
    const cronSecret = req.headers['x-cron-secret'];
    
    if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
      console.warn('[CRON] Unauthorized access attempt to enforce-grace-period endpoint');
      return res.status(401).json({ error: "Unauthorized - Invalid or missing cron secret" });
    }
    
    try {
      const result = await runDailyGracePeriodCheck();
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        error: "Failed to run grace period check",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Daily reminders endpoint
  app.post("/api/cron/daily-reminders", async (req: any, res: any) => {
    const cronSecret = req.headers['x-cron-secret'];
    
    if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
      console.warn('[CRON] Unauthorized access attempt to daily-reminders endpoint');
      return res.status(401).json({ error: "Unauthorized - Invalid or missing cron secret" });
    }
    
    try {
      const result = await runDailyReminders();
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        error: "Failed to run daily reminders",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Health check endpoint for cron monitoring
  app.get("/api/cron/health", (req: any, res: any) => {
    res.json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      jobs: [
        {
          name: 'enforce-grace-period',
          schedule: '0 2 * * *',
          description: 'Daily check for expired grace periods and archive excess data'
        },
        {
          name: 'daily-reminders',
          schedule: '0 9 * * *',
          description: 'Send daily reminder notifications for bookings, low stock, etc.'
        }
      ]
    });
  });

  // BCL.my Payment Webhook
  // Receives payment notifications from BCL.my payment forms
  app.post("/api/webhooks/bcl", processBCLWebhook);

  // Test endpoint for BCL webhook (development only)
  app.post("/api/webhooks/bcl/test", testBCLWebhook);
}

// For self-hosted deployments using node-cron
// Uncomment this section if you want built-in cron scheduling
/*
import cron from 'node-cron';

export function startCronJobs() {
  // Run daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    await runDailyGracePeriodCheck();
  });
  
  console.log('[CRON] Scheduled jobs initialized');
}
*/
