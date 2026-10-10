import {
  FONT_PKG_NAME,
  FONT_PKG_VERSION,
  CORE_PKG_NAME,
  CORE_PKG_VERSION,
} from '../pkg-versions';

type CdnProvider = 'unpkg' | 'jsdelivr' | 'npmmirror' | 'skypack';

const CDN_PROVIDERS: Record<
  CdnProvider,
  { label: string; build: (pkg: string, version: string, path: string) => string }
> = {
  unpkg: {
    label: 'UNPKG',
    build: (pkg, version, path) => `https://unpkg.com/${pkg}@${version}/${path}`,
  },
  jsdelivr: {
    label: 'jsDelivr',
    build: (pkg, version, path) =>
      `https://cdn.jsdelivr.net/npm/${pkg}@${version}/${path}`,
  },
  npmmirror: {
    label: 'npmmirror',
    build: (pkg, version, path) =>
      `https://registry.npmmirror.com/${pkg}/${version}/files/${path}`,
  },
  skypack: {
    label: 'Skypack',
    build: (pkg, version) => `https://cdn.skypack.dev/${pkg}@${version}`,
  },
};

const PROVIDER_ORDER: CdnProvider[] = [
  'unpkg',
  'jsdelivr',
  'npmmirror',
  'skypack',
];

const VAR_CONTEXT: Record<string, string> = {
  FONT_PKG_NAME,
  FONT_PKG_VERSION,
  CORE_PKG_NAME,
  CORE_PKG_VERSION,
};

function stripFrontmatter(src: string): string {
  return src.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
}

