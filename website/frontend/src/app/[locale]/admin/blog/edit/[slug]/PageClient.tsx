'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { getAuthToken } from '@/lib/api/authApi';
import { apiGetBlogPost } from '@/lib/api/contentApi';
import { apiAdminUpdateBlogPost, type AdminBlogPost } from '@/lib/api/adminApi';
import BlogEditor from '../../BlogEditor';

export default function EditBlogPostPage({ slug }: { slug: string }) {
    const t = useTranslations('adminBlog');
    const defaultLocale = useLocale();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [locale, setLocale] = useState(defaultLocale);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [initial, setInitial] = useState<Partial<AdminBlogPost> | null>(null);
    const [loadingPost, setLoadingPost] = useState(true);

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin')) {
            router.push('/login');
        }
    }, [authLoading, user, router]);

    // Fetch existing post
    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoadingPost(true);
            try {
                const post = await apiGetBlogPost(locale, slug);
                if (!cancelled && post) {
                    setInitial({
                        slug: post.slug,
                        title: post.title,
                        excerpt: post.excerpt,
                        contentMd: post.contentMd,
                        coverUrl: post.coverUrl,
                        authorName: post.authorName,
                        tags: post.tags,
                        metaTitle: (post as AdminBlogPost).metaTitle,
                        metaDescription: (post as AdminBlogPost).metaDescription,
                        ogImageUrl: (post as AdminBlogPost).ogImageUrl,
                        status: (post as AdminBlogPost).status,
                    });
                }
            } catch { /* ignore */ }
            if (!cancelled) setLoadingPost(false);
        }
        void load();
        return () => { cancelled = true; };
    }, [locale, slug]);

    const handleSave = async (post: Parameters<typeof apiAdminUpdateBlogPost>[2], publish: boolean) => {
        const token = getAuthToken();
        if (!token) return;
        setSaving(true);
        setMsg(null);
        try {
            post.status = publish ? 'published' : 'draft';
            await apiAdminUpdateBlogPost(token, slug, post);
            setMsg({ type: 'success', text: publish ? t('postPublished') : t('draftSaved') });
            setTimeout(() => setMsg(null), 3000);
        } catch (err) {
            setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save' });
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || !user) return null;

    return (
        <div className="dashboard-page">
            <div className="dashboard-inner" style={{ maxWidth: 1100 }}>
                <h1 className="dashboard-profile-name">{t('editPost')}: {initial?.title || slug}</h1>
                {msg && <div className={`form-banner form-banner--${msg.type}`}>{msg.text}</div>}
                {loadingPost ? (
                    <div className="dashboard-loading"><div className="dashboard-loading-spinner" /></div>
                ) : initial ? (
                    <BlogEditor
                        initial={initial}
                        locale={locale}
                        onLocaleChange={setLocale}
                        onSave={handleSave}
                        saving={saving}
                    />
                ) : (
                    <p>{t('postNotFound')}</p>
                )}
            </div>
        </div>
    );
}
