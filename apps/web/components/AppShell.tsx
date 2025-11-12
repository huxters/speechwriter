'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

type Props = { children: React.ReactNode };

export default function AppShell({ children }: Props) {
  const pathname = usePathname();

  const navLink = (href: string, label: string) => {
    const active = pathname === href || (href !== '/' && pathname?.startsWith(href));
    return (
      <Link
        href={href}
        style={{
          padding: '6px 10px',
          borderRadius: 8,
          fontSize: 13,
          textDecoration: 'none',
          color: active ? '#111827' : '#4b5563',
          background: active ? '#e5e7eb' : 'transparent',
          border: '1px solid ' + (active ? '#d1d5db' : 'transparent'),
        }}
      >
        {label}
      </Link>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f8' }}>
      {/* Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              aria-hidden
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                background: '#111827',
                boxShadow: '0 2px 8px rgba(17,24,39,0.15)',
              }}
            />
            <strong style={{ fontSize: 14, color: '#111827' }}>Speechwriter</strong>
          </div>

          <nav style={{ display: 'flex', gap: 8 }}>
            {navLink('/dashboard/generate', 'Generate')}
            {navLink('/admin', 'Admin')}
            {navLink('/about', 'About')}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main style={{ paddingTop: 12 }}>{children}</main>

      {/* Footer */}
      <footer
        style={{
          marginTop: 40,
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
    </div>
  );
}
