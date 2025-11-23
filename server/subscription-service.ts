/**
 * Subscription Service Layer
 * 
 * Handles subscription activation, extension, and lifecycle management.
 * Ensures idempotency, trial termination, and billing audit trail.
 */

import { db } from "./db";
import { 
  users, 
  userSubscriptions, 
  subscriptionPlans, 
  billingHistory,
  type User,
  type UserSubscription,
  type SubscriptionPlan,
  type InsertUserSubscription,
  type InsertBillingHistory,
} from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

export interface ActivateSubscriptionParams {
  email: string;
  packageSlug: string; // "1-bulan", "3-bulan", "6-bulan", "12-bulan"
  amount: number;
  transactionId: string;
  paymentMethod?: string;
  paymentChannel?: string;
  activationSource?: string;
  metadata?: any;
}

export interface ActivateSubscriptionResult {
  success: boolean;
  isNewSubscription: boolean;
  wasOnTrial: boolean;
  user: User;
  subscription: UserSubscription;
  previousEndsAt?: Date;
  newEndsAt: Date;
  extendedMonths: number;
  message: string;
}

// Package configuration with strict pricing
export const SUBSCRIPTION_PACKAGES = {
  "1-bulan": { months: 1, price: 27, planName: "PocketBizz" },
  "3-bulan": { months: 3, price: 79, planName: "PocketBizz" },
  "6-bulan": { months: 6, price: 146, planName: "PocketBizz" },
  "12-bulan": { months: 12, price: 259, planName: "PocketBizz" },
} as const;

export type PackageSlug = keyof typeof SUBSCRIPTION_PACKAGES;

/**
 * Activate or extend user subscription with full idempotency and audit trail
 */
