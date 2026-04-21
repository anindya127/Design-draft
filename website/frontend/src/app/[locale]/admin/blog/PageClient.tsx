'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { getAuthToken } from '@/lib/api/authApi';
import { apiAdminListBlogPosts, apiAdminDeleteBlogPost, type AdminBlogPost } from '@/lib/api/adminApi';

function formatDate(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AdminBlogPage() {
    const t = useTranslations('adminBlog');
    const locale = useLocale();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [posts, setPosts] = useState<AdminBlogPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin')) {
            router.push('/login');
        }
    }, [authLoading, user, router]);

    const fetchPosts = useCallback(async () => {
        const token = getAuthToken();
        if (!token) return;
        setLoading(true);
        try {
            const data = await apiAdminListBlogPosts(token, locale);
            setPosts(data);
        } catch { /* ignore */ }
        setLoading(false);
    }, [locale]);

    useEffect(() => { void fetchPosts(); }, [fetchPosts]);

    const handleDelete = async (slug: string) => {
        if (!confirm(t('deleteConfirm'))) return;
        const token = getAuthToken();
        if (!token) return;
        try {
            await apiAdminDeleteBlogPost(token, slug);
            setPosts(prev => prev.filter(p => p.slug !== slug));
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Delete failed');
        }
    };

    if (authLoading || !user) return null;

    return (
        <div className="dashboard-page">
            <div className="dashboard-inner">
                <div className="blog-admin-header">
                    <div>
                        <h1 className="dashboard-profile-name">{t('title')}</h1>
                        <p className="dashboard-profile-username">{t('subtitle')}</p>
                    </div>
                    <Link href="/admin/blog/new" className="btn btn-primary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" /></svg>
                        {t('newPost')}
                    </Link>
                </div>

                <div className="blog-admin-table-wrap">
                    {loading ? (
                        <div className="dashboard-loading">
                            <div className="dashboard-loading-spinner" />
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="forum-empty-state">
                            <div className="forum-empty-title">{t('noPosts')}</div>
                            <div className="forum-empty-desc">{t('noPostsDesc')}</div>
                        </div>
                    ) : (
                        <table className="blog-admin-table">
                            <thead>
                                <tr>
                                    <th>{t('colTitle')}</th>
                                    <th>{t('colStatus')}</th>
                                    <th>{t('colDate')}</th>
                                    <th>{t('colActions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {posts.map(post => (
                                    <tr key={post.slug}>
                                        <td>
                                            <div className="blog-admin-post-title">{post.title}</div>
                                            <div className="blog-admin-post-slug">/{post.slug}</div>
                                        </td>
                                        <td>
                                            <span className={`blog-admin-status blog-admin-status--${post.status}`}>
                                                {post.status === 'published' ? t('published') : t('draft')}
                                            </span>
                                        </td>
                                        <td className="blog-admin-date">{formatDate(post.publishedAt)}</td>
                                        <td>
                                            <div className="blog-admin-actions">
                                                <Link href={`/admin/blog/edit/${post.slug}`} className="btn btn-secondary btn-sm">{t('edit')}</Link>
                                                <button type="button" className="btn btn-secondary btn-sm btn-danger-outline" onClick={() => handleDelete(post.slug)}>{t('delete')}</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <Link href="/admin" className="blog-article-back" style={{ marginTop: 16 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                    {t('backToAdmin')}
                </Link>
            </div>
        </div>
    );
}
