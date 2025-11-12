'use client';

import React, { useCallback, useEffect, useRef } from 'react';

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
  // Optional hooks (additive)
  onUpload?: (files: FileList) => void;
  onMicClick?: () => void;
};

export default function PromptBar({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = 'Describe what you want to create…',
  onUpload,
  onMicClick,
}: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-grow textarea: one-line baseline, expands as needed
  const autoGrow = useCallback(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 240) + 'px'; // cap growth for sanity
  }, []);

  useEffect(() => {
    autoGrow();
  }, [value, autoGrow]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (disabled) return;
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (value.trim()) onSubmit();
      }
    },
    [disabled, onSubmit, value]
  );

  const triggerFile = useCallback(() => {
    if (disabled) return;
    fileRef.current?.click();
  }, [disabled]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length && onUpload) {
        onUpload(e.target.files);
      }
      if (fileRef.current) fileRef.current.value = '';
    },
    [onUpload]
  );

  const canSend = !!value.trim() && !disabled;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        border: '1px solid #e5e7eb',
        borderRadius: 20, // slightly more pill-like
        background: disabled ? '#f9fafb' : '#ffffff',
        boxShadow: '0 6px 18px rgba(17,24,39,0.06)',
      }}
    >
      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept=".pdf,.txt,.doc,.docx,image/*"
      />

      {/* Left: "+" upload (larger, centered) */}
      <button
        type="button"
        onClick={triggerFile}
        title="Upload (images or documents)"
        aria-label="Upload"
        disabled={disabled}
        style={{
          position: 'absolute',
          left: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          height: 32,
          width: 32,
          border: 'none',
          background: 'transparent',
          padding: 0,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <PlusIcon size={20} />
      </button>

      {/* Textarea: thin baseline, grows on overflow; larger font like ChatGPT */}
      <textarea
        ref={taRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={autoGrow}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        style={{
          width: '100%',
          border: 'none',
          outline: 'none',
          resize: 'none', // we control growth
          overflow: 'hidden',
          // Thin baseline: room for + (left) and mic+send (right)
          padding: '10px 112px 10px 48px',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
          fontSize: 16, // larger, ChatGPT-like
          lineHeight: 1.5,
          color: '#111827',
          background: 'transparent',
          minHeight: 44, // comfortable one-line height
        }}
      />

      {/* Right: mic (outline) + circular send (larger) */}
      <div
        style={{
          position: 'absolute',
          right: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {/* Mic */}
        <button
          type="button"
          aria-label="Speak"
          title="Speak (coming soon)"
          onClick={() => {
            if (!disabled && onMicClick) onMicClick();
          }}
          disabled={disabled}
          style={{
            height: 32,
            width: 32,
            borderRadius: 10,
            border: 'none',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <MicIcon size={20} />
        </button>

        {/* Send circle */}
        <button
          type="button"
          aria-label="Send"
          onClick={() => {
            if (canSend) onSubmit();
          }}
          disabled={!canSend}
          style={{
            height: 36,
            width: 36,
            borderRadius: '50%',
            border: 'none',
            background: canSend ? '#111827' : '#e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: canSend ? 'pointer' : 'not-allowed',
            transition: 'transform 120ms ease, opacity 120ms ease',
          }}
        >
          {disabled ? (
            <Spinner size={18} />
          ) : (
            <UpArrowIcon size={18} color={canSend ? '#ffffff' : '#9ca3af'} />
          )}
        </button>
      </div>
    </div>
  );
}

/* ——— Icons (scaled up to match ChatGPT feel) ——— */

function PlusIcon({ size = 20, color = '#111827' }: { size?: number; color?: string }) {
  const s = String(size);
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MicIcon({ size = 20, color = '#111827' }: { size?: number; color?: string }) {
  const s = String(size);
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 15a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3z"
        stroke={color}
        strokeWidth="2"
      />
      <path d="M19 11a7 7 0 0 1-14 0" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M12 19v2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function UpArrowIcon({ size = 18, color = '#ffffff' }: { size?: number; color?: string }) {
  const s = String(size);
  return (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 4l5.5 5.5a.75.75 0 1 1-1.06 1.06L10.75 6.87V16a.75.75 0 0 1-1.5 0V6.87L5.56 10.56a.75.75 0 0 1-1.06-1.06L10 4z"
        fill={color}
      />
    </svg>
  );
}

function Spinner({ size = 18 }: { size?: number }) {
  const s = String(size);
  return (
    <span
      aria-hidden
      style={{
        width: s,
        height: s,
        display: 'inline-block',
        borderRadius: '50%',
        border: '2px solid #c7d2fe',
        borderTopColor: '#2563eb',
        animation: 'spin 0.7s linear infinite',
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  );
}
