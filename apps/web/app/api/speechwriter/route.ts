import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runSpeechwriterPipeline } from '../../../pipeline/runSpeechwriter';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { brief, audience, eventContext, tone, duration, keyPoints, redLines } = body || {};

    if (!brief || typeof brief !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid brief' }, { status: 400 });
    }

    const pipelineResult = await runSpeechwriterPipeline(brief, {
      audience,
      eventContext,
      tone,
      duration,
      keyPoints,
      redLines,
    });

    if (!pipelineResult.finalSpeech) {
      return NextResponse.json(
        {
          error: 'Pipeline completed without a final speech. Please try again.',
          trace: pipelineResult.trace,
        },
        { status: 500 }
      );
    }

    try {
      const { error } = await supabase.from('speeches').insert({
        user_id: session.user.id,
        brief,
        final_speech: pipelineResult.finalSpeech,
        planner: pipelineResult.planner,
        judge: pipelineResult.judge,
        trace: pipelineResult.trace,
        drafts: pipelineResult.drafts,
      });

      if (error) {
        console.error('Error saving speech:', error);
      }
    } catch (err) {
      console.error('Unexpected error saving speech:', err);
    }

    return NextResponse.json(
      {
        finalSpeech: pipelineResult.finalSpeech,
        trace: pipelineResult.trace,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Pipeline error:', err);
    return NextResponse.json(
      {
        error: 'Unexpected error in pipeline.',
        details: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
