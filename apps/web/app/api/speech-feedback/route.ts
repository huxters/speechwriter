// apps/web/app/api/speech-feedback/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { speechId, judgeWinner, userChoice } = body as {
      speechId?: string | null;
      judgeWinner?: 'draft1' | 'draft2';
      userChoice?: 'draft1' | 'draft2';
    };

    if (!speechId) {
      return NextResponse.json({ error: 'Missing speechId' }, { status: 400 });
    }

    if (judgeWinner !== 'draft1' && judgeWinner !== 'draft2') {
      return NextResponse.json({ error: 'Invalid judgeWinner' }, { status: 400 });
    }

    if (userChoice !== 'draft1' && userChoice !== 'draft2') {
      return NextResponse.json({ error: 'Invalid userChoice' }, { status: 400 });
    }

    const agreement = judgeWinner === userChoice;

    const { error } = await supabase.from('speech_feedback').insert({
      speech_id: speechId,
      user_id: session.user.id,
      judge_winner: judgeWinner,
      user_choice: userChoice,
      agreement,
    });

    if (error) {
      console.error('[/api/speech-feedback] Error inserting feedback:', error);
      return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, agreement }, { status: 200 });
  } catch (err: any) {
    console.error('[/api/speech-feedback] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Unexpected error', details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
