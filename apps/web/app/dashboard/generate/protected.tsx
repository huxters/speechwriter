// apps/web/app/dashboard/generate/protected.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import GeneratePage from './page.client';

export default async function ProtectedGeneratePage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return <GeneratePage />;
}
