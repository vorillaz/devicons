// Pure tag helpers. Kept free of `astro:content` so astro.config.mjs and the
// Pages middleware can import them.

// Tag pages listing fewer icons than this are thin (a 1-icon tag page is a
// near-duplicate of the icon page itself). They still render so links keep
// working, but are marked noindex and left out of the sitemap.
export const MIN_INDEXABLE_TAG_COUNT = 3;

// `+` and `#` are spelled out so `c++` and `c#` don't collapse onto `c`.
export const slugifyTag = (tag: string) =>
  tag
    .toLowerCase()
    .replace(/\+/g, '-plus')
    .replace(/#/g, '-sharp')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Spelling variants and synonyms folded into one tag, so a topic gets a single
// page instead of several thin ones competing for the same query. Applied to
// icon frontmatter at load time (content.config.ts and sitemap-data.ts); the
// Pages middleware 301s the alias URLs to the canonical tag page.
export const TAG_ALIASES: Record<string, string> = {
  agent: 'agents',
  'artificial-intelligence': 'ai',
  cd: 'ci-cd',
  ci: 'ci-cd',
  communications: 'communication',
  container: 'containers',
  'continuous-delivery': 'ci-cd',
  'continuous-integration': 'ci-cd',
  cpp: 'c++',
  dashboards: 'dashboard',
  'development-tools': 'developer-tools',
  'e-book': 'ebooks',
  ecommerce: 'e-commerce',
  embedding: 'embeddings',
  extension: 'extensions',
  'front-end': 'frontend',
  'full-stack': 'fullstack',
  golang: 'go',
  'language-model': 'llm',
  'managed-services': 'managed-service',
  notebook: 'notebooks',
  payments: 'payment',
  postgres: 'postgresql',
  processors: 'processor',
  realtime: 'real-time',
  semiconductors: 'semiconductor',
  servers: 'server',
  'server-side-rendering': 'ssr',
  specifications: 'specification',
  spreadsheets: 'spreadsheet',
  startups: 'startup',
  'state-machine': 'state-machines',
  surveys: 'survey',
  tailwindcss: 'tailwind',
  tool: 'developer-tools',
  tooling: 'developer-tools',
  tools: 'developer-tools',
  wearable: 'wearables',
  'web-app': 'web-apps',
  websocket: 'websockets',
};

export const canonicalTag = (tag: string) => {
  const lower = tag.trim().toLowerCase();
  return TAG_ALIASES[lower] ?? lower;
};

/** Canonicalizes and de-duplicates an icon's tag list, keeping its order. */
export const canonicalTags = (tags: string[]) => [
  ...new Set(tags.map(canonicalTag)),
];

// Whole-tag labels that word-by-word casing can't produce.
const TAG_LABELS: Record<string, string> = {
  'a-b-testing': 'A/B Testing',
  'c++': 'C++',
  'c-plus-plus': 'C++',
  'ci-cd': 'CI/CD',
  cicd: 'CI/CD',
  'e-commerce': 'E-commerce',
  vscode: 'VS Code',
};

// Per-word casing for acronyms and brand names inside multi-word tags
// ("web-api" → "Web API", "aws-lambda" → "AWS Lambda").
const WORD_LABELS: Record<string, string> = {
  '2d': '2D',
  '2fa': '2FA',
  '3d': '3D',
  ai: 'AI',
  amqp: 'AMQP',
  api: 'API',
  apis: 'APIs',
  apm: 'APM',
  aws: 'AWS',
  baas: 'BaaS',
  bi: 'BI',
  cd: 'CD',
  cdn: 'CDN',
  cdp: 'CDP',
  ci: 'CI',
  cli: 'CLI',
  cms: 'CMS',
  cpu: 'CPU',
  crm: 'CRM',
  css: 'CSS',
  css3: 'CSS3',
  ddos: 'DDoS',
  devops: 'DevOps',
  devsecops: 'DevSecOps',
  dns: 'DNS',
  erp: 'ERP',
  etl: 'ETL',
  faas: 'FaaS',
  ftp: 'FTP',
  gcp: 'GCP',
  github: 'GitHub',
  gpu: 'GPU',
  graphql: 'GraphQL',
  gui: 'GUI',
  hpc: 'HPC',
  hr: 'HR',
  html: 'HTML',
  html5: 'HTML5',
  http: 'HTTP',
  https: 'HTTPS',
  i18n: 'i18n',
  iaas: 'IaaS',
  ibm: 'IBM',
  ide: 'IDE',
  ios: 'iOS',
  iot: 'IoT',
  javascript: 'JavaScript',
  jamstack: 'Jamstack',
  json: 'JSON',
  jsx: 'JSX',
  jvm: 'JVM',
  llm: 'LLM',
  llms: 'LLMs',
  macos: 'macOS',
  ml: 'ML',
  mongodb: 'MongoDB',
  mqtt: 'MQTT',
  mvc: 'MVC',
  mvvm: 'MVVM',
  mysql: 'MySQL',
  nextjs: 'Next.js',
  nlp: 'NLP',
  nodejs: 'Node.js',
  nosql: 'NoSQL',
  npm: 'npm',
  ocr: 'OCR',
  openai: 'OpenAI',
  openapi: 'OpenAPI',
  orm: 'ORM',
  p2p: 'P2P',
  paas: 'PaaS',
  pgp: 'PGP',
  php: 'PHP',
  pos: 'POS',
  postcss: 'PostCSS',
  postgresql: 'PostgreSQL',
  ppc: 'PPC',
  pwa: 'PWA',
  qa: 'QA',
  rag: 'RAG',
  rdbms: 'RDBMS',
  rdf: 'RDF',
  rest: 'REST',
  rpc: 'RPC',
  saas: 'SaaS',
  sdk: 'SDK',
  seo: 'SEO',
  sms: 'SMS',
  smtp: 'SMTP',
  spa: 'SPA',
  sql: 'SQL',
  sqlite: 'SQLite',
  ssh: 'SSH',
  ssl: 'SSL',
  sso: 'SSO',
  ssr: 'SSR',
  tdd: 'TDD',
  bdd: 'BDD',
  tls: 'TLS',
  typescript: 'TypeScript',
  ui: 'UI',
  ux: 'UX',
  v8: 'V8',
  vm: 'VM',
  vps: 'VPS',
  w3c: 'W3C',
  web3: 'Web3',
  webassembly: 'WebAssembly',
  webgl: 'WebGL',
  webrtc: 'WebRTC',
  websockets: 'WebSockets',
  wordpress: 'WordPress',
  x86: 'x86',
  xai: 'xAI',
  xml: 'XML',
};

export const formatTagLabel = (tag: string) => {
  const lower = tag.toLowerCase();
  if (TAG_LABELS[lower]) return TAG_LABELS[lower];
  return lower
    .split('-')
    .map(w => WORD_LABELS[w] ?? w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};
