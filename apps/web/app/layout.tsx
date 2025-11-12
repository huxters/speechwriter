import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'Speechwriter',
  description: 'Structured, production-grade speechwriting environment.',
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          background: 'transparent',
          color: 'var(--text-main)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Header />

        {/* Unified page container */}
        <main style={{ flex: 1 }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '12px 20px 60px' }}>
            {children}
          </div>
        </main>

        {/* Lightweight footer (additive) */}
        <footer
          style={{
            borderTop: '1px solid #e5e7eb',
            background: 'white',
          }}
        >
          <div
            style={{
              maxWidth: 1100,
              margin: '0 auto',
              padding: '12px 20px',
              color: '#6b7280',
              fontSize: 12,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>© {new Date().getFullYear()} Speechwriter</span>
            <span>Planner → Drafter → Judge → Guardrail → Editor</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
