'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { apiLogout, apiMe, getAuthToken, setAuthToken, type AuthUser } from '@/lib/api/authApi';
import { apiAdminOverview, type AdminOverview } from '@/lib/api/adminApi';

function formatNumber(n: number | undefined) {
    if (typeof n !== 'number' || Number.isNaN(n)) return '—';
    return n.toLocaleString();
}

export default function AdminPageClient() {
    const t = useTranslations();
    const router = useRouter();

    const [me, setMe] = useState<AuthUser | null>(null);
    const [overview, setOverview] = useState<AdminOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');

    const kpis = useMemo(() => {
        return [
            { key: 'users', label: t('admin.kpis.users'), value: formatNumber(overview?.usersTotal) },
            { key: 'admins', label: t('admin.kpis.admins'), value: formatNumber(overview?.adminsTotal) },
            { key: 'sessions', label: t('admin.kpis.sessions'), value: formatNumber(overview?.sessionsActive) },
            { key: 'forms', label: t('admin.kpis.formRequests'), value: formatNumber(overview?.formRequestsTotal) },
            { key: 'blog', label: t('admin.kpis.blogPosts'), value: formatNumber(overview?.blogPostsTotal) },
            { key: 'topics', label: t('admin.kpis.forumTopics'), value: formatNumber(overview?.forumTopicsTotal) },
            { key: 'posts', label: t('admin.kpis.forumPosts'), value: formatNumber(overview?.forumPostsTotal) },
        ];
    }, [overview, t]);

    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
            router.replace('/login');
            return;
        }

        const authToken = token;

        let cancelled = false;

        async function load() {
            try {
                setLoading(true);
                setError('');

                const meResp = await apiMe(authToken);
                if (cancelled) return;

                const role = (meResp.user?.role || '').toLowerCase();
                if (role !== 'admin') {
                    router.replace('/demo');
                    return;
                }

                setMe(meResp.user);

                const overviewResp = await apiAdminOverview(authToken);
                if (cancelled) return;
                setOverview(overviewResp.overview);
            } catch {
                if (cancelled) return;
                setAuthToken(null);
                setError(t('admin.errors.unauthorized'));
                router.replace('/login');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void load();

        return () => {
            cancelled = true;
        };
    }, [router, t]);

    const onLogout = async () => {
        const token = getAuthToken();
        setAuthToken(null);
        try {
            if (token) await apiLogout(token);
        } catch {
            // ignore
        }
        router.replace('/login');
    };

    return (
        <section className="admin-page">
            <div className="admin-bg" aria-hidden="true" />

            <div className="container">
                <div className="admin-header">
                    <div>
                        <h1 className="admin-title">{t('admin.title')}</h1>
                        <p className="admin-subtitle">{t('admin.subtitle')}</p>
                        {me && (
                            <div className="admin-meta">
                                <span className="admin-chip">{t('admin.signedInAs', { username: me.username })}</span>
                                <span className="admin-chip admin-chip-gold">{(me.role || 'admin').toUpperCase()}</span>
                            </div>
                        )}
                    </div>

                    <div className="admin-actions">
                        <Link className="btn btn-outline" href="/">
                            {t('admin.actions.backToSite')}
                        </Link>
                        <button type="button" className="btn btn-secondary" onClick={onLogout}>
                            {t('admin.actions.logout')}
                        </button>
                    </div>
                </div>

                {error && <div className="admin-alert admin-alert-error">{error}</div>}

                {loading ? (
                    <div className="admin-loading glass-card">{t('admin.loading')}</div>
                ) : (
                    <>
                        <div className="admin-kpi-grid">
                            {kpis.map((k) => (
                                <div key={k.key} className="glass-card admin-kpi">
                                    <div className="admin-kpi-label">{k.label}</div>
                                    <div className="admin-kpi-value">{k.value}</div>
                                </div>
                            ))}
                        </div>

                        <div className="admin-nav-grid">
                            <Link href="/admin/users" className="dashboard-quicklink">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                <span>{t('admin.nav.users')}</span>
                            </Link>
                            <Link href="/admin/blog" className="dashboard-quicklink">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                <span>{t('admin.nav.blog')}</span>
                            </Link>
                            <Link href="/admin/forum" className="dashboard-quicklink">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                <span>{t('admin.nav.forum')}</span>
                            </Link>
                            <Link href="/admin/requests" className="dashboard-quicklink">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /></svg>
                                <span>{t('admin.nav.requests')}</span>
                            </Link>
                            <Link href="/admin/settings" className="dashboard-quicklink">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
                                <span>{t('admin.nav.settings')}</span>
                            </Link>
                            <Link href="/admin/products" className="dashboard-quicklink">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7h-9M14 17H5" /><circle cx="17" cy="17" r="3" /><circle cx="7" cy="7" r="3" /></svg>
                                <span>{t('admin.nav.products')}</span>
                            </Link>
                            <Link href="/admin/orders" className="dashboard-quicklink">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="15" y2="17" /></svg>
                                <span>{t('admin.nav.orders')}</span>
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}
