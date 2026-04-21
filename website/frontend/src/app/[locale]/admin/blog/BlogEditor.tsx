'use client';

import { useCallback, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslations } from 'next-intl';
import { getAuthToken } from '@/lib/api/authApi';
import { apiUploadFile, type AdminBlogPost } from '@/lib/api/adminApi';

type BlogEditorProps = {
  initial?: Partial<AdminBlogPost>;
  locale: string;
  onLocaleChange: (locale: string) => void;
  onSave: (post: Partial<AdminBlogPost> & { locale: string }, publish: boolean) => Promise<void>;
  saving: boolean;
};

export default function BlogEditor({ initial, locale, onLocaleChange, onSave, saving }: BlogEditorProps) {
  const t = useTranslations('adminBlog');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    slug: initial?.slug || '',
    title: initial?.title || '',
    excerpt: initial?.excerpt || '',
    contentMd: initial?.contentMd || '',
    coverUrl: initial?.coverUrl || '',
    authorName: initial?.authorName || 'GCSS Team',
    tags: initial?.tags?.join(', ') || '',
    metaTitle: initial?.metaTitle || '',
    metaDescription: initial?.metaDescription || '',
    ogImageUrl: initial?.ogImageUrl || '',
  });

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const buildPost = useCallback((): Partial<AdminBlogPost> & { locale: string } => ({
    locale,
    slug: form.slug,
    title: form.title,
    excerpt: form.excerpt,
    contentMd: form.contentMd,
    coverUrl: form.coverUrl,
    authorName: form.authorName,
    tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    metaTitle: form.metaTitle,
    metaDescription: form.metaDescription,
    ogImageUrl: form.ogImageUrl,
  }), [form, locale]);

  const handleUpload = useCallback(async (file: File) => {
    const token = getAuthToken();
    if (!token) return;
    setUploading(true);
    try {
      const url = await apiUploadFile(token, file);
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const isVideo = ['mp4', 'webm'].includes(ext);
      const markdown = isVideo
        ? `\n<video src="${url}" controls width="100%"></video>\n`
        : `\n![${file.name}](${url})\n`;

      // Insert at cursor position
      const ta = textareaRef.current;
      if (ta) {
        const start = ta.selectionStart;
        const before = form.contentMd.slice(0, start);
        const after = form.contentMd.slice(start);
        set('contentMd', before + markdown + after);
      } else {
        set('contentMd', form.contentMd + markdown);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [form.contentMd]);

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

  return (
    <div className="blog-editor">
      {/* Top bar: locale tabs + slug */}
      <div className="blog-editor-topbar">
        <div className="blog-editor-locales">
          <button type="button" className={`blog-editor-locale${locale === 'en' ? ' active' : ''}`} onClick={() => onLocaleChange('en')}>EN</button>
          <button type="button" className={`blog-editor-locale${locale === 'zh' ? ' active' : ''}`} onClick={() => onLocaleChange('zh')}>ZH</button>
        </div>
        <input className="form-input blog-editor-slug" placeholder={t('slugPlaceholder')} value={form.slug} onChange={e => set('slug', e.target.value)} />
      </div>

      {/* Title */}
      <input className="form-input blog-editor-title-input" placeholder={t('titlePlaceholder')} value={form.title} onChange={e => set('title', e.target.value)} />

      {/* Excerpt */}
      <textarea className="form-input blog-editor-excerpt" placeholder={t('excerptPlaceholder')} rows={2} value={form.excerpt} onChange={e => set('excerpt', e.target.value)} />

      {/* Markdown editor */}
      <div className="blog-editor-md">
        <div className="blog-editor-md-tabs">
          <button type="button" className={tab === 'write' ? 'active' : ''} onClick={() => setTab('write')}>{t('write')}</button>
          <button type="button" className={tab === 'preview' ? 'active' : ''} onClick={() => setTab('preview')}>{t('preview')}</button>
          <label className="blog-editor-upload-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
            {uploading ? t('uploading') : t('uploadMedia')}
            <input type="file" accept="image/*,video/mp4,video/webm" onChange={handleFileInput} hidden />
          </label>
        </div>

        {tab === 'write' ? (
          <textarea
            ref={textareaRef}
            className="blog-editor-textarea"
            placeholder={t('contentPlaceholder')}
            value={form.contentMd}
            onChange={e => set('contentMd', e.target.value)}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
          />
        ) : (
          <div className="blog-editor-preview blog-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.contentMd || '*No content yet*'}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* Sidebar: meta fields */}
      <div className="blog-editor-meta">
        <h3 className="blog-editor-meta-title">{t('seoSettings')}</h3>

        <div className="form-group">
          <label className="form-label">{t('metaTitle')}</label>
          <input className="form-input" placeholder={t('metaTitlePlaceholder')} value={form.metaTitle} onChange={e => set('metaTitle', e.target.value)} />
          <span className="blog-editor-char-count">{form.metaTitle.length}/60</span>
        </div>

        <div className="form-group">
          <label className="form-label">{t('metaDescription')}</label>
          <textarea className="form-input" rows={3} placeholder={t('metaDescPlaceholder')} value={form.metaDescription} onChange={e => set('metaDescription', e.target.value)} />
          <span className="blog-editor-char-count">{form.metaDescription.length}/160</span>
        </div>

        <div className="form-group">
          <label className="form-label">{t('ogImage')}</label>
          <input className="form-input" placeholder="https://..." value={form.ogImageUrl} onChange={e => set('ogImageUrl', e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">{t('coverImage')}</label>
          <input className="form-input" placeholder="https://..." value={form.coverUrl} onChange={e => set('coverUrl', e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">{t('author')}</label>
          <input className="form-input" value={form.authorName} onChange={e => set('authorName', e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">{t('tags')}</label>
          <input className="form-input" placeholder="product, ocpp, payments" value={form.tags} onChange={e => set('tags', e.target.value)} />
        </div>
      </div>

      {/* Actions */}
      <div className="blog-editor-actions">
        <button type="button" className={`btn btn-secondary${saving ? ' btn-loading' : ''}`} disabled={saving} onClick={() => onSave(buildPost(), false)}>
          {t('saveDraft')}
        </button>
        <button type="button" className={`btn btn-primary${saving ? ' btn-loading' : ''}`} disabled={saving} onClick={() => onSave(buildPost(), true)}>
          {t('publish')}
        </button>
      </div>
    </div>
  );
}
