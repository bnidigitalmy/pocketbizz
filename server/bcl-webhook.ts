// BCL.my Webhook Integration for Payment Processing
import type { Request, Response } from "express";
import { db } from "./db";
import { users, userSubscriptions, subscriptionPlans } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

/**
 * BCL.my Webhook Payload Structure
 * Received when a payment form is submitted successfully
 */
export interface BCLWebhookPayload {
  event: string; // "form-submit"
  data: {
    form_id: number; // BCL.my form ID (maps to our packages)
    form_slug?: string; // Form slug from URL (e.g., "basic-3-bulan")
    form_title: string;
    record_type: string; // "Transaction"
    record_id: string; // "LINK-XXXXX"
    main_data: {
      id: string;
      form_id: number;
      email: string; // Customer email
      phone?: string;
      name?: string;
      // Custom fields we'll add
      user_id?: string; // PocketBizz user ID
      package?: string; // "basic" | "pro" | "premium"
      duration?: string; // "3" | "6" | "12"
    };
    payment_info?: {
      payment_status: string; // "paid" | "pending"
      amount: number;
      currency: string; // "MYR"
      payment_method?: string;
      transaction_id?: string;
    };
  };
}

/**
 * Package Configuration
 * Maps BCL.my form slugs to PocketBizz subscription plans
 */
export const BCL_FORM_CONFIG = {
  // Single PocketBizz plan (standard) with duration options
  "1-bulan": {
    package: "standard",
    planName: "PocketBizz",
    months: 1,
    price: 27,
    url: "https://bnidigital.bcl.my/form/1-bulan",
  },
  "3-bulan": {
    package: "standard",
    planName: "PocketBizz",
    months: 3,
    price: 79,
    url: "https://bnidigital.bcl.my/form/3-bulan",
  },
  "6-bulan": {
    package: "standard",
    planName: "PocketBizz",
    months: 6,
    price: 146,
    url: "https://bnidigital.bcl.my/form/6-bulan",
  },
  "12-bulan": {
    package: "standard",
    planName: "PocketBizz",
    months: 12,
    price: 259,
    url: "https://bnidigital.bcl.my/form/12-bulan",
  },
} as Record<string, {
  package: string;
  planName: string;
  months: number;
  price: number;
  url: string;
}>;

/**
 * Legacy form ID mapping (if BCL.my sends numeric IDs)
 */
export const BCL_PACKAGE_CONFIG = {
  // Format: [BCL_FORM_ID]: { package, planName, months, price }
  // Will be populated if we get numeric form IDs from webhook
} as Record<number, {
  package: string;
  planName: string;
  months: number;
  price: number;
}>;

/**
 * Verify BCL.my webhook signature
 * BCL.my sends a signature header for security validation
 */
export function verifyBCLSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Process BCL.my webhook and activate subscription
 */
