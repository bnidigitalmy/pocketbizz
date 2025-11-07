/**
 * Price Suggestion Utility
 * 
 * Provides smart pricing suggestions based on cost and desired markup.
 * Helps business owners set profitable prices.
 */

export interface PriceSuggestion {
  markup: number;        // e.g., 2 for 2x markup
  multiplier: number;    // Same as markup (for clarity)
  price: number;         // Suggested selling price
  profit: number;        // Profit per unit
  margin: number;        // Profit margin percentage
  label: string;         // Human-readable label
}

/**
 * Calculate price suggestions with common markups
 * 
 * Example:
 * Cost per unit: RM 5.00
 * 
 * Suggestions:
 * - 2x markup: RM 10.00 (50% margin, RM 5.00 profit)
 * - 2.5x markup: RM 12.50 (60% margin, RM 7.50 profit)
 * - 3x markup: RM 15.00 (67% margin, RM 10.00 profit)
 * 
 * @param costPerUnit - Total cost to produce one unit
 * @param customMarkups - Optional custom markup multipliers (default: [2, 2.5, 3])
 * @returns Array of price suggestions
 */
export function getPriceSuggestions(
  costPerUnit: number,
  customMarkups: number[] = [2, 2.5, 3]
): PriceSuggestion[] {
  if (costPerUnit <= 0) {
    return [];
  }

  const suggestions: PriceSuggestion[] = [];

  for (const markup of customMarkups) {
    const price = costPerUnit * markup;
    const profit = price - costPerUnit;
    const margin = ((profit / price) * 100);

    suggestions.push({
      markup,
      multiplier: markup,
      price: parseFloat(price.toFixed(2)),
      profit: parseFloat(profit.toFixed(2)),
      margin: parseFloat(margin.toFixed(2)),
      label: `${markup}x (${margin.toFixed(0)}% margin)`,
    });
  }

  return suggestions;
}

/**
 * Calculate profit and margin for a given price
 * 
 * @param costPerUnit - Cost to produce one unit
 * @param sellingPrice - Proposed selling price
 * @returns Profit analysis
 */
export function calculateProfit(costPerUnit: number, sellingPrice: number) {
  const profit = sellingPrice - costPerUnit;
  const margin = sellingPrice > 0 ? ((profit / sellingPrice) * 100) : 0;
  const markup = costPerUnit > 0 ? (sellingPrice / costPerUnit) : 0;

  return {
    profit: parseFloat(profit.toFixed(2)),
    margin: parseFloat(margin.toFixed(2)),
    markup: parseFloat(markup.toFixed(2)),
    isProfit able: profit > 0,
  };
}

/**
 * Calculate packaging cost per unit
 * 
 * Example:
 * - Buy 50 pieces @ RM 11.90
 * - Use 1 piece per product
 * - Cost per piece: RM 11.90 / 50 = RM 0.238
 * 
 * @param packagePrice - Price of package (e.g., RM 11.90)
 * @param packageQuantity - Units in package (e.g., 50 pcs)
 * @param usagePerUnit - Units used per product (default: 1)
 * @returns Cost per product unit
 */
export function calculatePackagingCost(
  packagePrice: number,
  packageQuantity: number,
  usagePerUnit: number = 1
): number {
  if (packageQuantity <= 0) {
    return 0;
  }

  const costPerPackageUnit = packagePrice / packageQuantity;
  const costPerProduct = costPerPackageUnit * usagePerUnit;

  return parseFloat(costPerProduct.toFixed(4)); // 4 decimal places for precision
}

/**
 * Calculate recommended selling price based on market research
 * 
 * Common markup ranges by product type:
 * - Basic bakery items: 2x - 2.5x (50-60% margin)
 * - Premium products: 2.5x - 3x (60-67% margin)
 * - Custom/specialty: 3x - 4x (67-75% margin)
 * 
 * @param costPerUnit - Cost to produce
 * @param productType - Type of product
 * @returns Recommended price range
 */
export function getRecommendedPriceRange(
  costPerUnit: number,
  productType: 'basic' | 'premium' | 'specialty' = 'basic'
): { min: number; max: number; suggested: number } {
  const ranges = {
    basic: { min: 2.0, max: 2.5, suggested: 2.2 },
    premium: { min: 2.5, max: 3.0, suggested: 2.8 },
    specialty: { min: 3.0, max: 4.0, suggested: 3.5 },
  };

  const range = ranges[productType];

  return {
    min: parseFloat((costPerUnit * range.min).toFixed(2)),
    max: parseFloat((costPerUnit * range.max).toFixed(2)),
    suggested: parseFloat((costPerUnit * range.suggested).toFixed(2)),
  };
}

/**
 * Round price to nearest "nice" number
 * 
 * Examples:
 * - RM 12.35 → RM 12.50 (round to 0.50)
 * - RM 12.35 → RM 12.00 (round to 1.00)
 * - RM 12.35 → RM 12.40 (round to 0.10)
 * 
 * @param price - Original price
 * @param roundTo - Round to nearest value (default: 0.50)
 * @returns Rounded price
 */
export function roundPriceToNice(price: number, roundTo: number = 0.50): number {
  return parseFloat((Math.round(price / roundTo) * roundTo).toFixed(2));
}

export default {
  getPriceSuggestions,
  calculateProfit,
  calculatePackagingCost,
  getRecommendedPriceRange,
  roundPriceToNice,
};
