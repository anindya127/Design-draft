'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { getAuthToken } from '@/lib/api/authApi';
import { apiGetOrderByNumber, apiPayPalCapture, type Order } from '@/lib/api/billingApi';

export default function BuySuccessClient() {
    const t = useTranslations('buy.success');
    const params = useSearchParams();
    const orderNum = params.get('order') || '';
    const paypalOrderID = params.get('paypal_order') || params.get('token') || '';
    const { user, loading } = useAuth();
    const [order, setOrder] = useState<Order | null>(null);
    const [err, setErr] = useState('');
    const [capturing, setCapturing] = useState(false);

    // If we came back from PayPal, capture the approved order first.
    useEffect(() => {
        if (!paypalOrderID || loading || !user) return;
        const token = getAuthToken();
        if (!token) return;
        let cancelled = false;
        setCapturing(true);
        apiPayPalCapture(token, paypalOrderID)
            .then((res) => { if (!cancelled) setOrder(res.order); })
            .catch((e) => { if (!cancelled) setErr(e instanceof Error ? e.message : 'Capture failed'); })
            .finally(() => { if (!cancelled) setCapturing(false); });
        return () => { cancelled = true; };
    }, [paypalOrderID, loading, user]);

    useEffect(() => {
        if (!orderNum || loading || !user || paypalOrderID) return;
        const token = getAuthToken();
        if (!token) return;
        // Poll for a few seconds because the webhook may arrive after the redirect.
        let cancelled = false;
        let tries = 0;
        const fetchOnce = async () => {
            try {
                const o = await apiGetOrderByNumber(token, orderNum);
                if (cancelled) return;
                setOrder(o);
                if (o.status !== 'paid' && tries < 10) {
                    tries += 1;
                    setTimeout(fetchOnce, 1500);
                }
            } catch (e) {
                if (!cancelled) setErr(e instanceof Error ? e.message : 'Failed to load order');
            }
        };
        void fetchOnce();
        return () => { cancelled = true; };
    }, [orderNum, loading, user, paypalOrderID]);

    return (
        <section className="section">
            <div className="container">
                <div className="buy-success-card">
                    <div className="buy-success-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M8 12l3 3 5-6" />
                        </svg>
                    </div>
                    <h1 className="buy-success-title">
                        {order?.status === 'paid' ? t('paid') : capturing ? t('capturing') : t('processing')}
                    </h1>
                    {orderNum && (
                        <p className="buy-success-order">
                            {t('orderNumber')}: <code>{orderNum}</code>
                        </p>
                    )}
                    {err && <div className="form-banner form-banner--error">{err}</div>}
                    <div className="buy-success-actions">
                        <Link href="/dashboard/payments" className="btn btn-primary">
                            {t('viewInvoice')}
                        </Link>
                        <Link href="/dashboard" className="btn btn-secondary">
                            {t('backToDashboard')}
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