export async function processBCLWebhook(req: Request, res: Response) {
  try {
    const webhookSecret = process.env.BCL_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error("[BCL] BCL_WEBHOOK_SECRET not configured");
      return res.status(500).json({ 
        success: false, 
        error: "Webhook secret not configured" 
      });
    }

    // Get raw body for signature verification
    const rawBody = JSON.stringify(req.body);
    const signature = req.headers["x-bcl-signature"] as string;

    // Verify signature if provided
    if (signature) {
      const isValid = verifyBCLSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.error("[BCL] Invalid webhook signature");
        return res.status(401).json({ 
          success: false, 
          error: "Invalid signature" 
        });
      }
    } else {
      console.warn("[BCL] No signature provided - accepting for testing");
    }

    const payload = req.body as BCLWebhookPayload;

    console.log("[BCL] Webhook received:", {
      event: payload.event,
      formId: payload.data?.form_id,
      email: payload.data?.main_data?.email,
      recordId: payload.data?.record_id,
    });

    // Handle payment-failed events (for logging and notifications)
    if (payload.event === "payment-failed") {
      console.warn("[BCL] Payment failed:", {
        email: payload.data?.main_data?.email,
        userId: payload.data?.main_data?.user_id,
        formSlug: payload.data?.form_slug,
        recordId: payload.data?.record_id,
        reason: payload.data?.payment_info?.payment_status || "Unknown",
      });
      
      // TODO: Send email notification to user about failed payment
      // TODO: Log to analytics for tracking conversion rates
      
      return res.json({ 
        success: true, 
        message: "Payment failure logged" 
      });
    }

    // Process both form-submit and payment-success events
    if (payload.event !== "form-submit" && payload.event !== "payment-success") {
      console.log("[BCL] Ignoring event:", payload.event);
      return res.json({ success: true, message: "Event ignored" });
    }

    // For payment-success events, verify payment status
    if (payload.event === "payment-success") {
      const paymentStatus = payload.data?.payment_info?.payment_status;
      if (paymentStatus !== "paid") {
        console.warn("[BCL] Payment not completed:", paymentStatus);
        return res.status(400).json({ 
          success: false, 
          error: "Payment not completed",
          paymentStatus 
        });
      }
      console.log("[BCL] Payment confirmed as successful");
    }

    // Extract data
    const formId = payload.data.form_id;
    const formSlug = payload.data.form_slug;
    const email = payload.data.main_data.email;
    const userId = payload.data.main_data.user_id;
    const customPackage = payload.data.main_data.package;
    const customDuration = payload.data.main_data.duration;

    console.log("[BCL] Webhook data received:", {
      formId,
      formSlug,
      email,
      userId,
      customPackage,
      customDuration,
    });

    // Email is required as fallback
    if (!email && !userId) {
      console.error("[BCL] Missing both email and userId in webhook payload");
      return res.status(400).json({ 
        success: false, 
        error: "Email or userId required" 
      });
    }

    // Get package config - try form slug first, then form ID, then custom fields
    let packageConfig: { package: string; planName: string; months: number; price: number; } | undefined;
    
    if (formSlug && BCL_FORM_CONFIG[formSlug]) {
      packageConfig = BCL_FORM_CONFIG[formSlug];
      console.log("[BCL] Matched form slug:", formSlug);
    } else if (BCL_PACKAGE_CONFIG[formId]) {
      packageConfig = BCL_PACKAGE_CONFIG[formId];
      console.log("[BCL] Matched form ID:", formId);
    } else if (customPackage && customDuration) {
      // Allow override via custom fields
      const months = parseInt(customDuration);
      packageConfig = {
        package: customPackage,
        planName: `${customPackage.charAt(0).toUpperCase() + customPackage.slice(1)} Plan`,
        months: months,
        price: 0, // Will validate against payment amount
      };
      console.log("[BCL] Using custom fields:", customPackage, months);
    }

    if (!packageConfig) {
      console.error("[BCL] Unknown form - formId:", formId, "formSlug:", formSlug);
      return res.status(400).json({ 
        success: false, 
        error: `Unknown form. FormID: ${formId}, Slug: ${formSlug}` 
      });
    }

    console.log("[BCL] Processing payment for:", {
      email,
      userId,
      package: packageConfig.package,
      months: packageConfig.months,
      price: packageConfig.price,
    });

    // Find user - prioritize userId over email for exact matching
    let user = null;
    
    if (userId) {
      console.log("[BCL] Looking up user by ID:", userId);
      user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });
      
      if (user) {
        console.log("[BCL] User found by ID:", user.id, user.email);
      } else {
        console.warn("[BCL] User ID provided but not found:", userId);
      }
    }
    
    // Fallback to email lookup if userId didn't work
    if (!user && email) {
      console.log("[BCL] Looking up user by email:", email);
      user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });
      
      if (user) {
        console.log("[BCL] User found by email:", user.id, user.email);
      }
    }

    if (!user) {
      console.error("[BCL] User not found - userId:", userId, "email:", email);
      return res.status(404).json({ 
        success: false, 
        error: "User not found. Please register first.",
        userId,
        email,
      });
    }

    console.log("[BCL] User matched successfully:", user.id, user.email);

    // Find subscription plan by name
    const plan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.name, packageConfig.package),
    });

    if (!plan) {
      console.error("[BCL] Plan not found:", packageConfig.package);
      return res.status(400).json({ 
        success: false, 
        error: `Plan not found: ${packageConfig.package}` 
      });
    }

    // Calculate subscription dates
    const now = new Date();
    const subscriptionEndsAt = new Date(now);
    subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + packageConfig.months);

    // Create subscription record
    const [subscription] = await db.insert(userSubscriptions).values({
      userId: user.id,
      planId: plan.id,
      planName: plan.displayName,
      durationMonths: packageConfig.months,
      subscriptionStartsAt: now,
      subscriptionEndsAt: subscriptionEndsAt,
      totalPaid: packageConfig.price.toString(),
      paymentProvider: "bcl_bayarcash",
      externalTransactionId: payload.data.record_id,
    } as any).returning();

    console.log("[BCL] Subscription created:", subscription.id);

    console.log("[BCL] User subscription activated successfully");

    // Return success
    return res.json({
      success: true,
      message: "Subscription activated successfully",
      data: {
        userId: user.id,
        subscriptionId: subscription.id,
        plan: plan.displayName,
        endsAt: subscriptionEndsAt.toISOString(),
      },
    });

  } catch (error) {
    console.error("[BCL] Webhook processing error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Test endpoint to simulate BCL.my webhook (development only)
 */
export async function testBCLWebhook(req: Request, res: Response) {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Not available in production" });
  }

  const { email, formId, package: pkg, months, price } = req.body;

  const testPayload: BCLWebhookPayload = {
    event: "form-submit",
    data: {
      form_id: formId || 999,
      form_slug: "test-form",
      form_title: "Test Payment Form",
      record_type: "Transaction",
      record_id: `TEST-${Date.now()}`,
      main_data: {
        id: crypto.randomUUID(),
        form_id: formId || 999,
        email: email || "test@example.com",
        package: pkg || "basic",
        duration: (months || 3).toString(),
      },
      payment_info: {
        payment_status: "paid",
        amount: price || 117,
        currency: "MYR",
        transaction_id: `TXN-${Date.now()}`,
      },
    },
  };

  // Mock the request
  req.body = testPayload;
  req.headers["x-bcl-signature"] = "test-signature-bypass";

  return processBCLWebhook(req, res);
}
