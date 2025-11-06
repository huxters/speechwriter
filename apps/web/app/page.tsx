// apps/web/app/page.tsx
// Root redirect for Speechwriter app: always send "/" → "/login"

import { redirect } from 'next/navigation';

export default function Home(): never {
  redirect('/login');
  // redirect() never returns; this satisfies TypeScript
  throw new Error('Redirecting...');
}
