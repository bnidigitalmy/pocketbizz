import { db } from "./db";
import { subscriptionPlans } from "@shared/schema";

/**
 * Seed subscription plan - Single simple pricing
 * RM27/bulan (RM0.90/hari) dengan 7 hari free trial
 */
async function seedSubscriptionPlans() {
  console.log("🌱 Seeding subscription plan...");

  const plan = {
    name: "standard",
    displayName: "PocketBizz",
    description: "Sehari hanya RM0.90 - lebih murah dari teh tarik!",
    monthlyPrice: "27.00",
    discount6Months: "10.00",  // 10% discount untuk 6 bulan
    discount12Months: "20.00", // 20% discount untuk 12 bulan
    currency: "MYR",
    features: JSON.stringify([
      "Pengurusan stok & inventori",
      "Rekod jualan & penghantaran",
      "Vendor & reseller management",
      "Payment claims untuk vendor",
      "Laporan kewangan lengkap",
      "Thermal invoice printing",
      "WhatsApp sharing",
      "Export data ke Excel",
      "Unlimited products",
      "Unlimited users",
      "7 hari percubaan percuma",
    ]),
    maxUsers: 999999,
    maxProducts: 999999,
    isActive: 1,
    sortOrder: 1,
  };

  try {
    // Clear existing plans
    await db.delete(subscriptionPlans);
    console.log("✅ Cleared existing subscription plans");

    // Insert single plan
    await db.insert(subscriptionPlans).values(plan);
    console.log(`✅ Inserted ${plan.displayName} plan`);

    console.log("\n🎉 Successfully seeded subscription plan!");
    console.log("\n📊 Pricing:");
    console.log("💰 RM27/bulan (RM0.90/hari)");
    console.log("\n💳 Payment Options:");
    console.log("1 bulan  : RM27.00");
    console.log("3 bulan  : RM79.00 (save RM2)");
    console.log("6 bulan  : RM146.00 (save 10% = RM16)");
    console.log("12 bulan : RM260.00 (save 20% = RM64)");
    console.log("\n🎁 7 hari percubaan PERCUMA");
    console.log("✨ Unlimited products & users");
    console.log("🚀 Semua features included");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding subscription plan:", error);
    process.exit(1);
  }
}

seedSubscriptionPlans();
