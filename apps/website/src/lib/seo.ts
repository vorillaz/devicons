import {
  SITE_TITLE,
  SITE_DESCRIPTION,
  SITE_URL,
  SITE_AUTHOR,
  GITHUB_URL,
  TWITTER_HANDLE,
} from '../consts';

type JsonLd = Record<string, unknown>;

// Match the site's `trailingSlash: 'always'` so JSON-LD page URLs align with
// canonicals and Astro's emitted routes. Skips fragments, query strings, and
// asset paths (anything with a file extension) — those should stay as-is.
const abs = (path: string, base: string = SITE_URL) => {
  const u = new URL(path, base);
  const lastSegment = u.pathname.split('/').pop() ?? '';
  const isAsset = lastSegment.includes('.');
  if (!isAsset && !u.pathname.endsWith('/')) {
    u.pathname = `${u.pathname}/`;
  }
  return u.toString();
};

const twitterUrl = () =>
  TWITTER_HANDLE
    ? `https://twitter.com/${TWITTER_HANDLE.replace(/^@/, '')}`
    : undefined;

export const organizationSchema = (site: string = SITE_URL): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': abs('/#organization', site),
  name: SITE_TITLE,
  url: site,
  logo: {
    '@type': 'ImageObject',
    url: abs('/favicon.svg', site),
  },
  sameAs: [GITHUB_URL, twitterUrl()].filter(Boolean) as string[],
});

export const websiteSchema = (site: string = SITE_URL): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': abs('/#website', site),
  name: SITE_TITLE,
  description: SITE_DESCRIPTION,
  url: site,
  publisher: { '@id': abs('/#organization', site) },
  inLanguage: 'en-US',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: abs('/search?q={search_term_string}', site),
    },
    'query-input': 'required name=search_term_string',
  },
});

export const breadcrumbSchema = (
  items: Array<{ name: string; url?: string }>,
  site: string = SITE_URL,
): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    ...(item.url ? { item: abs(item.url, site) } : {}),
  })),
});

interface IconSchemaInput {
  name: string;
  description?: string;
  slug: string;
  website?: string;
  mainColor?: string;
  license?: string;
  brandGuidelines?: string;
  site?: string;
}

export const iconBrandSchema = ({
  name,
  description,
  slug,
  website,
  site = SITE_URL,
}: IconSchemaInput): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'Brand',
  '@id': abs(`/icons/${slug}#brand`, site),
  name,
  ...(description ? { description } : {}),
  url: abs(`/icons/${slug}`, site),
  logo: abs(`/devicons/icons/${slug}.svg`, site),
  ...(website ? { sameAs: [website] } : {}),
});

export const iconImageSchema = ({
  name,
  slug,
  license,
  brandGuidelines,
  site = SITE_URL,
}: IconSchemaInput): JsonLd => {
  const pageUrl = abs(`/icons/${slug}`, site);
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    contentUrl: abs(`/devicons/icons/${slug}.svg`, site),
    url: pageUrl,
    name: `${name} logo`,
    encodingFormat: 'image/svg+xml',
    license: license ?? `${GITHUB_URL}/blob/main/LICENSE`,
    acquireLicensePage: brandGuidelines ?? pageUrl,
    copyrightNotice: `${name} logo © ${name}. SVG distributed under MIT by ${SITE_TITLE}.`,
    creditText: name,
    creator: { '@id': abs('/#organization', site) },
  };
};

interface TechArticleInput {
  title: string;
  description?: string;
  slug: string;
  publishedTime?: string;
  modifiedTime?: string;
  site?: string;
}

export const techArticleSchema = ({
  title,
  description,
  slug,
  publishedTime,
  modifiedTime,
  site = SITE_URL,
}: TechArticleInput): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: title,
  ...(description ? { description } : {}),
  mainEntityOfPage: abs(`/docs/${slug}`, site),
  inLanguage: 'en-US',
  author: {
    '@type': 'Organization',
    name: SITE_AUTHOR,
    '@id': abs('/#organization', site),
  },
  publisher: { '@id': abs('/#organization', site) },
  ...(publishedTime ? { datePublished: publishedTime } : {}),
  ...(modifiedTime ? { dateModified: modifiedTime } : {}),
});

interface CollectionPageInput {
  name: string;
  description: string;
  url: string;
  items: Array<{ name: string; url: string }>;
  site?: string;
}

export const collectionPageSchema = ({
  name,
  description,
  url,
  items,
  site = SITE_URL,
}: CollectionPageInput): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name,
  description,
  url: abs(url, site),
  inLanguage: 'en-US',
  isPartOf: { '@id': abs('/#website', site) },
  mainEntity: {
    '@type': 'ItemList',
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: abs(item.url, site),
    })),
  },
});

export const softwareApplicationSchema = (site: string = SITE_URL): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: SITE_TITLE,
  description: SITE_DESCRIPTION,
  url: site,
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Any',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  author: { '@id': abs('/#organization', site) },
  downloadUrl: GITHUB_URL,
});

export const faqSchema = (
  faqs: Array<{ question: string; answer: string }>,
): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
});

interface HowToInput {
  name: string;
  description: string;
  url: string;
  totalTime?: string; // ISO 8601 duration e.g. "PT2M"
  steps: Array<{ name: string; text: string; url?: string }>;
  site?: string;
}

export const howToSchema = ({
  name,
  description,
  url,
  totalTime,
  steps,
  site = SITE_URL,
}: HowToInput): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name,
  description,
  ...(totalTime ? { totalTime } : {}),
  mainEntityOfPage: abs(url, site),
  step: steps.map((s, i) => ({
    '@type': 'HowToStep',
    position: i + 1,
    name: s.name,
    text: s.text,
    ...(s.url ? { url: abs(s.url, site) } : {}),
  })),
});

interface SoftwarePackageInput {
  name: string;
  description: string;
  url: string;
  packageName: string; // e.g. "@dev.icons/react"
  programmingLanguage?: string;
  runtime?: string; // e.g. "React", "Vue"
  site?: string;
}

export const softwarePackageSchema = ({
  name,
  description,
  url,
  packageName,
  programmingLanguage = 'TypeScript',
  runtime,
  site = SITE_URL,
}: SoftwarePackageInput): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'SoftwareSourceCode',
  name,
  description,
  codeRepository: GITHUB_URL,
  programmingLanguage,
  ...(runtime ? { runtimePlatform: runtime } : {}),
  url: abs(url, site),
  license: 'https://opensource.org/licenses/MIT',
  author: { '@id': abs('/#organization', site) },
  // SoftwareApplication mirror so Google treats it as a developer app.
  isPartOf: {
    '@type': 'SoftwareApplication',
    name: packageName,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    downloadUrl: `https://www.npmjs.com/package/${packageName}`,
  },
});

interface DefinedTermInput {
  name: string;
  description: string;
  url: string;
  site?: string;
}

export const definedTermSchema = ({
  name,
  description,
  url,
  site = SITE_URL,
}: DefinedTermInput): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'DefinedTerm',
  name,
  description,
  url: abs(url, site),
  inDefinedTermSet: {
    '@type': 'DefinedTermSet',
    name: `${SITE_TITLE} tag taxonomy`,
    url: abs('/icons', site),
  },
});
