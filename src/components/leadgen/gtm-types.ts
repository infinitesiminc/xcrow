/* ── GTM Tree Types ── */

export interface GTMProduct {
  id: string;
  name: string;
  description: string;
  target_user: string;
  pricing_model: string;
  competitors: string[];
}

export interface GTMCustomer {
  name: string;
  domain: string;
  industry: string;
  product_ids: string[];
  evidence?: string;
  type: "customer";
}

export interface GTMConquestTarget {
  name: string;
  domain: string;
  industry: string;
  uses_competitor: string;
  product_ids: string[];
  switch_angle: string;
  type: "conquest";
}

export interface GTMBuyerMapping {
  product_id: string;
  product_name: string;
  vertical: string;
  segment: string;
  dm: { title: string; seniority: string; why_they_buy: string; outreach_channel: string };
  champion: { title: string; seniority: string; why_they_care: string; outreach_channel: string };
  known_customers: string[];
}

export interface GTMLead {
  name: string;
  title: string;
  company: string;
  linkedin_url: string;
  email: string | null;
  photo_url: string | null;
  product_id: string;
  product_name: string;
  vertical: string;
  role: "dm" | "champion";
  type: "customer" | "conquest";
  competitor_using?: string | null;
}

export interface GTMTreeData {
  company_summary: string;
  products: GTMProduct[];
  customers: GTMCustomer[];
  conquest_targets: GTMConquestTarget[];
  mappings: GTMBuyerMapping[];
  leads: GTMLead[];
}
