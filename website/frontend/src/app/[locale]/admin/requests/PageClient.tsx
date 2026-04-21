'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { getAuthToken } from '@/lib/api/authApi';
import { apiAdminListRequests, type FormRequestRecord } from '@/lib/api/adminApi';

function formatDate(iso: string) {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function parsePayload(raw: string): Record<string, unknown> {
    try { return JSON.parse(raw); } catch { return {}; }
}

const TYPE_FILTERS = ['', 'contact', 'payment_request', 'language_request'] as const;

export default function AdminRequestsPage() {
    const t = useTranslations('adminRequests');
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [records, setRecords] = useState<FormRequestRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [expanded, setExpanded] = useState<number | null>(null);

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin')) router.push('/login');
    }, [authLoading, user, router]);

    const fetchData = useCallback(async () => {
        const token = getAuthToken();
        if (!token) return;
        setLoading(true);
        try { setRecords(await apiAdminListRequests(token, filter, 100)); } catch { /* */ }
        setLoading(false);
    }, [filter]);

    useEffect(() => { void fetchData(); }, [fetchData]);

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

                {/* Filter tabs */}
                <div className="forum-toolbar" style={{ marginBottom: 0 }}>
                    <div className="forum-toolbar-left">
                        {TYPE_FILTERS.map(f => (
                            <button
                                key={f || 'all'}
                                className={`forum-sort-btn${filter === f ? ' active' : ''}`}
                                onClick={() => setFilter(f)}
                            >
                                {f === '' ? t('all') : t(`type_${f}`)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="blog-admin-table-wrap">
                    {loading ? (
                        <div className="dashboard-loading"><div className="dashboard-loading-spinner" /></div>
                    ) : records.length === 0 ? (
                        <div className="forum-empty-state">
                            <div className="forum-empty-title">{t('noRecords')}</div>
                        </div>
                    ) : (
                        <table className="blog-admin-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>{t('colType')}</th>
                                    <th>{t('colDate')}</th>
                                    <th>{t('colIP')}</th>
                                    <th>{t('colDetails')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map(r => {
                                    const payload = parsePayload(r.payload);
                                    const isOpen = expanded === r.id;
                                    return (
                                        <tr key={r.id}>
                                            <td className="blog-admin-date">{r.id}</td>
                                            <td>
                                                <span className={`blog-admin-status blog-admin-status--${r.type === 'contact' ? 'published' : 'draft'}`}>
                                                    {r.type}
                                                </span>
                                            </td>
                                            <td className="blog-admin-date">{formatDate(r.createdAt)}</td>
                                            <td className="blog-admin-date">{r.ip}</td>
                                            <td>
                                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setExpanded(isOpen ? null : r.id)}>
                                                    {isOpen ? t('collapse') : t('expand')}
                                                </button>
                                                {isOpen && (
                                                    <pre className="admin-request-payload">{JSON.stringify(payload, null, 2)}</pre>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
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
