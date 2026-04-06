export const STRIPE_PRICES = {
  LEADHUNTER_STARTER: "price_1TJEd9GqMIbud5Hacsn2vL1J",
  LEADHUNTER_PRO: "price_1TJEdhGqMIbud5HafoNoNRoA",
  // Legacy prices (kept for existing subscribers)
  CHAMPION_MONTHLY: "price_1TEvG0GqMIbud5Ha8h085MFj",
  LAUNCHER_PRO_MONTHLY: "price_1TGBpxGqMIbud5HalJIv0Uos",
  STUDENT_PRO_MONTHLY: "price_1TChXtGqMIbud5Ha7Rubrrg9",
  PRO_MONTHLY: "price_1TAtnDGqMIbud5HaWJVNIAkP",
  PRO_ANNUAL: "price_1TAtnWGqMIbud5HaOIxrpiPU",
  GROWTH_PER_ROLE: "price_1TBcKXGqMIbud5HaBIouo7hM",
} as const;

export const STRIPE_PRODUCTS = {
  LEADHUNTER_STARTER: "prod_UHoFCxG2DlFSQp",
  LEADHUNTER_PRO: "prod_UHoG8d9iiTKPJe",
  // Legacy products
  CHAMPION: "prod_UDLxu72XQjm88j",
  LAUNCHER_PRO: "prod_UEfAjOLyjvupBA",
  STUDENT_PRO: "prod_UB3fASll4IYr6C",
  PRO_MONTHLY: "prod_U9CBP2Xq5KOXG4",
  PRO_ANNUAL: "prod_U9CB17vXbz0zW6",
  GROWTH_PER_ROLE: "prod_U9wC33liMvz8gf",
} as const;

/** Product IDs that grant Lead Hunter Starter access */
export const STARTER_PRODUCT_IDS = new Set([
  STRIPE_PRODUCTS.LEADHUNTER_STARTER,
]);

/** Product IDs that grant Lead Hunter Pro access (includes legacy pro) */
export const PRO_PRODUCT_IDS = new Set([
  STRIPE_PRODUCTS.LEADHUNTER_PRO,
  STRIPE_PRODUCTS.CHAMPION,
  STRIPE_PRODUCTS.STUDENT_PRO,
  STRIPE_PRODUCTS.PRO_MONTHLY,
  STRIPE_PRODUCTS.PRO_ANNUAL,
]);

/** Product IDs that grant launcher access */
export const LAUNCHER_PRODUCT_IDS = new Set([
  STRIPE_PRODUCTS.LAUNCHER_PRO,
]);

export type PlanTier = "free" | "starter" | "pro" | "school";

/** Monthly lead limits per tier */
export const LEAD_LIMITS: Record<PlanTier, number> = {
  free: 15,
  starter: 150,
  pro: 500,
  school: 500,
} as const;

export const FREE_LIMITS = {
  simulations_per_month: 3,
  analyses_per_month: 3,
} as const;
