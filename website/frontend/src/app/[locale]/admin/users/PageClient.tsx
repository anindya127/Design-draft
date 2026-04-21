'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { getAuthToken } from '@/lib/api/authApi';
import { apiAdminListUsers, apiAdminSetUserRole, apiAdminSetUserDisabled, type AdminUser } from '@/lib/api/adminApi';

function formatDate(iso: string) {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AdminUsersPage() {
    const t = useTranslations('adminUsers');
    const router = useRouter();
    const { user: me, loading: authLoading } = useAuth();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && (!me || me.role !== 'admin')) router.push('/login');
    }, [authLoading, me, router]);

    const fetch = useCallback(async () => {
        const token = getAuthToken();
        if (!token) return;
        setLoading(true);
        try { setUsers(await apiAdminListUsers(token)); } catch { /* */ }
        setLoading(false);
    }, []);

    useEffect(() => { void fetch(); }, [fetch]);

    const toggleRole = async (u: AdminUser) => {
        const token = getAuthToken();
        if (!token) return;
        const newRole = u.role === 'admin' ? 'user' : 'admin';
        try {
            await apiAdminSetUserRole(token, u.id, newRole);
            setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: newRole } : x));
        } catch (err) { alert(err instanceof Error ? err.message : 'Failed'); }
    };

    const toggleDisable = async (u: AdminUser) => {
        const token = getAuthToken();
        if (!token) return;
        const disable = !u.disabledAt;
        if (disable && !confirm(t('disableConfirm', { name: u.username }))) return;
        try {
            await apiAdminSetUserDisabled(token, u.id, disable);
            setUsers(prev => prev.map(x => x.id === u.id ? { ...x, disabledAt: disable ? new Date().toISOString() : null } : x));
        } catch (err) { alert(err instanceof Error ? err.message : 'Failed'); }
    };

    if (authLoading || !me) return null;

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
                    ) : (
                        <table className="blog-admin-table">
                            <thead>
                                <tr>
                                    <th>{t('colUser')}</th>
                                    <th>{t('colRole')}</th>
                                    <th>{t('colStatus')}</th>
                                    <th>{t('colJoined')}</th>
                                    <th>{t('colActions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} style={u.disabledAt ? { opacity: 0.5 } : undefined}>
                                        <td>
                                            <div className="blog-admin-post-title">{u.firstName} {u.lastName}</div>
                                            <div className="blog-admin-post-slug">@{u.username} &middot; {u.email}</div>
                                        </td>
                                        <td>
                                            <span className={`blog-admin-status blog-admin-status--${u.role === 'admin' ? 'published' : 'draft'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`blog-admin-status ${u.disabledAt ? 'blog-admin-status--draft' : 'blog-admin-status--published'}`}>
                                                {u.disabledAt ? t('disabled') : t('active')}
                                            </span>
                                        </td>
                                        <td className="blog-admin-date">{formatDate(u.createdAt)}</td>
                                        <td>
                                            <div className="blog-admin-actions">
                                                {u.id !== me.id && (
                                                    <>
                                                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => toggleRole(u)}>
                                                            {u.role === 'admin' ? t('demote') : t('promote')}
                                                        </button>
                                                        <button type="button" className="btn btn-secondary btn-sm btn-danger-outline" onClick={() => toggleDisable(u)}>
                                                            {u.disabledAt ? t('enable') : t('disable')}
                                                        </button>
                                                    </>
                                                )}
                                                {u.id === me.id && <span className="blog-admin-date">{t('you')}</span>}
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
