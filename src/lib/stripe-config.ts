export const STRIPE_PRICES = {
  STUDENT_PRO_MONTHLY: "price_1TChXtGqMIbud5Ha7Rubrrg9",
  // Legacy prices (kept for existing subscribers)
  PRO_MONTHLY: "price_1TAtnDGqMIbud5HaWJVNIAkP",
  PRO_ANNUAL: "price_1TAtnWGqMIbud5HaOIxrpiPU",
  GROWTH_PER_ROLE: "price_1TBcKXGqMIbud5HaBIouo7hM",
} as const;

export const STRIPE_PRODUCTS = {
  STUDENT_PRO: "prod_UB3fASll4IYr6C",
  // Legacy products
  PRO_MONTHLY: "prod_U9CBP2Xq5KOXG4",
  PRO_ANNUAL: "prod_U9CB17vXbz0zW6",
  GROWTH_PER_ROLE: "prod_U9wC33liMvz8gf",
} as const;

/** All product IDs that grant "pro" access */
export const PRO_PRODUCT_IDS = new Set([
  STRIPE_PRODUCTS.STUDENT_PRO,
  STRIPE_PRODUCTS.PRO_MONTHLY,
  STRIPE_PRODUCTS.PRO_ANNUAL,
]);

export type PlanTier = "free" | "pro" | "school";

export const FREE_LIMITS = {
  simulations_per_month: 3,
  analyses_per_month: 3,
} as const;
