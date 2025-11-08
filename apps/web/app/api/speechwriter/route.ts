import { NextResponse } from 'next/server';
import { runSpeechwriterPipeline } from '../../../../../pipeline/runSpeechwriter';
import { createClient } from '@/lib/supabase/server';

type RequestBody = {
  brief?: string;
  audience?: string;
  eventContext?: string;
  tone?: string;
  duration?: string;
  keyPoints?: string;
  redLines?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody;

    const brief = (body.brief || '').trim();
    const audience = body.audience?.trim() || '';
    const eventContext = body.eventContext?.trim() || '';
    const tone = body.tone?.trim() || '';
    const duration = body.duration?.trim() || '';
    const keyPoints = body.keyPoints?.trim() || '';
    const redLines = body.redLines?.trim() || '';

    if (!brief) {
      return NextResponse.json({ error: 'Brief is required.' }, { status: 400 });
    }

    if (brief.length > 2000) {
      return NextResponse.json(
        {
          error: 'Brief is too long. Please shorten to 2000 characters or fewer.',
        },
        { status: 400 }
      );
    }

    const config = {
      audience: audience || undefined,
      eventContext: eventContext || undefined,
      tone: tone || undefined,
      duration: duration || undefined,
      keyPoints: keyPoints || undefined,
      redLines: redLines || undefined,
    };

    const result = await runSpeechwriterPipeline(brief, config);

    const finalSpeech = result.finalSpeech || '';
    const planner = result.planner ?? null;
    const judge = result.judge ?? null;
    const originalTrace = Array.isArray(result.trace) ? result.trace : [];

    if (!finalSpeech) {
      return NextResponse.json(
        {
          error: 'Pipeline completed without a final speech. Please try again.',
          trace: originalTrace,
        },
        { status: 500 }
      );
    }

    let trace = [...originalTrace];

    try {
      const supabase = await createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const userId = session?.user?.id;

      if (userId) {
        const { error: insertError } = await supabase.from('speeches').insert({
          user_id: userId,
          brief,
          audience: audience || null,
          event_context: eventContext || null,
          tone: tone || null,
          duration: duration || null,
          key_points: keyPoints || null,
          red_lines: redLines || null,
          final_speech: finalSpeech,
          planner,
          judge,
          trace,
        });

        if (insertError) {
          trace = [
            ...trace,
            {
              stage: 'persistence',
              message: `Warning: failed to save speech (${insertError.message})`,
            },
          ];
        } else {
          trace = [
            ...trace,
            {
              stage: 'persistence',
              message: 'Saved speech to history for current user.',
            },
          ];
        }
      } else {
        trace = [
          ...trace,
          {
            stage: 'persistence',
            message: 'No authenticated user; skipping save to speeches history.',
          },
        ];
      }
    } catch (err: any) {
      trace = [
        ...trace,
        {
          stage: 'persistence',
          message: `Warning: unexpected error during save (${err?.message || 'unknown error'})`,
        },
      ];
    }

    return NextResponse.json(
      {
        finalSpeech,
        planner,
        judge,
        trace,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        error: err?.message || 'Unexpected error while processing speech request.',
      },
      { status: 500 }
    );
  }
}
