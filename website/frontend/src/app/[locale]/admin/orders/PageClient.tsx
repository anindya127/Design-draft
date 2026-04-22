'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { getAuthToken } from '@/lib/api/authApi';
import {
    apiAdminListOrders,
    apiAdminUpdateOrderStage,
    apiAdminMarkOrderPaid,
    type Order,
} from '@/lib/api/billingApi';

function formatUSD(cents: number, currency = 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}
function formatDT(iso?: string) {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export default function AdminOrdersClient() {
    const t = useTranslations('admin.orders');
    const tCommon = useTranslations('admin');
    const tOrderStages = useTranslations('dashboard.orderDetails.orderPipeline.stages');
    const tServerStages = useTranslations('dashboard.orderDetails.serverPipeline.stages');
    const router = useRouter();

    const orderStageLabel = (s: string) => {
        try { return tOrderStages(s as any); } catch { return s; }
    };
    const serverStageLabel = (s: string) => {
        try { return tServerStages(s as any); } catch { return s; }
    };
    const { user, loading } = useAuth();

    const [orders, setOrders] = useState<Order[] | null>(null);
    const [orderStages, setOrderStages] = useState<string[]>([]);
    const [serverStages, setServerStages] = useState<string[]>([]);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [error, setError] = useState('');

    const token = typeof window !== 'undefined' ? getAuthToken() : null;

    const reload = useCallback(async () => {
        if (!token) return;
        setError('');
        try {
            const res = await apiAdminListOrders(token);
            setOrders(res.orders || []);
            setOrderStages(res.orderStages || []);
            setServerStages(res.serverStages || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load');
        }
    }, [token]);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
        if (user && user.role !== 'admin') router.push('/dashboard');
    }, [loading, user, router]);

    useEffect(() => {
        if (user?.role === 'admin') void reload();
    }, [user, reload]);

    if (loading || !user || user.role !== 'admin') return null;

    const setStage = async (orderId: number, field: 'orderStage' | 'serverStage', value: string) => {
        if (!token) return;
        setBusyId(orderId);
        try {
            await apiAdminUpdateOrderStage(token, orderId, { [field]: value });
            await reload();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Update failed');
        } finally {
            setBusyId(null);
        }
    };

    const markPaid = async (orderId: number) => {
        if (!token) return;
        if (!confirm(t('confirmMarkPaid'))) return;
        setBusyId(orderId);
        try {
            await apiAdminMarkOrderPaid(token, orderId);
            await reload();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-bg" />
            <div className="container">
                <header className="admin-header">
                    <div className="admin-meta">
                        <span className="admin-chip admin-chip-gold">GCSS Admin</span>
                    </div>
                    <h1 className="admin-title">{t('title')}</h1>
                    <p className="admin-subtitle">{t('subtitle')}</p>
                    <nav className="admin-nav-grid" style={{ marginTop: 16 }}>
                        <Link href="/admin" className="admin-quicklink">← {tCommon('backToOverview')}</Link>
                    </nav>
                </header>

                {error && <div className="admin-alert admin-alert-error">{error}</div>}

                {!orders ? (
                    <div className="admin-loading">{tCommon('loading')}</div>
                ) : orders.length === 0 ? (
                    <div className="admin-settings-group">
                        <p className="admin-settings-help">{t('empty')}</p>
                    </div>
                ) : (
                    <section className="admin-settings-group">
                        <div className="admin-settings-group-head">
                            <h2>{t('ordersTitle')}</h2>
                            <p>{t('ordersDesc')}</p>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="dash-table">
                                <thead>
                                    <tr>
                                        <th>{t('cols.order')}</th>
                                        <th>{t('cols.user')}</th>
                                        <th>{t('cols.product')}</th>
                                        <th>{t('cols.total')}</th>
                                        <th>{t('cols.status')}</th>
                                        <th>{t('cols.orderStage')}</th>
                                        <th>{t('cols.serverStage')}</th>
                                        <th>{t('cols.created')}</th>
                                        <th>{t('cols.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((o) => (
                                        <tr key={o.id}>
                                            <td><code>{o.orderNumber}</code></td>
                                            <td>#{o.userId}</td>
                                            <td>{o.productLabel}</td>
                                            <td>{formatUSD(o.totalCents, o.currency)}</td>
                                            <td>
                                                <span className={`dash-status-pill dash-status-pill--${o.status}`}>{o.status}</span>
                                            </td>
                                            <td>
                                                <select
                                                    className="form-input form-input--inline"
                                                    value={o.orderStage}
                                                    disabled={busyId === o.id}
                                                    onChange={(e) => setStage(o.id, 'orderStage', e.target.value)}
                                                >
                                                    {orderStages.map((s) => <option key={s} value={s}>{orderStageLabel(s)}</option>)}
                                                </select>
                                            </td>
                                            <td>
                                                <select
                                                    className="form-input form-input--inline"
                                                    value={o.serverStage}
                                                    disabled={busyId === o.id}
                                                    onChange={(e) => setStage(o.id, 'serverStage', e.target.value)}
                                                >
                                                    {serverStages.map((s) => <option key={s} value={s}>{serverStageLabel(s)}</option>)}
                                                </select>
                                            </td>
                                            <td className="dash-muted">{formatDT(o.createdAt)}</td>
                                            <td>
                                                {o.status !== 'paid' && (
                                                    <button type="button" className="btn btn-secondary btn-sm" disabled={busyId === o.id} onClick={() => markPaid(o.id)}>
                                                        {t('markPaid')}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
