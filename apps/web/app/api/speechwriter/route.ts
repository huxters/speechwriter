import { NextResponse } from 'next/server';
import { runSpeechwriterPipeline } from '../../../../../pipeline/runSpeechwriter';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const brief = body?.brief;

    if (!brief || typeof brief !== 'string' || !brief.trim()) {
      return NextResponse.json({ error: 'Please provide a short text brief.' }, { status: 400 });
    }

    // Hard cap to avoid someone pasting a novel in MVP
    if (brief.length > 2000) {
      return NextResponse.json(
        { error: 'Brief too long for MVP. Please keep it under 2000 characters.' },
        { status: 400 }
      );
    }

    const result = await runSpeechwriterPipeline(brief);

    return NextResponse.json(
      {
        finalSpeech: result.finalSpeech,
        planner: result.planner,
        judge: result.judge,
        trace: result.trace,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Speechwriter API error:', error);

    const msg = error?.message || '';

    if (msg === 'OPENAI_API_KEY_MISSING') {
      return NextResponse.json(
        {
          error: 'Server missing OPENAI_API_KEY. Add it to apps/web/.env.local and restart.',
        },
        { status: 500 }
      );
    }

    if (msg === 'DRAFTER_OUTPUT_INVALID' || msg === 'EDITOR_OUTPUT_EMPTY') {
      return NextResponse.json(
        {
          error: 'The AI returned an invalid intermediate result. Please try again.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ error: 'Unexpected error running pipeline.' }, { status: 500 });
  }
}
