// Hand-written intros for the tag pages that draw the most search traffic.
// Every other tag page falls back to the generated copy in [tag].astro.
// Keys are canonical tag names (see TAG_ALIASES in lib/tags.ts). Keep each
// entry specific to the category: what the logos are, and where people use
// them. Generic filler here is exactly the thin content this file exists to
// avoid.

export interface TagContent {
  /** One or two paragraphs shown under the icon grid. */
  about: string;
  /**
   * Icon ids to lead the grid, title snippet, and intro with, in order.
   * Ids not in the tag are ignored.
   */
  featured?: string[];
}

export const TAG_CONTENT: Record<string, TagContent> = {
  ai: {
    about:
      'AI logos cover model labs, coding assistants, and the tooling between them: OpenAI, Anthropic and Claude, Google Gemini, Mistral, DeepSeek, and xAI on the model side, Cursor and GitHub Copilot in the editor, and Hugging Face, PyTorch, and TensorFlow underneath. Most of these marks have changed in the last two years, so check that a logo in your deck or docs is the current one.',
    featured: ['openai', 'anthropic', 'claude', 'google-gemini', 'deepseek', 'cursor', 'github-copilot', 'hugging-face'],
  },
  agents: {
    about:
      'Agent frameworks and products: the orchestration layers (LangGraph, CrewAI) and the coding agents that run in a terminal or editor. Use them in architecture diagrams to show which runtime drives which model.',
    featured: ['langgraph', 'crewai'],
  },
  analytics: {
    about:
      'Product analytics, BI, and data warehouse logos: Amplitude and Google Analytics for behaviour tracking, Snowflake, ClickHouse, and Redshift for storage, Grafana and Superset for dashboards. Handy for "data stack" slides and integration pages.',
    featured: ['google-analytics', 'amplitude', 'snowflake', 'clickhouse', 'grafana'],
  },
  api: {
    about:
      'Logos for API platforms, API-first products, and the tools used to build and test APIs: Stripe, OpenAI, and Algolia as products, Express, FastAPI, and Fastify as frameworks, Apollo and AsyncAPI for schemas, and Insomnia for testing.',
    featured: ['stripe', 'openai', 'express', 'fastapi'],
  },
  automation: {
    about:
      'Workflow automation, infrastructure as code, and marketing automation share this category. Ansible, Terraform, and Chef automate servers; Airflow and Step Functions orchestrate jobs; IFTTT, Customer.io, and Drip automate messaging.',
    featured: ['terraform', 'ansible', 'ifttt'],
  },
  backend: {
    about:
      'Server-side languages, runtimes, frameworks, and backend-as-a-service platforms: Node.js, Bun, Go, Java, and Elixir; Express, Rails, Laravel, Django, and FastAPI; Supabase, Firebase, and Appwrite. Use them to label the server tier in a stack diagram.',
    featured: ['nodejs', 'go', 'java', 'python', 'express', 'laravel', 'django', 'supabase', 'firebase'],
  },
  'ci-cd': {
    about:
      'Continuous integration and delivery services: GitHub Actions, GitLab, CircleCI, Buildkite, Bitrise, Argo, and the AWS Code* family. These are the badges and logos that usually sit next to a build status or a deployment pipeline diagram.',
    featured: ['github-actions', 'gitlab', 'circleci'],
  },
  cloud: {
    about:
      'Cloud providers and the individual services inside them. AWS has the largest set here (Lambda, S3, CloudFront, Bedrock and many more), alongside Google Cloud, Microsoft Azure, Alibaba Cloud, Cloudflare, Vercel, and Netlify. Service-level marks are useful in architecture diagrams where a single provider logo is too vague.',
    featured: ['aws', 'google-cloud', 'microsoft-azure', 'cloudflare', 'vercel', 'netlify', 'docker'],
  },
  cms: {
    about:
      'Content management systems, from classic PHP platforms (WordPress, Drupal, Joomla!, Craft CMS) to headless CMSs (Contentful, Sanity, Strapi, Storyblok, Payload, DatoCMS). Agencies use these on "platforms we build with" pages.',
    featured: ['wordpress', 'contentful', 'sanity', 'strapi'],
  },
  database: {
    about:
      'Relational, document, key-value, graph, and vector databases, plus the ORMs and GUIs that sit on top: PostgreSQL, MySQL, SQLite, MongoDB, Redis, ClickHouse, Cassandra, Dgraph, ArangoDB, Prisma, Drizzle, and TypeORM. Most come in color and monochrome so they hold up in both light and dark diagrams.',
    featured: ['postgresql', 'mysql', 'mongodb', 'redis', 'sqlite', 'supabase'],
  },
  devops: {
    about:
      'Containers, orchestration, infrastructure as code, and observability: Docker, Kubernetes, Terraform, Ansible, Argo, Datadog, and the AWS deployment services. These logos tend to appear together on platform engineering docs and on-call runbooks.',
    featured: ['docker', 'kubernetes', 'terraform', 'ansible', 'datadog'],
  },
  framework: {
    about:
      'Application frameworks across languages: Vue, Angular, Svelte, Next.js, Nuxt, and Astro on the web; Rails, AdonisJS, CakePHP, and CodeIgniter on the server; Electron and Compose Multiplatform for desktop and mobile; LangChain for LLM apps.',
    featured: ['vue', 'angular', 'svelte', 'nextjs', 'nuxt', 'astro'],
  },
  frontend: {
    about:
      'Frontend frameworks, UI libraries, CSS tools, and build tooling: React, Vue, Angular, Svelte, Next.js, Nuxt, Astro, Tailwind, Material UI, Mantine, Bootstrap, and the bundlers and test runners around them. Use them for tech stack sections on portfolios, job posts, and project READMEs.',
    featured: ['react', 'vue', 'angular', 'svelte', 'nextjs', 'nuxt', 'astro', 'tailwind'],
  },
  'game-engine': {
    about:
      'Game engines and 3D tools: Unity, Unreal Engine, Godot, and Blender. Common on game jam pages, portfolio stacks, and engine comparison posts.',
    featured: ['unity', 'godot', 'blender'],
  },
  hosting: {
    about:
      'Hosting, PaaS, and edge platforms: Vercel, Netlify, Fly.io, Railway, Heroku, DigitalOcean, Linode, and the AWS compute services. Teams use these on deploy buttons, status pages, and "where we run" sections.',
    featured: ['vercel', 'netlify', 'aws', 'firebase'],
  },
  ide: {
    about:
      'Code editors and IDEs: Visual Studio Code, Cursor, the JetBrains family (IntelliJ IDEA, PyCharm, GoLand, Rider, PhpStorm), Eclipse, Emacs, and browser IDEs like StackBlitz, CodeSandbox, and Replit.',
    featured: ['visual-studio-code', 'cursor', 'intellij-idea'],
  },
  javascript: {
    about:
      'The JavaScript ecosystem in one place: the language and its runtimes (Node.js, Deno), frameworks (React, Vue, Svelte, Angular), build tools (esbuild, Vite), test runners (Jest, Vitest, Cypress), and package managers (npm, pnpm). Every icon here also ships as a tree-shakeable React, Vue, or Svelte component.',
    featured: ['javascript', 'typescript', 'nodejs', 'react', 'vue', 'svelte', 'angular'],
  },
  llm: {
    about:
      'Large language model providers, open-weight model families, and LLM tooling: OpenAI, Anthropic, Google Gemini and Gemma, Mistral, DeepSeek, xAI and Grok, Cohere, Kimi, and Doubao, plus LangChain, LlamaIndex, LangSmith, Ollama, and LM Studio for building on top of them. Useful for model pickers, provider settings screens, and benchmark charts.',
    featured: ['openai', 'anthropic', 'claude', 'google-gemini', 'deepseek', 'langchain', 'ollama', 'llamaindex'],
  },
  'machine-learning': {
    about:
      'Machine learning frameworks, platforms, and model providers: PyTorch, TensorFlow, Hugging Face, Jupyter, Google Colab, Vertex AI, Gradio, and Apache Spark, along with the labs shipping foundation models.',
    featured: ['openai', 'anthropic', 'pytorch', 'tensorflow', 'hugging-face'],
  },
  mobile: {
    about:
      'Mobile platforms, cross-platform frameworks, and app tooling: Android, Apple, Flutter, Dart, Expo, Capacitor, Cordova, CocoaPods, Fastlane, and Bitrise. Useful on app landing pages and mobile CI docs.',
    featured: ['android', 'apple', 'flutter', 'expo', 'swift', 'kotlin'],
  },
  monitoring: {
    about:
      'Monitoring, logging, error tracking, and APM: Datadog, Prometheus, Grafana, Dynatrace, Bugsnag, AppSignal, InfluxDB, Graylog, and AWS CloudWatch. These usually show up together in observability stack diagrams.',
    featured: ['datadog', 'prometheus', 'grafana', 'sentry'],
  },
  nodejs: {
    about:
      'Libraries, frameworks, and tools built for Node.js: Express, Fastify, Koa, NestJS, AdonisJS, Prisma, TypeORM, Knex, PM2, nvm, Mocha, and the npm and pnpm package managers.',
    featured: ['nodejs', 'express', 'npm', 'pnpm'],
  },
  'open-source': {
    about:
      'Open-source projects across the stack, from operating systems (Linux, Android, Arch) and databases (PostgreSQL, SQLite, ClickHouse) to editors (Vim), engines (Godot, Blender), and AI models (DeepSeek, Hugging Face). Good for "built with open source" credits pages.',
    featured: ['linux-tux', 'git', 'github', 'postgresql', 'godot', 'blender'],
  },
  'programming-language': {
    about:
      'Programming language logos: JavaScript, TypeScript, Python, Go, Rust, Java, Kotlin, Swift, PHP, Ruby, Elixir, C, C++, C#, Haskell, Dart, Lua, and more. These are the most requested icons for résumés, skill grids, and course thumbnails.',
    featured: ['javascript', 'typescript', 'python', 'go', 'rust', 'java', 'kotlin', 'swift', 'php'],
  },
  security: {
    about:
      'Identity, secrets, and security tooling: Auth0, Clerk, Cloudflare, Dashlane, HackerOne, hCaptcha, GnuPG, Certbot, and the AWS security services (IAM, KMS, WAF, Shield, Secrets Manager).',
    featured: ['cloudflare', 'auth0', 'clerk'],
  },
  testing: {
    about:
      'Unit, end-to-end, visual, and API testing tools: Jest, Vitest, Mocha, Jasmine, Cypress, Appium, Chromatic, Applitools, Codecov, and Insomnia. Use them for test-strategy docs and CI pipeline diagrams.',
    featured: ['jest', 'vitest', 'cypress', 'playwright'],
  },
  'web-development': {
    about:
      'The core web platform and the languages and CMSs most sites are built on: HTML5, CSS, TypeScript, PHP, Python, Ruby on Rails, Drupal, and Joomla!, plus developer resources like MDN and CodePen.',
    featured: ['html-5', 'css', 'typescript', 'php', 'python', 'mdn'],
  },
  'web-framework': {
    about:
      'Server-side web frameworks: Express, Fastify, Koa, and Feathers for Node.js; Django, Flask, and FastAPI for Python; Laravel for PHP; Sinatra for Ruby; Gin for Go; Grails, Vaadin, and Wicket on the JVM.',
    featured: ['express', 'fastapi', 'django', 'laravel', 'flask'],
  },
};
