// BCL.my Webhook Integration for Payment Processing
import type { Request, Response } from "express";
import { db } from "./db";
import { users, userSubscriptions, subscriptionPlans } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { 
  activateSubscription, 
  extractPackageFromFormTitle,
  extractPackageFromAmount,
  getPackageConfig,
  type PackageSlug,
} from "./subscription-service";

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
 * ENHANCED: Strict validation, idempotency, trial termination, billing audit
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

    // Get raw body for signature verification (prefer rawBody captured by express.json verify)
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const signature = req.headers["x-bcl-signature"] as string;

    // Lightweight diagnostics (safe): do not log secrets, just presence/length
    console.log("[BCL] Incoming webhook: ", {
      hasSignature: Boolean(signature),
      rawLength: typeof rawBody === 'string' ? rawBody.length : 0,
      env: process.env.NODE_ENV,
    });

    // STRICT: Signature is REQUIRED in production
    if (process.env.NODE_ENV === "production" && !signature) {
      console.error("[BCL] Missing signature in production environment");
      return res.status(401).json({ 
        success: false, 
        error: "Signature required in production" 
      });
    }

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
      console.log("[BCL] ✓ Signature verified");
    } else {
      console.warn("[BCL] ⚠️  No signature provided (dev/test mode only)");
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
      amount: mainData.amount,
      isPaid: mainData.is_paid,
      status: mainData.status,
    });

    // Handle payment-failed events
    if (payload.event === "payment-failed" || statusStr === "failed") {
      console.warn("[BCL] Payment failed:", {
        email: mainData.payer_email,
        recordId: webhookData.record_id,
        status: mainData.status,
      });
      return res.json({ success: true, message: "Payment failure logged" });
    }

    // Accept either explicit payment-success or form-submit that is paid
    const isPaymentEvent =
      payload.event === "payment-success" || payload.event === "form-submit";
    if (!isPaymentEvent) {
      console.log("[BCL] Ignoring unrelated event:", payload.event);
      return res.json({ success: true, message: "Event ignored (not a payment event)" });
    }

    // STRICT: Verify payment status is actually completed/paid
    const rawIsPaid = String((mainData as any).is_paid ?? "").toLowerCase();
    const isPaid = ["1","true","paid","completed"].includes(rawIsPaid) || ["paid","completed"].includes(statusStr);
    
    if (!isPaid) {
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

    console.log("[BCL] ✓ Payment confirmed as successful");

    // Extract data from BCL's main_data
    const email = mainData.payer_email || (mainData as any).email;
    const name = mainData.payer_name;
    const phone = mainData.payer_telephone_number;
    const amount = parseFloat(mainData.amount || "0");
    const orderNumber = mainData.order_number || webhookData.record_id;
    const currency = mainData.currency || "MYR";
    const paymentChannel = mainData.payment_channel || "FPX";
    const transactionId = orderNumber;
    const formTitle = webhookData.form_title || "";

    // STRICT: Validate currency
    if (currency !== "MYR") {
      console.error("[BCL] Invalid currency:", currency);
      return res.status(400).json({
        success: false,
        error: `Invalid currency: ${currency}. Only MYR accepted.`,
      });
    }

    // Email is required (primary identifier)
    if (!email) {
      console.error("[BCL] Missing email in webhook payload");
      return res.status(400).json({ 
        success: false, 
        error: "Email is required",
        hint: "Webhook payload must include email in main_data"
      });
    }

    console.log("[BCL] Webhook data extracted:", {
      email,
      name,
      phone,
      amount,
      currency,
      orderNumber,
      transactionId,
      formTitle,
      paymentChannel,
    });

    // Determine package slug (STRICT: form_title first, then exact amount match)
    let packageSlug = extractPackageFromFormTitle(formTitle);
    
    if (!packageSlug) {
      console.log("[BCL] Could not extract from form_title, trying amount match...");
      packageSlug = extractPackageFromAmount(amount);
    }

    if (!packageSlug) {
      console.error("[BCL] Could not determine package from form_title or amount:", {
        formTitle,
        amount,
      });
      return res.status(400).json({ 
        success: false, 
        error: `Unable to determine package. Form: "${formTitle}", Amount: RM${amount}`,
        hint: "Expected amounts: RM27, RM79, RM146, or RM259"
      });
    }

    const packageConfig = getPackageConfig(packageSlug);
    console.log("[BCL] ✓ Package identified:", {
      slug: packageSlug,
      months: packageConfig.months,
      price: packageConfig.price,
    });

    // Activate or extend subscription using service layer
    console.log("[BCL] Activating subscription via service layer...");
    const result = await activateSubscription({
      email,
      packageSlug,
      amount,
      transactionId,
      paymentMethod: paymentChannel,
      paymentChannel,
      activationSource: "webhook_bcl",
      metadata: {
        formTitle,
        recordId: webhookData.record_id,
        payerName: name,
        payerPhone: phone,
        webhookEvent: payload.event,
      },
    });

    console.log("[BCL] ✓ Subscription activation result:", {
      isNewSubscription: result.isNewSubscription,
      wasOnTrial: result.wasOnTrial,
      userId: result.user.id,
      subscriptionId: result.subscription.id,
      previousEndsAt: result.previousEndsAt,
      newEndsAt: result.newEndsAt,
      extendedMonths: result.extendedMonths,
    });

    // Return enhanced response
    return res.json({
      success: true,
      message: result.message,
      data: {
        userId: result.user.id,
        email: result.user.email,
        subscriptionId: result.subscription.id,
        plan: packageConfig.planName,
        isNewSubscription: result.isNewSubscription,
        wasOnTrial: result.wasOnTrial,
        previousEndsAt: result.previousEndsAt?.toISOString(),
        newEndsAt: result.newEndsAt.toISOString(),
        extendedMonths: result.extendedMonths,
        totalMonths: result.subscription.durationMonths,
      },
    });

  } catch (error) {
    console.error("[BCL] Webhook processing error:", error);
    
    // Enhanced error logging
    if (error instanceof Error) {
      console.error("[BCL] Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    
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

  const { email, months, amount } = req.body;
  const packageSlug = `${months || 3}-bulan` as PackageSlug;

  const testPayload: BCLWebhookPayload = {
    event: "payment-success",
    data: {
      form_id: 999,
      form_slug: packageSlug,
      form_title: `Langganan ${months || 3} Bulan`,
      record_type: "Transaction",
      record_id: `TEST-${Date.now()}`,
      main_data: {
        id: crypto.randomUUID(),
        form_id: 999,
        payer_email: email || "test@example.com",
        payer_name: "Test User",
        payer_telephone_number: "0123456789",
        order_number: `TEST-${Date.now()}`,
        amount: String(amount || 79),
        is_paid: "1",
        status: "completed",
        payment_channel: "FPX",
        currency: "MYR",
      },
    },
  };

  // Mock the request
  req.body = testPayload;

  return processBCLWebhook(req, res);
}

/**
 * Test endpoint to simulate a SIGNED BCL.my webhook (development only)
 * This computes the HMAC signature using `BCL_WEBHOOK_SECRET` and calls
 * `processBCLWebhook` with the `x-bcl-signature` header attached.
 */
export async function testBCLWebhookSigned(req: Request, res: Response) {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Not available in production" });
  }

  const webhookSecret = process.env.BCL_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return res.status(500).json({ error: "BCL_WEBHOOK_SECRET not configured" });
  }

  const { email, months, amount } = req.body;
  const packageSlug = `${months || 3}-bulan` as PackageSlug;

  const payload: BCLWebhookPayload = {
    event: "payment-success",
    data: {
      form_id: 999,
      form_slug: packageSlug,
      form_title: `Langganan ${months || 3} Bulan`,
      record_type: "Transaction",
      record_id: `TEST-${Date.now()}`,
      main_data: {
        id: crypto.randomUUID(),
        form_id: 999,
        payer_email: email || "test@example.com",
        payer_name: "Test User",
        payer_telephone_number: "0123456789",
        order_number: `TEST-${Date.now()}`,
        amount: String(amount || 79),
        is_paid: "1",
        status: "completed",
        payment_channel: "FPX",
        currency: "MYR",
      },
    },
  };

  // Assign body and attach header
  req.body = payload;
  const raw = JSON.stringify(payload);
  const sig = crypto.createHmac("sha256", webhookSecret).update(raw).digest("hex");
  // set header
  (req.headers as any)["x-bcl-signature"] = sig;

  return processBCLWebhook(req, res);
}
