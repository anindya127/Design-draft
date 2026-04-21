'use client';

import { useCallback, useRef, useState } from 'react';
import { apiUploadImage } from '@/lib/api/contentApi';

type ForumComposerProps = {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  allowUpload?: boolean;
};

function insertAtCursor(textarea: HTMLTextAreaElement, before: string, after = '') {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.substring(start, end);
  const replacement = before + (selected || '') + after;
  const newValue = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
  return { newValue, cursorPos: start + before.length + (selected || '').length };
}

export default function ForumComposer({ id, value, onChange, placeholder, disabled, allowUpload }: ForumComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const wrap = useCallback((before: string, after = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const { newValue, cursorPos } = insertAtCursor(ta, before, after);
    onChange(newValue);
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(cursorPos, cursorPos); });
  }, [onChange]);

  const handleUpload = useCallback(async (file: File) => {
    if (!allowUpload) return;
    setUploading(true);
    try {
      const res = await apiUploadImage(file);
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const isVideo = ['mp4', 'webm'].includes(ext);
      const md = isVideo ? `\n<video src="${res.url}" controls width="100%"></video>\n` : `![${file.name}](${res.url})`;
      const ta = textareaRef.current;
      if (ta) {
        const pos = ta.selectionStart;
        const newVal = value.substring(0, pos) + md + value.substring(pos);
        onChange(newVal);
      } else {
        onChange(value + md);
      }
    } catch { /* ignore */ }
    finally { setUploading(false); }
  }, [allowUpload, value, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = '';
  }, [handleUpload]);

  const tools: { icon: React.ReactNode; action: () => void; label: string }[] = [
    { label: 'Bold', icon: <strong>B</strong>, action: () => wrap('**', '**') },
    { label: 'Italic', icon: <em>I</em>, action: () => wrap('_', '_') },
    { label: 'Code', icon: <span style={{ fontFamily: 'var(--font-mono)' }}>&lt;/&gt;</span>, action: () => wrap('`', '`') },
    { label: 'Link', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>, action: () => wrap('[', '](url)') },
    { label: 'List', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>, action: () => wrap('\n- ') },
  ];

  return (
    <div className={`fc-wrap${disabled ? ' fc-disabled' : ''}`}>
      <textarea
        ref={textareaRef}
        id={id}
        className="fc-textarea"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={3}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
      />
      <div className="fc-toolbar">
        {allowUpload && (
          <>
            <button type="button" className="fc-tool fc-tool--upload" onClick={() => fileRef.current?.click()} disabled={disabled || uploading} aria-label="Upload">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="16"/><line x1="8" x2="16" y1="12" y2="12"/></svg>
            </button>
            <input ref={fileRef} type="file" accept="image/*,video/mp4,video/webm" onChange={handleFileInput} hidden />
            <div className="fc-divider" />
          </>
        )}
        {tools.map(t => (
          <button key={t.label} type="button" className="fc-tool" onClick={t.action} disabled={disabled} aria-label={t.label}>
            {t.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
