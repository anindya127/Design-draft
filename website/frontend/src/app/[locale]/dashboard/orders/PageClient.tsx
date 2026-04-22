'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { getAuthToken } from '@/lib/api/authApi';
import { apiGetOrderByNumber, type Order } from '@/lib/api/billingApi';

const ORDER_STAGES = ['received', 'processing', 'provisioning', 'testing', 'ready'];
const SERVER_STAGES = ['not_started', 'starting', 'deploying', 'configuring', 'ready'];

function ReceivedIcon() {
    return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
}
function ProcessingIcon() {
    return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
}
function ProvisioningIcon() {
    return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="8" x="2" y="2" rx="2" /><rect width="20" height="8" x="2" y="14" rx="2" /><line x1="6" x2="6.01" y1="6" y2="6" /><line x1="6" x2="6.01" y1="18" y2="18" /></svg>;
}
function TestingIcon() {
    return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12h6l2-9 4 18 2-9h6" /></svg>;
}
function CheckIcon() {
    return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" /></svg>;
}
function ServerStartIcon() {
    return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>;
}
function DeployIcon() {
    return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v18M3 12h18" /><circle cx="12" cy="12" r="9" /></svg>;
}
function ConfigIcon() {
    return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>;
}

function stepMeta(kind: 'order' | 'server', stage: string) {
    if (kind === 'order') {
        switch (stage) {
            case 'received': return <ReceivedIcon />;
            case 'processing': return <ProcessingIcon />;
            case 'provisioning': return <ProvisioningIcon />;
            case 'testing': return <TestingIcon />;
            default: return <CheckIcon />;
        }
    }
    switch (stage) {
        case 'not_started': return <ProvisioningIcon />;
        case 'starting': return <ServerStartIcon />;
        case 'deploying': return <DeployIcon />;
        case 'configuring': return <ConfigIcon />;
        default: return <CheckIcon />;
    }
}

function Stepper({
    kind,
    stages,
    current,
    labelFor,
    ariaLabel,
    stateLabels,
}: {
    kind: 'order' | 'server';
    stages: string[];
    current: string;
    labelFor: (s: string) => string;
    ariaLabel: string;
    stateLabels: { done: string; current: string; pending: string };
}) {
    const idx = Math.max(0, stages.indexOf(current));
    return (
        <ol className="order-stepper" aria-label={ariaLabel}>
            {stages.map((s, i) => {
                const state = i < idx ? 'done' : i === idx ? 'current' : 'pending';
                const stepLabel = labelFor(s);
                return (
                    <li
                        key={s}
                        className={`order-step order-step--${state}`}
                        aria-current={state === 'current' ? 'step' : undefined}
                    >
                        <span className="visually-hidden">
                            Step {i + 1} of {stages.length}: {stepLabel} — {stateLabels[state]}.
                        </span>
                        <div className="order-step-icon" aria-hidden="true">{stepMeta(kind, s)}</div>
                        <div className="order-step-label" aria-hidden="true">{stepLabel}</div>
                        {i < stages.length - 1 && <div className="order-step-connector" aria-hidden="true" />}
                    </li>
                );
            })}
        </ol>
    );
}

function formatUSD(cents: number, currency = 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}

export default function OrderDetailsClient() {
    const t = useTranslations('dashboard.orderDetails');
    const params = useSearchParams();
    const orderNumber = params.get('n') || '';
    const { user, loading } = useAuth();
    const [order, setOrder] = useState<Order | null>(null);
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (loading || !user || !orderNumber) return;
        const token = getAuthToken();
        if (!token) return;
        let cancelled = false;
        let interval: NodeJS.Timeout | null = null;

        const fetchIt = async () => {
            setRefreshing(true);
            try {
                const o = await apiGetOrderByNumber(token, orderNumber);
                if (!cancelled) setOrder(o);
            } catch (e) {
                if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
            } finally {
                if (!cancelled) setRefreshing(false);
            }
        };
        void fetchIt();
        interval = setInterval(fetchIt, 10_000);
        return () => { cancelled = true; if (interval) clearInterval(interval); };
    }, [orderNumber, loading, user]);

    if (loading || !user) return null;

    if (!orderNumber) {
        return (
            <>
                <h1 className="dash-page-title">{t('title')}</h1>
                <div className="form-banner form-banner--error">{t('missingOrder')}</div>
            </>
        );
    }

    return (
        <>
            <Link href="/dashboard/payments" className="buy-back-link">← {t('back')}</Link>
            <h1 className="dash-page-title">{t('title')}</h1>

            {error && <div className="form-banner form-banner--error" role="alert" aria-live="assertive">{error}</div>}

            {order && (
                <>
                    <div className="dash-form-card">
                        <div className="order-header">
                            <div>
                                <div className="order-header-label">{t('orderNumber')}</div>
                                <div className="order-header-value"><code>{order.orderNumber}</code></div>
                            </div>
                            <div>
                                <div className="order-header-label">{t('total')}</div>
                                <div className="order-header-value">{formatUSD(order.totalCents, order.currency)}</div>
                            </div>
                            <div>
                                <div className="order-header-label">{t('status')}</div>
                                <div className="order-header-value">
                                    <span className={`dash-status-pill dash-status-pill--${order.status}`}>
                                        {t(`statuses.${order.status}` as any) || order.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="order-product-label">{order.productLabel}</div>
                    </div>

                    <div className="order-steppers-grid">
                        <div className="dash-form-card">
                            <h2 className="dash-section-title">{t('orderPipeline.title')}</h2>
                            <p className="dash-section-desc">{t('orderPipeline.desc')}</p>
                            <Stepper
                                kind="order"
                                stages={ORDER_STAGES}
                                current={order.orderStage}
                                labelFor={(s) => t(`orderPipeline.stages.${s}` as any) || s}
                                ariaLabel={t('orderPipeline.title')}
                                stateLabels={{
                                    done: t('stepStates.done'),
                                    current: t('stepStates.current'),
                                    pending: t('stepStates.pending'),
                                }}
                            />
                        </div>
                        <div className="dash-form-card">
                            <h2 className="dash-section-title">{t('serverPipeline.title')}</h2>
                            <p className="dash-section-desc">{t('serverPipeline.desc')}</p>
                            <Stepper
                                kind="server"
                                stages={SERVER_STAGES}
                                current={order.serverStage}
                                labelFor={(s) => t(`serverPipeline.stages.${s}` as any) || s}
                                ariaLabel={t('serverPipeline.title')}
                                stateLabels={{
                                    done: t('stepStates.done'),
                                    current: t('stepStates.current'),
                                    pending: t('stepStates.pending'),
                                }}
                            />
                        </div>
                    </div>

                    {refreshing && (
                        <p className="dash-muted" style={{ textAlign: 'center', marginTop: 16 }}>
                            {t('autoRefresh')}
                        </p>
                    )}
                </>
            )}
        </>
    );
}
