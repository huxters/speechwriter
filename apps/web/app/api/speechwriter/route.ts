// apps/web/app/api/speechwriter/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runSpeechwriterPipeline } from '../../../pipeline/runSpeechwriter';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // Auth: require logged-in user
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

    const { brief, audience, eventContext, tone, duration, keyPoints, redLines } = body as {
      brief?: string;
      audience?: string;
      eventContext?: string;
      tone?: string;
      duration?: string;
      keyPoints?: string;
      redLines?: string;
    };

    if (!brief || typeof brief !== 'string') {
      return NextResponse.json({ error: "Missing or invalid 'brief'" }, { status: 400 });
    }

    // Load latest global guardrails (if any). Fail-soft: pipeline can still run.
    let globalMustInclude: string[] = [];
    let globalMustAvoid: string[] = [];

    try {
      const { data: guardData, error: guardError } = await supabase
        .from('guardrails')
        .select('must_include, must_avoid')
        .eq('scope', 'global')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (!guardError && guardData && guardData.length > 0) {
        globalMustInclude = guardData[0].must_include || [];
        globalMustAvoid = guardData[0].must_avoid || [];
      } else if (guardError) {
        console.error('[/api/speechwriter] Error loading global guardrails:', guardError);
      }
    } catch (e) {
      console.error('[/api/speechwriter] Exception loading global guardrails:', e);
    }

    // Run pipeline
    const pipelineResult = await runSpeechwriterPipeline(brief, {
      audience,
      eventContext,
      tone,
      duration,
      keyPoints,
      redLines,
      globalMustInclude,
      globalMustAvoid,
    });

    // If pipeline failed to produce a final speech, return trace for debugging.
    if (!pipelineResult.finalSpeech) {
      return NextResponse.json(
        {
          error: 'Pipeline completed without a final speech. Please try again.',
          trace: pipelineResult.trace,
        },
        { status: 500 }
      );
    }

    // Persist speech + metadata
    let speechId: string | null = null;

    try {
      const { data, error } = await supabase
        .from('speeches')
        .insert({
          user_id: session.user.id,
          brief,
          final_speech: pipelineResult.finalSpeech,
          planner: pipelineResult.planner,
          judge: pipelineResult.judge,
          trace: pipelineResult.trace,
          drafts: pipelineResult.drafts,
        })
        .select('id')
        .single();

      if (error) {
        console.error('[/api/speechwriter] Error saving speech:', error);
      } else if (data?.id) {
        speechId = data.id;
      }
    } catch (err) {
      console.error('[/api/speechwriter] Exception saving speech:', err);
    }

    // Return full payload needed by frontend + admin
    return NextResponse.json(
      {
        finalSpeech: pipelineResult.finalSpeech,
        trace: pipelineResult.trace,
        drafts: pipelineResult.drafts, // { draft1, draft2, winnerLabel } or null
        judge: pipelineResult.judge, // { winner, reason } or null
        speechId, // may be null if save failed
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[/api/speechwriter] Unexpected error:', err);
    return NextResponse.json(
      {
        error: 'Unexpected error in pipeline.',
        details: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