function stripImports(src: string): string {
  // Matches `import ... from '...';` and `import ... from "...";`, including
  // multi-line named imports (`import { a,\n b } from "...";`).
  return src.replace(
    /^\s*import\s+(?:[^'";]|'[^']*'|"[^"]*")+?\s+from\s+["'][^"']+["'];?\s*$/gm,
    '',
  );
}

function resolveProp(value: string): string {
  // `value` is the raw prop value without its wrapping braces or quotes.
  // Examples: `FONT_PKG_NAME` (identifier), `"css/devicons.min.css"` (string),
  // or a template literal wrapped in backticks (handled upstream).
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  if (trimmed in VAR_CONTEXT) return VAR_CONTEXT[trimmed];
  return trimmed;
}

function parseJsxProps(tagBody: string): Record<string, string> {
  // Extract key={expr}, key="str", key='str', and bare-boolean flags from a
  // JSX tag body. Handles {`template`} (backtick) by pairing braces correctly.
  const props: Record<string, string> = {};
  let i = 0;
  while (i < tagBody.length) {
    // Skip whitespace
    while (i < tagBody.length && /\s/.test(tagBody[i])) i++;
    if (i >= tagBody.length) break;
    // Read name
    const nameStart = i;
    while (i < tagBody.length && /[\w:-]/.test(tagBody[i])) i++;
    const name = tagBody.slice(nameStart, i);
    if (!name) break;
    // Skip whitespace
    while (i < tagBody.length && /\s/.test(tagBody[i])) i++;
    if (tagBody[i] !== '=') {
      props[name] = 'true';
      continue;
    }
    i++; // consume '='
    while (i < tagBody.length && /\s/.test(tagBody[i])) i++;
    const ch = tagBody[i];
    if (ch === '{') {
      // Pair braces, honoring backtick strings inside.
      let depth = 1;
      let j = i + 1;
      let inBacktick = false;
      while (j < tagBody.length && depth > 0) {
        const c = tagBody[j];
        if (c === '`') inBacktick = !inBacktick;
        else if (!inBacktick) {
          if (c === '{') depth++;
          else if (c === '}') depth--;
        }
        if (depth > 0) j++;
      }
      const raw = tagBody.slice(i + 1, j);
      if (raw.startsWith('`') && raw.endsWith('`')) {
        props[name] = raw.slice(1, -1);
      } else {
        props[name] = resolveProp(raw);
      }
      i = j + 1;
    } else if (ch === '"' || ch === "'") {
      const quote = ch;
      let j = i + 1;
      while (j < tagBody.length && tagBody[j] !== quote) j++;
      props[name] = tagBody.slice(i + 1, j);
      i = j + 1;
    } else {
      break;
    }
  }
  return props;
}

function renderCdnTabs(tagBody: string): string {
  const props = parseJsxProps(tagBody);
  const pkg = props.pkg;
  const version = props.version ?? 'latest';
  const path = props.path ?? '';
  const fragment = props.fragment ?? '';
  const template = props.template ?? '{url}';
  if (!pkg) return '';

  const providersProp = props.providers;
  const providers = providersProp
    ? (providersProp
        .replace(/^\s*\[|\]\s*$/g, '')
        .split(',')
        .map(s => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean) as CdnProvider[])
    : PROVIDER_ORDER;

  const blocks: string[] = [];
  for (const p of providers) {
    const provider = CDN_PROVIDERS[p];
    if (!provider) continue;
    const url = provider.build(pkg, version, path) + fragment;
    const rendered = template.replaceAll('{url}', url);
    blocks.push(`**${provider.label}**\n\n\`\`\`html\n${rendered}\n\`\`\``);
  }
  return blocks.join('\n\n');
}

function findSelfClosingTag(
  src: string,
  tagName: string,
  startIdx: number,
): { start: number; end: number; body: string } | null {
  const opener = `<${tagName}`;
  const openIdx = src.indexOf(opener, startIdx);
  if (openIdx < 0) return null;
  // Ensure it's a word boundary after the tag name.
  const after = src[openIdx + opener.length];
  if (after && /[\w-]/.test(after)) return null;
  let i = openIdx + opener.length;
  let braceDepth = 0;
  let inBacktick = false;
  let inString: '"' | "'" | null = null;
  while (i < src.length) {
    const ch = src[i];
    if (inBacktick) {
      if (ch === '`') inBacktick = false;
      i++;
      continue;
    }
    if (inString) {
      if (ch === inString) inString = null;
      i++;
      continue;
    }
    if (ch === '`' && braceDepth > 0) {
      inBacktick = true;
      i++;
      continue;
    }
    if ((ch === '"' || ch === "'") && braceDepth === 0) {
      inString = ch;
      i++;
      continue;
    }
    if (ch === '{') {
      braceDepth++;
      i++;
      continue;
    }
    if (ch === '}') {
      braceDepth--;
      i++;
      continue;
    }
    if (braceDepth === 0 && ch === '/' && src[i + 1] === '>') {
      return {
        start: openIdx,
        end: i + 2,
        body: src.slice(openIdx + opener.length, i),
      };
    }
    if (braceDepth === 0 && ch === '>') {
      // Opening tag without self-close — not what this helper is for.
      return null;
    }
    i++;
  }
  return null;
}

function replaceCdnTabs(src: string): string {
  let out = '';
  let cursor = 0;
  while (cursor < src.length) {
    const found = findSelfClosingTag(src, 'CdnTabs', cursor);
    if (!found) {
      out += src.slice(cursor);
      break;
    }
    out += src.slice(cursor, found.start);
    out += renderCdnTabs(found.body);
    cursor = found.end;
  }
  return out;
}

function replaceNotes(src: string): string {
  // Matches `<Note ...props>\n\n body \n\n</Note>`.
  const re = /<Note\b([^>]*)>([\s\S]*?)<\/Note>/g;
  return src.replace(re, (_, rawProps: string, body: string) => {
    const props = parseJsxProps(rawProps);
    const title = props.title ?? 'Note';
    const variant = props.variant ?? 'note';
    const inner = body.trim();
    const prefixed = inner
      .split('\n')
      .map(line => (line ? `> ${line}` : '>'))
      .join('\n');
    return `> **${title}** _(${variant})_\n>\n${prefixed}`;
  });
}

function stripIconPreviews(src: string): string {
  // Remove inline icon preview components: <ReactIcon .../>, <VueIcon .../>,
  // <SvelteIcon .../>, <GithubIcon .../>, <GithubLightIcon .../>.
  // Some MDX uses the closing form too (`<ReactIcon>...</ReactIcon>`).
  const names = [
    'ReactIcon',
    'VueIcon',
    'SvelteIcon',
    'GithubIcon',
    'GithubLightIcon',
  ];
  let out = src;
  for (const n of names) {
    out = out.replace(new RegExp(`<${n}\\b[^>]*?/>`, 'g'), '');
    out = out.replace(new RegExp(`<${n}\\b[^>]*?>[\\s\\S]*?</${n}>`, 'g'), '');
  }
  return out;
}

function collapseBlankLines(src: string): string {
  return src.replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

/**
 * Segment the source into alternating code-fence and prose spans. We only want
 * to apply MDX-tag transforms to prose regions so examples like
 * `<VueIcon :size="48" />` inside a code block are preserved verbatim.
 */
function transformProseOnly(
  src: string,
  fn: (prose: string) => string,
): string {
  const fenceRe = /```[\s\S]*?```/g;
  let out = '';
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = fenceRe.exec(src))) {
    out += fn(src.slice(last, m.index));
    out += m[0];
    last = m.index + m[0].length;
  }
  out += fn(src.slice(last));
  return out;
}

export function mdxToMd(raw: string): string {
  let out = stripFrontmatter(raw);
  out = transformProseOnly(out, prose => {
    let p = prose;
    p = stripImports(p);
    p = replaceCdnTabs(p);
    p = replaceNotes(p);
    p = stripIconPreviews(p);
    return p;
  });
  return collapseBlankLines(out);
}
