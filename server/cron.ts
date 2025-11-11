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
