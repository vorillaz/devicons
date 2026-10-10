import type { APIRoute } from 'astro';
import { SITE_URL } from '../consts';
import {
  buildDocMarkdown,
  buildDocsIndexMarkdown,
  getSortedDocPages,
} from '../lib/agent-md/docs-md';
import { getSkillMarkdown } from '../lib/skill-content';

export const prerender = true;

// Everything an agent needs in one request: the docs index, every doc page,
// and SKILL.md — produced by the same generators as the individual .md routes.
export const GET: APIRoute = async () => {
  const sections: Array<{ url: string; body: string }> = [];

  const index = await buildDocsIndexMarkdown();
  if (index) sections.push({ url: `${SITE_URL}/docs.md`, body: index });

  for (const entry of await getSortedDocPages()) {
    sections.push({
      url: `${SITE_URL}/docs/${entry.id}.md`,
      body: await buildDocMarkdown(entry),
    });
  }

  sections.push({ url: `${SITE_URL}/skill.md`, body: await getSkillMarkdown() });

  const out = [
    '# Devicons — full documentation',
    '',
    `> Concatenation of ${sections.length} Markdown documents from ${SITE_URL}. Each section starts with its source URL. Index: ${SITE_URL}/llms.txt`,
    '',
    ...sections.map(s => `---\nsource: ${s.url}\n---\n\n${s.body.trim()}\n`),
  ].join('\n');

  return new Response(out, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
    },
  });
};
