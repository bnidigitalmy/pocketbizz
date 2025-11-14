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

    const payload = req.body;

    // BCL sends data in flat structure under `data`, not nested in main_data/payment_info
    const webhookData = payload.data || {};

    console.log("[BCL] Webhook received:", {
      event: payload.event,
      orderNumber: webhookData.order_number,
      email: webhookData.payer_email,
      status: webhookData.status,
      isPaid: webhookData.is_paid,
    });

    // Optional debug snapshot for first live verification (enable with BCL_DEBUG_LOG=1)
    if (process.env.BCL_DEBUG_LOG === '1') {
      const snapshot = {
        allDataKeys: Object.keys(webhookData),
        paymentChannel: webhookData.payment_channel,
        amount: webhookData.amount,
        currency: webhookData.currency,
        status: webhookData.status,
        isPaid: webhookData.is_paid,
        email: webhookData.payer_email,
        orderNumber: webhookData.order_number,
      };
      console.log("[BCL] Payload snapshot:", JSON.stringify(snapshot, null, 2));
    }

    // Handle payment-failed events
    if (payload.event === "payment-failed" || webhookData.status === "failed") {
      console.warn("[BCL] Payment failed:", {
        email: webhookData.payer_email,
        orderNumber: webhookData.order_number,
        status: webhookData.status,
      });
      
      return res.json({ 
        success: true, 
        message: "Payment failure logged" 
      });
    }

    // Process payment-success events only
    if (payload.event !== "payment-success" && payload.event !== "form-submit") {
      console.log("[BCL] Ignoring event:", payload.event);
      return res.json({ success: true, message: "Event ignored" });
    }

    // Verify payment is actually paid
    const isPaid = webhookData.is_paid === true || webhookData.is_paid === 1 || webhookData.is_paid === "1";
    const isCompleted = webhookData.status === "completed" || webhookData.status === "success";
    
    if (!isPaid && !isCompleted) {
      console.warn("[BCL] Payment not confirmed:", {
        isPaid: webhookData.is_paid,
        status: webhookData.status,
      });
      return res.status(400).json({ 
        success: false, 
        error: "Payment not confirmed",
        status: webhookData.status,
        isPaid: webhookData.is_paid,
      });
    }

    console.log("[BCL] Payment confirmed as successful");

    // Extract data from BCL's actual format
    const email = webhookData.payer_email;
    const name = webhookData.payer_name;
    const phone = webhookData.payer_telephone_number;
    const amount = parseFloat(webhookData.amount || "0");
    const orderNumber = webhookData.order_number;
    const currency = webhookData.currency || "MYR";

    console.log("[BCL] Webhook data extracted:", {
      email,
      name,
      phone,
      amount,
      currency,
      orderNumber,
    });

    // Email is required (primary identifier)
    if (!email) {
      console.error("[BCL] Missing email in webhook payload");
      return res.status(400).json({ 
        success: false, 
        error: "Email is required",
        hint: "Webhook payload must include payer_email field"
      });
    }

    // Determine package based on amount paid (since BCL doesn't send form_slug)
    let packageConfig: { package: string; planName: string; months: number; price: number; } | undefined;
    
    // Match by amount (with small tolerance for rounding)
    const amountTolerance = 2; // RM2 tolerance
    if (Math.abs(amount - 27) <= amountTolerance) {
      packageConfig = BCL_FORM_CONFIG["1-bulan"];
      console.log("[BCL] Matched amount RM", amount, "to 1-month plan");
    } else if (Math.abs(amount - 79) <= amountTolerance) {
      packageConfig = BCL_FORM_CONFIG["3-bulan"];
      console.log("[BCL] Matched amount RM", amount, "to 3-month plan");
    } else if (Math.abs(amount - 146) <= amountTolerance) {
      packageConfig = BCL_FORM_CONFIG["6-bulan"];
      console.log("[BCL] Matched amount RM", amount, "to 6-month plan");
    } else if (Math.abs(amount - 259) <= amountTolerance) {
      packageConfig = BCL_FORM_CONFIG["12-bulan"];
      console.log("[BCL] Matched amount RM", amount, "to 12-month plan");
    }

    if (!packageConfig) {
      console.error("[BCL] Could not determine package from amount:", amount);
      console.error("[BCL] Expected amounts: RM27, RM79, RM146, or RM259");
      return res.status(400).json({ 
        success: false, 
        error: `Unknown package amount: RM${amount}. Expected: RM27, RM79, RM146, or RM259` 
      });
    }

    console.log("[BCL] Processing payment for:", {
      email,
      package: packageConfig.package,
      months: packageConfig.months,
      price: packageConfig.price,
    });

    // Find user by email (BCL forms don't support hidden fields, so email is primary identifier)
    console.log("[BCL] Looking up user by email:", email);
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      console.error("[BCL] User not found with email:", email);
      return res.status(404).json({ 
        success: false, 
        error: "User not found. Please register at PocketBizz first with this email address.",
        email,
        hint: "Make sure you register using the same email address before making payment"
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
      totalPaid: amount.toString(), // Use actual amount paid from webhook
      paymentProvider: "bcl_bayarcash",
      paymentMethod: webhookData.payment_channel || "FPX",
      externalTransactionId: orderNumber, // Use order_number from webhook (e.g., "LINK-85557")
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
