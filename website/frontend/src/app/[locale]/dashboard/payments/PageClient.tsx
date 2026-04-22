'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { getAuthToken } from '@/lib/api/authApi';
import { apiListInvoices, apiListOrders, type Invoice, type Order } from '@/lib/api/billingApi';

// Casts for dynamic Link hrefs that Next.js' typed routes doesn't know about.
type AnyHref = any;

function formatUSD(cents: number, currency = 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}

export default function PaymentHistoryClient() {
    const t = useTranslations('dashboard.paymentHistory');
    const { user } = useAuth();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = getAuthToken();
        if (!token || !user) return;
        let cancelled = false;
        Promise.all([apiListInvoices(token), apiListOrders(token)])
            .then(([inv, ord]) => {
                if (cancelled) return;
                setInvoices(inv);
                setOrders(ord);
            })
            .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load'); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [user]);

    return (
        <>
            <h1 className="dash-page-title">{t('title')}</h1>

            <div className="dash-form-card">
                {loading ? (
                    <div className="dashboard-loading"><div className="dashboard-loading-spinner" /></div>
                ) : error ? (
                    <div className="form-banner form-banner--error">{error}</div>
                ) : invoices.length === 0 && orders.length === 0 ? (
                    <div className="dash-empty-state">
                        <div className="dash-empty-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                                <rect width="20" height="14" x="2" y="5" rx="2" />
                                <line x1="2" x2="22" y1="10" y2="10" />
                            </svg>
                        </div>
                        <h3>{t('emptyTitle')}</h3>
                        <p>{t('emptyDesc')}</p>
                        <Link href="/buy" className="btn btn-primary" style={{ marginTop: 16 }}>
                            {t('buyNow')}
                        </Link>
                    </div>
                ) : (
                    <table className="dash-table" aria-label={t('tableLabel')}>
                        <thead>
                            <tr>
                                <th>{t('columns.invoice')}</th>
                                <th>{t('columns.product')}</th>
                                <th>{t('columns.total')}</th>
                                <th>{t('columns.status')}</th>
                                <th>{t('columns.details')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map((inv) => (
                                <tr key={`inv-${inv.id}`}>
                                    <td><code>{inv.invoiceNumber}</code></td>
                                    <td>{inv.productLabel}</td>
                                    <td>{formatUSD(inv.amountCents, inv.currency)}</td>
                                    <td>
                                        <span className={`dash-status-pill dash-status-pill--${inv.status}`}>
                                            {t(`statuses.${inv.status}` as any) || inv.status}
                                        </span>
                                    </td>
                                    <td>
                                        <Link href={`/invoices/${inv.invoiceNumber}` as AnyHref} className="dash-link">
                                            {t('columns.view')}
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {orders
                                .filter((o) => o.status !== 'paid')
                                .map((o) => (
                                    <tr key={`ord-${o.id}`}>
                                        <td><code>{o.orderNumber}</code></td>
                                        <td>{o.productLabel}</td>
                                        <td>{formatUSD(o.totalCents, o.currency)}</td>
                                        <td>
                                            <span className={`dash-status-pill dash-status-pill--${o.status}`}>
                                                {t(`statuses.${o.status}` as any) || o.status}
                                            </span>
                                        </td>
                                        <td>
                                            <Link href={`/dashboard/orders/${o.orderNumber}` as AnyHref} className="dash-link">
                                                {t('columns.orderDetails')}
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            {orders
                                .filter((o) => o.status === 'paid' && o.orderStage !== 'ready')
                                .map((o) => (
                                    <tr key={`track-${o.id}`}>
                                        <td colSpan={4} className="dash-muted">
                                            {t('trackOrder')}: <code>{o.orderNumber}</code>
                                        </td>
                                        <td>
                                            <Link href={`/dashboard/orders/${o.orderNumber}` as AnyHref} className="dash-link">
                                                {t('columns.orderDetails')}
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
}
