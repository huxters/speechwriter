'use client';

import React, { useEffect, useRef } from 'react';
import VersionCard, { VersionVM } from '@/components/VersionCard';

type Props = {
  versions: VersionVM[];
  onCopy: (text: string) => void;
  onExportPdf: (text: string) => void;
  onSpeak: (text: string) => void;
  onShare?: (text: string) => void;
};

export default function OutputThread({ versions, onCopy, onExportPdf, onSpeak, onShare }: Props) {
  const endRef = useRef<HTMLDivElement | null>(null);

  // Scroll to top when a new version is added (newest appears first)
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [versions?.length]);

  if (!versions || versions.length === 0) return null;

  // Reverse order so newest version appears directly under the lozenge
  const reversed = [...versions].reverse();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
      {reversed.map((v, idx) => (
        <VersionCard
          key={v.index ?? idx}
          version={v}
          expanded={idx === 0} // newest (topmost) expanded
          onCopy={() => onCopy(v.text)}
          onExportPdf={() => onExportPdf(v.text)}
          onSpeak={() => onSpeak(v.text)}
          onShare={() => onShare?.(v.text)}
        />
      ))}
      <div ref={endRef} />
    </div>
  );
}
