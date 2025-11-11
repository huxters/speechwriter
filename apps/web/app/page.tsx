// apps/web/app/page.tsx

import GeneratePage from './dashboard/generate/page';

export default function HomePage() {
  // Root route uses the same experience as the Generate screen.
  // This keeps behaviour identical while making `/` the primary entrypoint.
  return <GeneratePage />;
}
