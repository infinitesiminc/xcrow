import flashLogo from "@/assets/flash-logo.png";

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

const FLASH_CONFIG: TenantConfig = {
  slug: "flash",
  name: "Flash Parking",
  logo: flashLogo,
  industry: "parking-tech",
  contextPrompt: "You are prospecting on behalf of Flash, a cloud-based parking technology platform (PARCS, EV charging, mobile payments, analytics) powering 16,000+ locations.",
  accountTypes: [
    { value: "fleet_operator", label: "Parking Operator HQ", icon: "grid" },
    { value: "airport", label: "Airport", icon: "plane" },
    { value: "large_venue", label: "Large Venue", icon: "building" },
  ],
  stages: {
    active: { label: "Active Partner", color: "hsl(142, 71%, 45%)", markerColor: "#22c55e", description: "Confirmed Flash customer with deployed technology" },
    target: { label: "Target Account", color: "hsl(45, 93%, 47%)", markerColor: "#eab308", description: "Identified prospect, not yet a customer" },
    whitespace: { label: "Whitespace", color: "hsl(0, 0%, 65%)", markerColor: "#a3a3a3", description: "Large operator with no known Flash relationship" },
    competitor: { label: "Competitor", color: "hsl(0, 84%, 60%)", markerColor: "#ef4444", description: "Direct competitor to Flash in parking technology" },
  },
  mapCenter: { lat: 39.0, lng: -98.0, zoom: 4.5 },
  featureFlags: { showMap: true, showMA: true, showGarageDiscovery: true, showDeployedSites: true },
  scoringWeights: {
    revenue: 10, employees: 5, vendor: 5, founded: 5,
    stageBonus: { active: 20, target: 15, competitor: 10, whitespace: 0 },
  },
  dbTable: "flash_accounts",
  seedDataKey: "flash",
};

const CLIQ_CONFIG: TenantConfig = {
  slug: "cliq",
  name: "Cliq",
  logo: "", // To be added after analyzing cliq.com
  industry: "events-tech",
  contextPrompt: "You are prospecting on behalf of Cliq, a B2B events and engagement platform.",
  accountTypes: [
    { value: "enterprise", label: "Enterprise", icon: "building" },
    { value: "agency", label: "Agency", icon: "grid" },
    { value: "venue", label: "Venue", icon: "building" },
  ],
  stages: {
    active: { label: "Customer", color: "hsl(142, 71%, 45%)", markerColor: "#22c55e", description: "Active Cliq customer" },
    target: { label: "Target", color: "hsl(45, 93%, 47%)", markerColor: "#eab308", description: "Identified prospect" },
    whitespace: { label: "Whitespace", color: "hsl(0, 0%, 65%)", markerColor: "#a3a3a3", description: "Uncontacted opportunity" },
    competitor: { label: "Competitor", color: "hsl(0, 84%, 60%)", markerColor: "#ef4444", description: "Uses competing platform" },
  },
  mapCenter: { lat: 39.0, lng: -98.0, zoom: 4.5 },
  featureFlags: { showMap: false, showMA: false, showGarageDiscovery: false, showDeployedSites: false },
  scoringWeights: {
    revenue: 10, employees: 5, vendor: 5, founded: 5,
    stageBonus: { active: 20, target: 15, competitor: 10, whitespace: 0 },
  },
  dbTable: "flash_accounts",
  seedDataKey: "cliq",
};

export const TENANTS: Record<string, TenantConfig> = {
  flash: FLASH_CONFIG,
  cliq: CLIQ_CONFIG,
};

export function getTenant(slug: string): TenantConfig | undefined {
  return TENANTS[slug];
}

export function getAllTenants(): TenantConfig[] {
  return Object.values(TENANTS);
}
