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
        }}
      >
        <Header />
        {children}
      </body>
    </html>
  );
}