export async function activateSubscription(
  params: ActivateSubscriptionParams
): Promise<ActivateSubscriptionResult> {
  
  const packageConfig = SUBSCRIPTION_PACKAGES[params.packageSlug as PackageSlug];
  
  if (!packageConfig) {
    throw new Error(`Invalid package slug: ${params.packageSlug}`);
  }

  // Amount validation with tolerance for BCL.my discounts
  // Allow amounts that are <= expected price (discounts/promos OK)
  // But reject if amount is MORE than expected (fraud protection)
  if (params.amount > packageConfig.price + 0.01) {
    throw new Error(
      `Amount exceeds package price: expected max RM${packageConfig.price}, got RM${params.amount}`
    );
  }
  
  // Log if discounted payment detected
  if (params.amount < packageConfig.price - 0.01) {
    console.log(`[Subscription] 💰 Discounted payment detected: RM${params.amount} (normal: RM${packageConfig.price})`);
  }

  return await db.transaction(async (tx) => {
    // 1. Check for duplicate transaction (idempotency)
    const existingSubscription = await tx
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.externalTransactionId, params.transactionId))
      .limit(1);

    if (existingSubscription.length > 0) {
      // Already processed - return existing result
      const user = await tx.select().from(users).where(eq(users.id, existingSubscription[0].userId)).limit(1);
      
      return {
        success: true,
        isNewSubscription: false,
        wasOnTrial: false,
        user: user[0],
        subscription: existingSubscription[0],
        newEndsAt: new Date(existingSubscription[0].subscriptionEndsAt),
        extendedMonths: existingSubscription[0].durationMonths,
        message: "Transaction already processed (idempotent response)",
      };
    }

    // 2. Find user by email
    const [user] = await tx
      .select()
      .from(users)
      .where(eq(users.email, params.email))
      .limit(1);

    if (!user) {
      throw new Error(
        `User not found with email: ${params.email}. Please register first.`
      );
    }

    // 3. Find subscription plan
    const [plan] = await tx
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.name, "standard"))
      .limit(1);

    if (!plan) {
      throw new Error("Subscription plan 'standard' not found in database");
    }

    // 4. Check for existing active subscription
    const now = new Date();
    const [activeSubscription] = await tx
      .select()
      .from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.userId, user.id),
          eq(userSubscriptions.status, "active"),
          sql`${userSubscriptions.subscriptionEndsAt} > ${now}`
        )
      )
      .orderBy(userSubscriptions.subscriptionEndsAt)
      .limit(1);

    let newSubscription: UserSubscription;
    let isNewSubscription = true;
    let previousEndsAt: Date | undefined;

    if (activeSubscription) {
      // EXTEND existing subscription
      isNewSubscription = false;
      previousEndsAt = new Date(activeSubscription.subscriptionEndsAt);
      
      const extendedEndsAt = new Date(activeSubscription.subscriptionEndsAt);
      extendedEndsAt.setMonth(extendedEndsAt.getMonth() + packageConfig.months);

      // Update existing subscription end date
      const [updated] = await tx
        .update(userSubscriptions)
        .set({
          subscriptionEndsAt: extendedEndsAt,
          durationMonths: activeSubscription.durationMonths + packageConfig.months,
          updatedAt: now,
        })
        .where(eq(userSubscriptions.id, activeSubscription.id))
        .returning();

      // Also create new subscription record linked to previous (for audit trail)
      const [newRecord] = await tx
        .insert(userSubscriptions)
        .values({
          userId: user.id,
          planId: plan.id,
          planName: packageConfig.planName,
          status: "superseded", // Mark as superseded/replaced since it extended existing subscription
          durationMonths: packageConfig.months,
          subscriptionStartsAt: previousEndsAt, // Start where old ended
          subscriptionEndsAt: extendedEndsAt,
          totalPaid: params.amount.toString(),
          paymentProvider: "bcl_bayarcash",
          paymentMethod: params.paymentChannel || params.paymentMethod || "FPX",
          externalTransactionId: params.transactionId,
          activationSource: params.activationSource || "webhook_bcl",
          previousSubscriptionId: activeSubscription.id,
          metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        } as any)
        .returning();

      newSubscription = updated;
    } else {
      // CREATE first subscription
      const subscriptionStartsAt = now;
      const subscriptionEndsAt = new Date(now);
      subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + packageConfig.months);

      const [created] = await tx
        .insert(userSubscriptions)
        .values({
          userId: user.id,
          planId: plan.id,
          planName: packageConfig.planName,
          status: "active",
          durationMonths: packageConfig.months,
          subscriptionStartsAt,
          subscriptionEndsAt,
          totalPaid: params.amount.toString(),
          paymentProvider: "bcl_bayarcash",
          paymentMethod: params.paymentChannel || params.paymentMethod || "FPX",
          externalTransactionId: params.transactionId,
          activationSource: params.activationSource || "webhook_bcl",
          metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        } as any)
        .returning();

      newSubscription = created;
    }

    // 5. Terminate trial if user is on trial
    const wasOnTrial = user.isOnTrial === 1;
    if (wasOnTrial) {
      await tx
        .update(users)
        .set({ 
          isOnTrial: 0,
          updatedAt: now,
        })
        .where(eq(users.id, user.id));
    }

    // 6. Create billing history record
    await tx.insert(billingHistory).values({
      userId: user.id,
      subscriptionId: newSubscription.id,
      amount: params.amount.toString(),
      currency: "MYR",
      status: "succeeded",
      paymentMethod: params.paymentChannel || params.paymentMethod || "FPX",
      description: `Subscription payment - ${packageConfig.months} month${packageConfig.months > 1 ? 's' : ''}`,
      toyyibpayTransactionId: params.transactionId,
      paidAt: now,
    } as any);

    return {
      success: true,
      isNewSubscription,
      wasOnTrial,
      user,
      subscription: newSubscription,
      previousEndsAt,
      newEndsAt: new Date(newSubscription.subscriptionEndsAt),
      extendedMonths: packageConfig.months,
      message: isNewSubscription 
        ? `Subscription activated successfully for ${packageConfig.months} month${packageConfig.months > 1 ? 's' : ''}`
        : `Subscription extended by ${packageConfig.months} month${packageConfig.months > 1 ? 's' : ''}`,
    };
  });
}

/**
 * Validate package slug and get configuration
 */
export function getPackageConfig(slug: string) {
  const config = SUBSCRIPTION_PACKAGES[slug as PackageSlug];
  if (!config) {
    throw new Error(`Invalid package slug: ${slug}. Valid options: ${Object.keys(SUBSCRIPTION_PACKAGES).join(', ')}`);
  }
  return config;
}

/**
 * Determine package from form title (BCL.my webhook)
 */
export function extractPackageFromFormTitle(formTitle: string): PackageSlug | null {
  const match = formTitle.match(/(\d+)\s*bulan/i);
  if (match) {
    const months = parseInt(match[1]);
    const slug = `${months}-bulan` as PackageSlug;
    if (SUBSCRIPTION_PACKAGES[slug]) {
      return slug;
    }
  }
  return null;
}

/**
 * Determine package from amount (fallback, less reliable)
 */
export function extractPackageFromAmount(amount: number): PackageSlug | null {
  // Exact match only (no tolerance)
  for (const [slug, config] of Object.entries(SUBSCRIPTION_PACKAGES)) {
    if (Math.abs(amount - config.price) < 0.01) {
      return slug as PackageSlug;
    }
  }
  return null;
}
