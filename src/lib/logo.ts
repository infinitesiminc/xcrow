const BRANDFETCH_CLIENT_ID = '1idUR9TThSYgPVCpELC';

const DOMAIN_MAP: Record<string, string> = {
  meta: 'meta.com',
  microsoft: 'microsoft.com',
  openai: 'openai.com',
  cohere: 'cohere.com',
  mistral: 'mistral.ai',
  gong: 'gong.io',
  'hugging face': 'huggingface.co',
  huggingface: 'huggingface.co',
  'google deepmind': 'deepmind.com',
  deepmind: 'deepmind.com',
  databricks: 'databricks.com',
  deel: 'deel.com',
  coreweave: 'coreweave.com',
  glean: 'glean.com',
  'lockheed martin': 'lockheedmartin.com',
  mckinsey: 'mckinsey.com',
  boeing: 'boeing.com',
  fedex: 'fedex.com',
  apple: 'apple.com',
  nvidia: 'nvidia.com',
  stripe: 'stripe.com',
  deloitte: 'deloitte.com',
};

export function brandfetchUrl(domain: string): string {
  return `https://cdn.brandfetch.io/${domain}?c=${BRANDFETCH_CLIENT_ID}`;
}

export function brandfetchFromName(name: string | null): string | null {
  if (!name) return null;
  const raw = name.toLowerCase().trim();
  const domain = DOMAIN_MAP[raw] || `${raw.replace(/\s+/g, '')}.com`;
  return brandfetchUrl(domain);
}
