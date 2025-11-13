import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runSpeechwriterPipeline } from '../../../pipeline/runSpeechwriter';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      rawBrief,
      audience,
      eventContext,
      tone,
      duration,
      mustInclude,
      mustAvoid,
      anonUserId,
      // NEW: refinement context from the frontend
      previousVersionText,
      previousRequestText,
    } = body || {};

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.warn('supabase.auth.getUser error in /api/speechwriter:', userError.message);
    }

    const userId = user?.id ?? null;

    const result = await runSpeechwriterPipeline({
      userId,
      anonUserId: anonUserId || null,
      rawBrief,
      audience,
      eventContext,
      tone,
      duration,
      mustInclude,
      mustAvoid,
      // NEW: pass refinement hints down to the pipeline
      previousVersionText: previousVersionText || null,
      previousRequestText: previousRequestText || null,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error in /api/speechwriter:', err);
    return new NextResponse('Error running speechwriter pipeline', {
      status: 500,
    });
  }
}
