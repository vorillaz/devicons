// Curated comparison allowlist. Keep to well-known pairs with clear search
// intent ("react vs vue", "postgres vs mysql") — avoids generating thin or
// doorway pages from arbitrary combinations.

export interface Comparison {
  a: string; // icon slug
  b: string; // icon slug
  category: string; // human-readable category, e.g. "frontend framework"
  aTagline?: string;
  bTagline?: string;
}

export const COMPARISONS: Comparison[] = [
  { a: 'react', b: 'vue', category: 'frontend framework' },
  { a: 'react', b: 'angular', category: 'frontend framework' },
  { a: 'react', b: 'svelte', category: 'frontend framework' },
  { a: 'vue', b: 'svelte', category: 'frontend framework' },
  { a: 'nextjs', b: 'nuxt', category: 'meta-framework' },
  { a: 'nextjs', b: 'astro', category: 'meta-framework' },
  { a: 'nextjs', b: 'remix', category: 'meta-framework' },
  { a: 'vite', b: 'webpack', category: 'bundler' },
  { a: 'postgresql', b: 'mysql', category: 'relational database' },
  { a: 'postgresql', b: 'mongodb', category: 'database' },
  { a: 'mysql', b: 'mariadb', category: 'relational database' },
  { a: 'redis', b: 'memcached', category: 'cache' },
  { a: 'docker', b: 'kubernetes', category: 'container tooling' },
  { a: 'vercel', b: 'netlify', category: 'hosting platform' },
  { a: 'vercel', b: 'cloudflare', category: 'edge platform' },
  { a: 'aws', b: 'google-cloud', category: 'cloud provider' },
  { a: 'aws', b: 'microsoft-azure', category: 'cloud provider' },
  { a: 'google-cloud', b: 'microsoft-azure', category: 'cloud provider' },
  { a: 'typescript', b: 'javascript', category: 'language' },
  { a: 'jest', b: 'vitest', category: 'test runner' },
  { a: 'playwright', b: 'cypress', category: 'e2e testing' },
  { a: 'tailwind', b: 'bootstrap', category: 'CSS framework' },
  { a: 'prisma', b: 'drizzle-orm', category: 'ORM' },
  { a: 'github', b: 'gitlab', category: 'git host' },
  { a: 'figma', b: 'sketch', category: 'design tool' },
];

export const compareSlug = (a: string, b: string) => `${a}-vs-${b}`;
