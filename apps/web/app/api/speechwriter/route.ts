import { NextResponse } from 'next/server';
import { runSpeechwriterPipeline } from '../../../../../pipeline/runSpeechwriter';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const brief = body?.brief;

    if (!brief || typeof brief !== 'string') {
      return NextResponse.json({ error: "Missing 'brief' in request body" }, { status: 400 });
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
    return NextResponse.json({ error: 'Internal error running pipeline' }, { status: 500 });
  }
}
