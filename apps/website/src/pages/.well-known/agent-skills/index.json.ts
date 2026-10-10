import type { APIRoute } from 'astro';
import {
  getSkillMarkdown,
  skillDescription,
  skillDigest,
} from '../../../lib/skill-content';
import { getActiveIconCount } from '../../../lib/package-facts';

export const prerender = true;

const SKILL_NAME = 'devicons';

export const GET: APIRoute = async () => {
  const body = await getSkillMarkdown();
  const digest = skillDigest(body);
  const description = skillDescription(await getActiveIconCount());

  const index = {
    $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
    skills: [
      {
        name: SKILL_NAME,
        type: 'skill-md',
        description,
        url: '/.well-known/agent-skills/devicons/SKILL.md',
        digest,
      },
    ],
  };

  return new Response(JSON.stringify(index, null, 2) + '\n', {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
    },
  });
};
