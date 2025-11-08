// apps/web/src/app/api/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OUTLINE_SYSTEM, outlineUserPrompt } from '@/lib/prompts/outline';
import { DRAFT_SYSTEM, draftUserPrompt } from '@/lib/prompts/draft';
import { REFINE_SYSTEM, refineUserPrompt } from '@/lib/prompts/refine';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

type GenerateType = 'outline' | 'draft' | 'refine';

type PromptProfile = {
  system_prompt: string;
  user_template: string;
  model: string;
  temperature: number;
  max_tokens: number;
};

function ensureEnv() {
  if (!OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY');
  }
}

function fallbackSystemPrompt(type: GenerateType): string {
  switch (type) {
    case 'outline':
      return OUTLINE_SYSTEM;
    case 'draft':
      return DRAFT_SYSTEM;
    case 'refine':
      return REFINE_SYSTEM;
    default:
      return OUTLINE_SYSTEM;
  }
}

/**
 * Build the user prompt using our existing helpers.
 * (We ignore user_template for now; we can wire that in later
 * without touching callers.)
 */
function buildUserPrompt(type: GenerateType, body: any): string {
  switch (type) {
    case 'outline':
      return outlineUserPrompt(body.intake);
    case 'draft':
      return draftUserPrompt(body.intake, body.outline);
    case 'refine':
      return refineUserPrompt(body.draft, body.refinementRequest);
    default:
      throw new Error(`Unsupported generation type: ${type}`);
  }
}

/**
 * Fetch the active prompt profile for a given stage/key.
 * Keys: 'outline' | 'draft' | 'refine'
 */
async function getPromptProfile(type: GenerateType): Promise<PromptProfile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('prompt_profiles')
    .select('system_prompt, user_template, model, temperature, max_tokens')
    .eq('key', type)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('[prompt_profiles] fetch error:', error.message);
    return null;
  }

  if (!data) return null;

  // Defensive defaults in case older rows are missing fields
  return {
    system_prompt: data.system_prompt,
    user_template: data.user_template ?? '',
    model: data.model ?? 'gpt-4.1-mini',
    temperature: typeof data.temperature === 'number' ? data.temperature : 0.4,
    max_tokens: typeof data.max_tokens === 'number' ? data.max_tokens : 2048,
  };
}

async function callOpenAI(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  max_tokens: number
): Promise<string> {
  ensureEnv();

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('[OpenAI] Error:', response.status, text);
    throw new Error(`OpenAI request failed with status ${response.status}`);
  }

  const json = await response.json();
  const content = json.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No content returned from OpenAI');
  }

  return content;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const type = body.type as GenerateType;

    if (!type || !['outline', 'draft', 'refine'].includes(type)) {
      return NextResponse.json(
        {
          error: 'Invalid type. Expected one of: outline | draft | refine.',
        },
        { status: 400 }
      );
    }

    // Build user prompt from request body
    const userPrompt = buildUserPrompt(type, body);

    // Try to load a profile from Supabase
    const profile = await getPromptProfile(type);

    const systemPrompt = profile?.system_prompt ?? fallbackSystemPrompt(type);
    const model = profile?.model ?? 'gpt-4.1-mini';
    const temperature = profile?.temperature ?? 0.4;
    const max_tokens = profile?.max_tokens ?? 2048;

    const content = await callOpenAI(model, systemPrompt, userPrompt, temperature, max_tokens);

    return NextResponse.json({ content });
  } catch (error: any) {
    console.error('[API /generate] error:', error);
    return NextResponse.json({ error: error?.message || 'Generation failed' }, { status: 500 });
  }
}
