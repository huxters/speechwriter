// apps/web/app/api/speechwriter/history/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_req: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.warn('supabase.auth.getUser error in /api/speechwriter/history:', userError.message);
    }

    if (!user) {
      // No authenticated user – return empty history for now
      return NextResponse.json({ items: [] });
    }

    const { data, error } = await supabase
      .from('speeches')
      .select('id, brief, final_speech, trace, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(25);

    if (error) {
      console.error('Error fetching speeches history:', error.message);
      return NextResponse.json({ items: [] });
    }

    return NextResponse.json({
      items: (data || []).map(row => ({
        id: row.id,
        brief: row.brief,
        final_speech: row.final_speech,
        trace: row.trace,
        created_at: row.created_at,
      })),
    });
  } catch (err: any) {
    console.error('Unhandled error in /api/speechwriter/history:', err);
    return new NextResponse('Error fetching speechwriter history', { status: 500 });
  }
}
