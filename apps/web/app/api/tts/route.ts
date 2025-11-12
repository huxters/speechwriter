import { NextResponse } from 'next/server';

export async function POST() {
  // Placeholder so the client never explodes if it calls /api/tts.
  return NextResponse.json(
    {
      message:
        'TTS backend not implemented yet. Frontend currently uses browser SpeechSynthesis when available.',
    },
    { status: 501 }
  );
}
