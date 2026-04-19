import { formatTagLabel } from './icons-query';

interface BuildFaqArgs {
  name: string;
  description?: string;
  slug: string;
  tags: string[];
  aliases?: string[];
  mainColor?: string;
  license?: string;
}

export interface FaqEntry {
  question: string;
  answer: string;
}

function pascal(slug: string): string {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function componentName(slug: string): string {
  return `${pascal(slug)}Icon`;
}

function primaryCategoryLabel(tags: string[]): string | null {
  const tag = tags[0];
  return tag ? formatTagLabel(tag).toLowerCase() : null;
}

export function buildIconFaq({
  name,
  description,
  slug,
  tags,
  aliases,
  mainColor,
  license,
}: BuildFaqArgs): FaqEntry[] {
  const cmp = componentName(slug);
  const category = primaryCategoryLabel(tags);
  const licenseText = license ?? 'MIT';
  const faqs: FaqEntry[] = [];

  faqs.push({
    question: `What is the ${name} logo?`,
    answer: description
      ? `${description} Devicons publishes the ${name} logo as an optimized SVG plus ready-to-use React, Vue, and Svelte components.`
      : `${name} is a ${category ?? 'developer'} brand. Devicons publishes the ${name} logo as an optimized SVG plus ready-to-use React, Vue, and Svelte components.`,
  });

  faqs.push({
    question: `Is the ${name} logo free to download?`,
    answer: `Yes. The ${name} icon is part of the open-source Devicons library and free to use in personal and commercial projects under the ${licenseText} license. Trademark rights remain with ${name}.`,
  });

  if (mainColor) {
    const others = ''; // reserved for otherColors expansion
    faqs.push({
      question: `What is the ${name} brand color?`,
      answer: `The primary ${name} brand color is ${mainColor}. Use it for backgrounds, accents, and hover states when presenting the ${name} logo alongside your UI.${others}`,
    });
  }

  faqs.push({
    question: `How do I use the ${name} icon in React?`,
    answer: `Install the Devicons React package with \`npm install @dev.icons/react\`, then import the component: \`import { ${cmp} } from "@dev.icons/react"\`. Render it with \`<${cmp} size={32} />\`. The same icon is available for Vue (\`@dev.icons/vue\`) and Svelte (\`@dev.icons/svelte\`).`,
  });

  faqs.push({
    question: `Where can I download the ${name} logo as an SVG?`,
    answer: `Download the ${name} SVG directly from the Devicons page — the download button exports an optimized, transparent-background SVG ready for diagrams, slides, and docs. The same SVG is served on the CDN and via the npm packages.`,
  });

  if (aliases?.length) {
    const aliasList = aliases.join(', ');
    faqs.push({
      question: `Is ${aliases[0]} the same as ${name}?`,
      answer: `Yes. ${aliasList} ${aliases.length === 1 ? 'is an alternate name' : 'are alternate names'} for ${name}. Search for either on Devicons and you'll land on this page.`,
    });
  }

  return faqs;
}
