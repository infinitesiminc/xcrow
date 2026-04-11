/** Shared account types — tenant-agnostic */

export type AccountType = string;
export type AccountStage = "active" | "target" | "whitespace" | "competitor";

export interface Account {
  id: string;
  name: string;
  accountType: AccountType;
  stage: AccountStage;
  estimatedSpaces: string;
  facilityCount: string;
  focusArea: string;
  hqCity: string;
  hqLat: number;
  hqLng: number;
  website: string;
  differentiator: string;
  caseStudyUrl?: string;
  currentVendor?: string;
  annualRevenue?: string;
  employeeCount?: string;
  founded?: number;
  priorityScore?: number;
  notes?: string;
  ownership_type?: string;
  contract_model?: string;
}

/** Keep FlashAccount as alias for backward compat during migration */
export type FlashAccount = Account;

export const STAGE_CONFIG: Record<AccountStage, { label: string; color: string; markerColor: string; description: string }> = {
  active: {
    label: "Active Partner",
    color: "hsl(142, 71%, 45%)",
    markerColor: "#22c55e",
    description: "Active partner with deployed solutions",
  },
  target: {
    label: "Target Account",
    color: "hsl(45, 93%, 47%)",
    markerColor: "#eab308",
    description: "Identified prospect, not yet a customer",
  },
  whitespace: {
    label: "Whitespace",
    color: "hsl(0, 0%, 65%)",
    markerColor: "#a3a3a3",
    description: "Uncontacted opportunity",
  },
  competitor: {
    label: "Competitor",
    color: "hsl(0, 84%, 60%)",
    markerColor: "#ef4444",
    description: "Uses a competing solution",
  },
};
