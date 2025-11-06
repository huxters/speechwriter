import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OUTLINE_SYSTEM, outlineUserPrompt } from '@/lib/prompts/outline';
import { DRAFT_SYSTEM, draftUserPrompt } from '@/lib/prompts/draft';
import { REFINE_SYSTEM, refineUserPrompt } from '@/lib/prompts/refine';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

export async function POST(req: NextRequest) {
  try {
    // Ensure user session (RLS context)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { type, intake, outline, draft, refinementRequest } = (await req.json()) as {
      type: 'outline' | 'draft' | 'refine';
      intake?: any;
      outline?: any;
      draft?: string;
      refinementRequest?: string;
    };

    if (!type || !['outline', 'draft', 'refine'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    // Build prompts (from Dan’s templates)
    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'outline') {
      if (!intake) return NextResponse.json({ error: 'Missing intake' }, { status: 400 });
      systemPrompt = OUTLINE_SYSTEM;
      userPrompt = outlineUserPrompt(intake);
    } else if (type === 'draft') {
      if (!intake || !outline) {
        return NextResponse.json({ error: 'Missing intake/outline' }, { status: 400 });
      }
      systemPrompt = DRAFT_SYSTEM;
      userPrompt = draftUserPrompt(intake, outline);
    } else {
      if (!draft || !refinementRequest) {
        return NextResponse.json({ error: 'Missing draft/refinementRequest' }, { status: 400 });
      }
      systemPrompt = REFINE_SYSTEM;
      userPrompt = refineUserPrompt(draft, refinementRequest);
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });
    }

    // Call the LLM
    const llmRes = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!llmRes.ok) {
      const text = await llmRes.text();
      return NextResponse.json({ error: `LLM error: ${text}` }, { status: llmRes.status });
    }

    const data = await llmRes.json();
    const content = data.choices?.[0]?.message?.content ?? '';
    return NextResponse.json({ content });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}
