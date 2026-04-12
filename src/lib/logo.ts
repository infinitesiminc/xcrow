import sequoiaArcLogo from '@/assets/sequoia-arc.png';

const BRANDFETCH_CLIENT_ID = '1idUR9TThSYgPVCpELC';

// Logos that need a local asset instead of brandfetch
const LOCAL_LOGO_MAP: Record<string, string> = {
  'sequoia arc': sequoiaArcLogo,
};

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
  spotify: 'spotify.com',
  deloitte: 'deloitte.com',
  // Accelerators & incubators
  'y combinator': 'ycombinator.com',
  techstars: 'techstars.com',
  '500 global': '500.co',
  antler: 'antler.co',
  'sequoia arc': 'sequoiacap.com',
  'a16z start': 'a16z.com',
  'plug and play': 'plugandplaytechcenter.com',
  'on deck': 'beondeck.com',
  seedcamp: 'seedcamp.com',
  'entrepreneur first': 'joinef.com',
  sosv: 'sosv.com',
  'founders factory': 'foundersfactory.com',
  'indie bio': 'indiebio.co',
  masschallenge: 'masschallenge.org',
  launch: 'launch.co',
  alchemist: 'alchemistaccelerator.com',
  // Universities
  ucla: 'ucla.edu',
  mit: 'mit.edu',
  stanford: 'stanford.edu',
  'carnegie mellon': 'cmu.edu',
  'georgia tech': 'gatech.edu',
  'ut austin': 'utexas.edu',
  nyu: 'nyu.edu',
  michigan: 'umich.edu',
  berkeley: 'berkeley.edu',
  purdue: 'purdue.edu',
  'virginia tech': 'vt.edu',
  usc: 'usc.edu',
};

export function brandfetchUrl(domain: string): string {
  return `https://cdn.brandfetch.io/${domain}?c=${BRANDFETCH_CLIENT_ID}`;
}

export function brandfetchFromName(name: string | null): string | null {
  if (!name) return null;
  const raw = name.toLowerCase().trim();
  if (LOCAL_LOGO_MAP[raw]) return LOCAL_LOGO_MAP[raw];
  const domain = DOMAIN_MAP[raw] || `${raw.replace(/\s+/g, '')}.com`;
  return brandfetchUrl(domain);
}
