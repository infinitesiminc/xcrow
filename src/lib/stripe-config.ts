export const STRIPE_PRICES = {
  LEADHUNTER_STARTER: "price_1TJEd9GqMIbud5Hacsn2vL1J",
  LEADHUNTER_PRO: "price_1TJEdhGqMIbud5HafoNoNRoA",
  LEAD_TOPUP_50: "price_1TLSOkGqMIbud5HaA1K1Z5yO",
} as const;

export const STRIPE_PRODUCTS = {
  LEADHUNTER_STARTER: "prod_UHoFCxG2DlFSQp",
  LEADHUNTER_PRO: "prod_UHoG8d9iiTKPJe",
  LEAD_TOPUP_50: "prod_UK6bDx5XCNm0i6",
} as const;

/** Product IDs that grant Lead Gen Starter access */
export const STARTER_PRODUCT_IDS = new Set([
  STRIPE_PRODUCTS.LEADHUNTER_STARTER,
]);

/** Product IDs that grant Lead Gen Pro access */
export const PRO_PRODUCT_IDS = new Set([
  STRIPE_PRODUCTS.LEADHUNTER_PRO,
]);

export type PlanTier = "free" | "starter" | "pro";

/** Monthly lead limits per tier */
export const LEAD_LIMITS: Record<PlanTier, number> = {
  free: 15,
  starter: 150,
  pro: 500,
} as const;

/** Top-up pack config */
export const TOPUP_PACK = {
  leads: 50,
  price: 10, // USD
  priceId: STRIPE_PRICES.LEAD_TOPUP_50,
  productId: STRIPE_PRODUCTS.LEAD_TOPUP_50,
} as const;
