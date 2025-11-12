'use client';

import React from 'react';

type Props = {
  message: string;
  visible?: boolean;
};

export default function NarrationFeed({ message, visible = true }: Props) {
  return (
    <div
      aria-live="polite"
      style={{
        minHeight: 18,
        marginTop: 8,
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
        fontSize: 13,
        lineHeight: 1.5,
        color: '#6b7280',
        opacity: visible && message ? 1 : 0,
        transition: 'opacity 200ms ease',
      }}
    >
      {message}
    </div>
  );
}
