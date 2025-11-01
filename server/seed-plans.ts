import { db } from "./db";
import { subscriptionPlans } from "@shared/schema";

/**
 * Seed subscription plans with realistic pricing for Malaysian small businesses
 * Based on actual features implemented in PocketBizz
 */
async function seedSubscriptionPlans() {
  console.log("🌱 Seeding subscription plans...");

  const plans = [
    {
      name: "basic",
      displayName: "Basic",
      description: "Untuk peniaga solo yang baru bermula",
      monthlyPrice: "49.00",
      discount6Months: "10.00", // 10% off for 6 months
      discount12Months: "20.00", // 20% off for 12 months
      currency: "MYR",
      features: JSON.stringify([
        "Pengurusan stok asas",
        "Rekod jualan & penghantaran",
        "Laporan kewangan mudah",
        "Jejak inventori real-time",
        "Thermal invoice printing",
        "Export data ke Excel",
        "Support via email",
      ]),
      maxUsers: 1,
      maxProducts: 50,
      isActive: 1,
      sortOrder: 1,
    },
    {
      name: "pro",
      displayName: "Pro",
      description: "Untuk perniagaan yang sedang berkembang",
      monthlyPrice: "99.00",
      discount6Months: "10.00",
      discount12Months: "20.00",
      currency: "MYR",
      features: JSON.stringify([
        "Semua ciri Basic",
        "Pengurusan vendor & komisyen",
        "Tracking expired/rosak items",
        "Thermal invoice dengan QR payment",
        "WhatsApp share invoice",
        "Multi-user access (3 pengguna)",
        "Perancangan produksi",
        "Priority support",
      ]),
      maxUsers: 3,
      maxProducts: 200,
      isActive: 1,
      sortOrder: 2,
    },
    {
      name: "premium",
      displayName: "Premium",
      description: "Untuk perniagaan berskala besar",
      monthlyPrice: "199.00",
      discount6Months: "10.00",
      discount12Months: "20.00",
      currency: "MYR",
      features: JSON.stringify([
        "Semua ciri Pro",
        "Unlimited produk & pengguna",
        "Custom reports & analytics",
        "Advanced inventory forecasting",
        "Batch/lot tracking (FIFO)",
        "Reseller & agent management",
        "Custom branding (logo, colors)",
        "Dedicated support",
      ]),
      maxUsers: 999999,
      maxProducts: 999999,
      isActive: 1,
      sortOrder: 3,
    },
  ];

  try {
    // Clear existing plans
    await db.delete(subscriptionPlans);
    console.log("✅ Cleared existing subscription plans");

    // Insert new plans
    for (const plan of plans) {
      await db.insert(subscriptionPlans).values(plan);
      console.log(`✅ Inserted ${plan.displayName} plan - RM${plan.monthlyPrice}/bulan`);
    }

    console.log("\n🎉 Successfully seeded subscription plans!");
    console.log("\n📊 Pricing Summary:");
    console.log("Basic: RM49/bulan (50 products, 1 user)");
    console.log("Pro: RM99/bulan (200 products, 3 users) - POPULAR");
    console.log("Premium: RM199/bulan (Unlimited) - ENTERPRISE");
    console.log("\n💰 Discounts:");
    console.log("6 bulan: 10% OFF");
    console.log("12 bulan: 20% OFF");
    console.log("Early Bird: 70% OFF (first 100 users)");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding subscription plans:", error);
    process.exit(1);
  }
}

seedSubscriptionPlans();
