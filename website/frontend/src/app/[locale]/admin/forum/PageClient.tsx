'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { getAuthToken } from '@/lib/api/authApi';
import { apiAdminListForumTopics, apiAdminDeleteForumTopic, type AdminForumTopic } from '@/lib/api/adminApi';

function formatDate(iso: string) {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AdminForumPage() {
    const t = useTranslations('adminForum');
    const locale = useLocale();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [topics, setTopics] = useState<AdminForumTopic[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin')) router.push('/login');
    }, [authLoading, user, router]);

    const fetchTopics = useCallback(async () => {
        const token = getAuthToken();
        if (!token) return;
        setLoading(true);
        try { setTopics(await apiAdminListForumTopics(token, locale)); } catch { /* */ }
        setLoading(false);
    }, [locale]);

    useEffect(() => { void fetchTopics(); }, [fetchTopics]);

    const handleDelete = async (id: number, title: string) => {
        if (!confirm(t('deleteConfirm', { title }))) return;
        const token = getAuthToken();
        if (!token) return;
        try {
            await apiAdminDeleteForumTopic(token, id);
            setTopics(prev => prev.filter(x => x.id !== id));
        } catch (err) { alert(err instanceof Error ? err.message : 'Failed'); }
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
                </div>

                <div className="blog-admin-table-wrap">
                    {loading ? (
                        <div className="dashboard-loading"><div className="dashboard-loading-spinner" /></div>
                    ) : topics.length === 0 ? (
                        <div className="forum-empty-state">
                            <div className="forum-empty-title">{t('noTopics')}</div>
                        </div>
                    ) : (
                        <table className="blog-admin-table">
                            <thead>
                                <tr>
                                    <th>{t('colTitle')}</th>
                                    <th>{t('colAuthor')}</th>
                                    <th>{t('colReplies')}</th>
                                    <th>{t('colDate')}</th>
                                    <th>{t('colActions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topics.map(topic => (
                                    <tr key={topic.id}>
                                        <td>
                                            <div className="blog-admin-post-title">{topic.title}</div>
                                            <div className="blog-admin-post-slug">{topic.categorySlug}/{topic.slug}</div>
                                        </td>
                                        <td className="blog-admin-date">{topic.authorName}</td>
                                        <td className="blog-admin-date">{topic.replyCount}</td>
                                        <td className="blog-admin-date">{formatDate(topic.createdAt)}</td>
                                        <td>
                                            <button type="button" className="btn btn-secondary btn-sm btn-danger-outline" onClick={() => handleDelete(topic.id, topic.title)}>
                                                {t('delete')}
                                            </button>
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
