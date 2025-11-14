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
      payer_email: string;
      payer_name?: string;
      payer_telephone_number?: string;
      order_number: string;
      amount: string; // comes as string (e.g. "27.00")
      is_paid: boolean | number | string; // 1 | true | "1"
      status?: string; // completed | paid | failed
      payment_channel?: string; // FPX, etc
      currency?: string; // MYR
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

    // BCL sends nested structure with main_data
    const webhookData = payload.data || payload;
    const mainData = webhookData.main_data || {};
    const statusStr = String((mainData as any).status ?? "").toLowerCase();

    console.log("[BCL] Webhook received:", {
      event: payload.event,
      recordId: webhookData.record_id,
      formTitle: webhookData.form_title,
      email: mainData.payer_email,
      orderNumber: mainData.order_number,
      isPaid: mainData.is_paid,
      status: mainData.status,
    });

    // Optional debug snapshot for first live verification (enable with BCL_DEBUG_LOG=1)
    if (process.env.BCL_DEBUG_LOG === '1') {
      const snapshot = {
        topLevelKeys: Object.keys(webhookData),
        mainDataKeys: Object.keys(mainData),
        recordId: webhookData.record_id,
        formTitle: webhookData.form_title,
        payerEmail: mainData.payer_email,
        payerName: mainData.payer_name,
        payerPhone: mainData.payer_telephone_number,
        orderNumber: mainData.order_number,
        amount: mainData.amount,
        isPaid: mainData.is_paid,
        status: mainData.status,
        paymentChannel: mainData.payment_channel,
      };
      console.log("[BCL] Payload snapshot:", JSON.stringify(snapshot, null, 2));
    }

    // Handle payment-failed events
    if (payload.event === "payment-failed" || statusStr === "failed") {
      console.warn("[BCL] Payment failed:", {
        email: mainData.payer_email,
        recordId: webhookData.record_id,
        status: mainData.status,
      });
      return res.json({ success: true, message: "Payment failure logged" });
    }

    // Process payment-success events only
    if (payload.event !== "payment-success" && payload.event !== "form-submit") {
      console.log("[BCL] Ignoring event:", payload.event);
      return res.json({ success: true, message: "Event ignored" });
    }

    // Verify payment is actually paid (multiple representations)
    const rawStatus = statusStr;
    const rawIsPaid = String((mainData as any).is_paid ?? "").toLowerCase();
    const isPaid = ["1","true","paid","completed"].includes(rawIsPaid) || ["paid","completed"].includes(rawStatus);
    
    if (!isPaid && payload.event !== "form-submit") {
      console.warn("[BCL] Payment not confirmed:", {
        isPaid: mainData.is_paid,
        status: mainData.status,
        event: payload.event,
      });
      return res.status(400).json({ 
        success: false, 
        error: "Payment not confirmed",
        isPaid: mainData.is_paid,
        status: mainData.status,
      });
    }

    console.log("[BCL] Payment confirmed as successful");

    // Extract data from BCL's main_data (fallback to legacy keys if any)
    const email = mainData.payer_email || (mainData as any).email;
    const name = mainData.payer_name;
    const phone = mainData.payer_telephone_number;
    const amount = parseFloat(mainData.amount || "0");
    const orderNumber = mainData.order_number || webhookData.record_id;
    const currency = mainData.currency || "MYR";
    const transactionId = orderNumber;

    console.log("[BCL] Webhook data extracted:", {
      email,
      name,
      phone,
      amount,
      currency,
      orderNumber,
      transactionId,
    });

    // Email is required (primary identifier)
    if (!email) {
      console.error("[BCL] Missing email in webhook payload");
      return res.status(400).json({ 
        success: false, 
        error: "Email is required",
        hint: "Webhook payload must include email in main_data"
      });
    }

    // Determine package based on form_title or amount
    let packageConfig: { package: string; planName: string; months: number; price: number; } | undefined;
    
    // Try to extract duration from form_title (e.g., "Langganan 3 Bulan" → 3)
    const formTitle = webhookData.form_title || "";
    const durationMatch = formTitle.match(/(\d+)\s*bulan/i);
    
    if (durationMatch) {
      const months = parseInt(durationMatch[1]);
      const formKey = `${months}-bulan`;
      packageConfig = BCL_FORM_CONFIG[formKey];
      console.log("[BCL] Matched by form title:", { formTitle, months, formKey });
    }
    
    // Fallback: Match by amount if form title didn't work
    if (!packageConfig && amount > 0) {
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
      paymentMethod: mainData.payment_channel || "FPX",
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
        payer_email: email || "test@example.com",
        payer_name: "Test User",
        payer_telephone_number: "0123456789",
        order_number: `TEST-${Date.now()}`,
        amount: String(price || 117),
        is_paid: 1,
        status: "completed",
        payment_channel: "FPX",
        currency: "MYR",
      },
    },
  };

  // Mock the request
  req.body = testPayload;
  req.headers["x-bcl-signature"] = "test-signature-bypass";

  return processBCLWebhook(req, res);
}
