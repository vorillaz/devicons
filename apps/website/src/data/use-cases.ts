// Curated use-cases mapping to tag slugs. Each entry powers a /use-cases/{slug}
// page that targets higher-intent queries than the raw /icons/tag/{tag} pages.
// Keep prose specific — generic filler defeats the thin-content risk.

export interface UseCase {
  slug: string;
  title: string;
  keyword: string; // the search phrase this page targets
  eyebrow: string; // short category label shown above the H1
  intro: string; // 1 paragraph displayed under H1
  body: string; // 2-3 paragraphs of context
  tagMatches: string[]; // icons matching ANY of these tags appear in the grid
  related?: string[]; // slugs of other use cases to cross-link
}

export const USE_CASES: UseCase[] = [
  {
    slug: 'ai-ml-apps',
    title: 'Icons for AI & ML apps',
    keyword: 'ai icons',
    eyebrow: 'Use case',
    intro:
      'Logos for the AI stack teams build with: coding copilots, LLM providers, orchestration frameworks, vector stores, and the classic ML libraries underneath.',
    body:
      "Whether you're wiring up a new Claude-powered feature, shipping an evals dashboard, or writing a blog post about your RAG pipeline, these are the marks you reach for. Group by tier when arranging them in diagrams — coding agents / orchestration / retrieval / inference — rather than alphabetizing. Avoid mixing vendor logos (OpenAI, Anthropic, Mistral) with tool logos (LangChain, Pinecone) in the same row; readers parse the hierarchy faster when vendor marks sit above or to one side.",
    tagMatches: [
      'ai',
      'llm',
      'machine-learning',
      'foundation-models',
      'generative-ai',
    ],
    related: ['databases', 'devops-tooling'],
  },
  {
    slug: 'databases',
    title: 'Icons for database content',
    keyword: 'database icons',
    eyebrow: 'Use case',
    intro:
      'Relational, document, key-value, graph, and vector database logos — for architecture diagrams, migration guides, and comparison posts.',
    body:
      "Every database post needs a logo. For an architecture diagram, place relational DBs (Postgres, MySQL, MariaDB) on one axis and NoSQL/document (MongoDB, DynamoDB) on another — readers scan the category split faster than they decode individual logos. If you're writing a \"Postgres vs X\" piece, use the [compare pages](/compare/) instead, which already line up logos and metadata side-by-side.",
    tagMatches: ['database', 'sql', 'rdbms', 'nosql', 'cache', 'search'],
    related: ['ai-ml-apps', 'devops-tooling'],
  },
  {
    slug: 'frontend-frameworks',
    title: 'Icons for frontend framework content',
    keyword: 'frontend framework icons',
    eyebrow: 'Use case',
    intro:
      'React, Vue, Svelte, Angular, Solid, Qwik, Preact — plus the meta-frameworks on top (Next.js, Nuxt, SvelteKit, Astro, Remix).',
    body:
      'The classic framework-comparison table lives or dies on its logos. Keep vertical alignment tight — Nuxt and SvelteKit both have tall marks that will throw off a row if not constrained. For framework round-ups, the widely used picks are React, Vue, Svelte, and Solid on the library side; Next.js, Nuxt, SvelteKit, and Astro on the meta-framework side.',
    tagMatches: ['framework', 'frontend', 'ui-library', 'reactive', 'spa'],
    related: ['devops-tooling'],
  },
  {
    slug: 'devops-tooling',
    title: 'Icons for DevOps & infrastructure',
    keyword: 'devops icons',
    eyebrow: 'Use case',
    intro:
      'CI/CD platforms, container runtimes, orchestrators, and the cloud providers underneath. The logos you reach for when diagramming a deployment pipeline.',
    body:
      'A typical deploy-pipeline diagram runs: source control → CI → registry → orchestrator → cloud. The Devicons set covers each layer. For container content, Docker and Kubernetes almost always appear together — left-to-right, "build with Docker, orchestrate with Kubernetes." For cloud comparisons (AWS, GCP, Azure), lining them up vertically rather than horizontally reads cleaner since the wordmarks vary wildly in width.',
    tagMatches: [
      'devops',
      'cicd',
      'containerization',
      'orchestration',
      'infrastructure',
      'cloud',
    ],
    related: ['databases', 'frontend-frameworks'],
  },
  {
    slug: 'design-tools',
    title: 'Icons for design-tool content',
    keyword: 'design tool icons',
    eyebrow: 'Use case',
    intro:
      'Figma, Sketch, Framer, Adobe XD, Penpot, and the prototyping tools designers actually open each day.',
    body:
      'If you\'re writing about handoff, design systems, or prototype→code workflows, these are the marks readers scan for first. Figma is the default in most discussions; pair it with the downstream tool (Storybook, Framer, or whichever code-gen target you\'re writing about) to make the workflow legible.',
    tagMatches: ['design', 'prototyping', 'ui', 'ux'],
    related: ['frontend-frameworks'],
  },
  {
    slug: 'languages',
    title: 'Icons for programming-language content',
    keyword: 'programming language icons',
    eyebrow: 'Use case',
    intro:
      'JavaScript, TypeScript, Python, Go, Rust, Ruby, Swift, Kotlin — the languages that show up in every "our stack" page.',
    body:
      'For multi-language content (microservices, polyglot backends, language comparisons), treat logos as typographic characters: same optical weight, same baseline. Python and JavaScript marks read slightly heavier than Go and Rust at small sizes; add a few pixels of breathing room rather than cropping to the same bounding box.',
    tagMatches: [
      'programming-language',
      'language',
      'typed',
      'scripting',
      'systems',
    ],
    related: ['frontend-frameworks', 'devops-tooling'],
  },
];
