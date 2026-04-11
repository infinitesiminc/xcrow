export interface TenantConfig {
  slug: string;
  name: string;
  logo: string;
  industry: string;
  contextPrompt: string;
  accountTypes: { value: string; label: string; icon: string }[];
  stages: Record<string, { label: string; color: string; markerColor: string; description: string }>;
  mapCenter: { lat: number; lng: number; zoom: number };
  featureFlags: {
    showMap: boolean;
    showMA: boolean;
    showGarageDiscovery: boolean;
    showDeployedSites: boolean;
  };
  scoringWeights: {
    revenue: number;
    employees: number;
    vendor: number;
    founded: number;
    stageBonus: Record<string, number>;
  };
  /** DB table for accounts (currently all use flash_accounts with tenant_slug filter) */
  dbTable: string;
  /** Static seed data fallback key */
  seedDataKey?: string;
}

const CLIQ_CONFIG: TenantConfig = {
  slug: "cliq",
  name: "Cliq",
  logo: "https://cdn.prod.website-files.com/62422583765bcd76a4651683/69408713a1a47f0cacfa13fc_CLIQ_LogoExport-2024-Trademark_CLIQ_Logo_RegisteredTrademark_WhiteOrange.png",
  industry: "fintech-payments",
  contextPrompt: `You are prospecting on behalf of Cliq, a financial technology company ("Champions of Commerce") processing $1.8B+ in monthly transactions. Cliq partners with ISOs and agents to help businesses transact with customers via:
- Merchant Service Solutions (credit, debit, ACH payment processing, chargeback/fraud mitigation)
- Payroll & Expense Issuing Solutions (custom card programs for ISOs and agent partners)
- Fintech Solutions (integrated platform for transaction processing, management, and reporting)
- Consulting & Custom Solutions (merchant onboarding, account management, performance tracking)
- Lending Solutions (embedded lending via Jaris partnership)
- Dispute Management (365-day chargeback alert monitoring, expert support)
Key selling points: 125+ years combined experience, 25 custom tech solutions, VAMP compliance.`,
  accountTypes: [
    { value: "iso", label: "ISO / Agent", icon: "grid" },
    { value: "merchant", label: "Merchant", icon: "building" },
    { value: "fintech", label: "Fintech Partner", icon: "zap" },
    { value: "lender", label: "Lender / CDFI", icon: "dollar-sign" },
  ],
  stages: {
    active: { label: "Active Partner", color: "hsl(142, 71%, 45%)", markerColor: "#22c55e", description: "Active Cliq partner processing transactions" },
    target: { label: "Target", color: "hsl(24, 95%, 53%)", markerColor: "#f97316", description: "Identified prospect for Cliq solutions" },
    whitespace: { label: "Whitespace", color: "hsl(0, 0%, 65%)", markerColor: "#a3a3a3", description: "Uncontacted opportunity in payments space" },
    competitor: { label: "Competitor", color: "hsl(0, 84%, 60%)", markerColor: "#ef4444", description: "Uses competing payment processor" },
  },
  mapCenter: { lat: 34.05, lng: -118.25, zoom: 5 },
  featureFlags: { showMap: false, showMA: true, showGarageDiscovery: false, showDeployedSites: false },
  scoringWeights: {
    revenue: 15, employees: 5, vendor: 10, founded: 3,
    stageBonus: { active: 20, target: 15, competitor: 10, whitespace: 0 },
  },
  dbTable: "flash_accounts",
  seedDataKey: "cliq",
};

export const TENANTS: Record<string, TenantConfig> = {
  cliq: CLIQ_CONFIG,
};

export function getTenant(slug: string): TenantConfig | undefined {
  return TENANTS[slug];
}

export function getAllTenants(): TenantConfig[] {
  return Object.values(TENANTS);
}
