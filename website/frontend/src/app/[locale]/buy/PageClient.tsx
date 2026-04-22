'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import {
    apiGetCatalog,
    type Catalog,
    type SupportTier,
    type ServerTier,
    type BillingCycle,
} from '@/lib/api/billingApi';

const CART_KEY = 'gcss_buy_cart';

type Cart = {
    billingCycleId: number;
    supportTierId: number;
    serverTierId: number;
    supportDays: number;
};

function formatUSD(cents: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function labelFor(locale: string, enText: string, zhText: string) {
    if (locale === 'zh' && zhText) return zhText;
    return enText;
}

export default function BuyClient() {
    const t = useTranslations('buy');
    const locale = useLocale();
    const router = useRouter();

    const [catalog, setCatalog] = useState<Catalog | null>(null);
    const [error, setError] = useState('');
    const [cart, setCart] = useState<Cart>({ billingCycleId: 0, supportTierId: 0, serverTierId: 0, supportDays: 365 });

    useEffect(() => {
        apiGetCatalog()
            .then((c) => {
                setCatalog(c);
                // Seed selection with first active items.
                setCart({
                    billingCycleId: c.billingCycles?.[0]?.id ?? 0,
                    supportTierId: c.supportTiers?.[0]?.id ?? 0,
                    serverTierId: c.serverTiers?.[0]?.id ?? 0,
                    supportDays: 365,
                });
            })
            .catch((err) => setError(err instanceof Error ? err.message : t('loadError')));
    }, [t]);

    const billingCycle = useMemo<BillingCycle | undefined>(
        () => catalog?.billingCycles.find((b) => b.id === cart.billingCycleId),
        [catalog, cart.billingCycleId]
    );
    const supportTier = useMemo<SupportTier | undefined>(
        () => catalog?.supportTiers.find((s) => s.id === cart.supportTierId),
        [catalog, cart.supportTierId]
    );
    const serverTier = useMemo<ServerTier | undefined>(
        () => catalog?.serverTiers.find((s) => s.id === cart.serverTierId),
        [catalog, cart.serverTierId]
    );

    const pricing = useMemo(() => {
        if (!billingCycle || !serverTier) return { subtotal: 0, recurring: 0, total: 0 };
        let base = serverTier.priceCents;
        if (supportTier) {
            if (supportTier.pricingType === 'per_day') {
                const days = cart.supportDays > 0 ? cart.supportDays : billingCycle.years * 365;
                base += supportTier.priceCents * days;
            } else {
                base += supportTier.priceCents;
            }
        }
        const subtotal = Math.round(base * billingCycle.years * billingCycle.multiplier);
        return { subtotal, recurring: subtotal, total: subtotal };
    }, [billingCycle, supportTier, serverTier, cart.supportDays]);

    const handleCheckout = () => {
        if (!billingCycle || !serverTier) return;
        // Persist for review step.
        if (typeof window !== 'undefined') {
            window.sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
        }
        router.push('/buy/review');
    };

    if (error) {
        return (
            <section className="section container">
                <div className="form-banner form-banner--error">{error}</div>
            </section>
        );
    }
    if (!catalog) {
        return (
            <section className="section container">
                <div className="dashboard-loading"><div className="dashboard-loading-spinner" /><p>{t('loading')}</p></div>
            </section>
        );
    }

    return (
        <section className="section">
            <div className="container buy-layout">
                <div className="buy-main">
                    <h1 className="buy-title">{t('title')}</h1>
                    <p className="buy-subtitle">{t('subtitle')}</p>

                    <div className="buy-block">
                        <h2 className="buy-block-title">{t('productDetails')}</h2>
                        <div className="buy-product-card">
                            <div className="buy-product-head">
                                <span className="buy-product-badge">GCSS CPMS</span>
                                <h3>{t('productName')}</h3>
                            </div>
                            <p className="buy-product-desc">{t('productDesc')}</p>
                            <ul className="buy-product-bullets">
                                <li>{t('features.f1')}</li>
                                <li>{t('features.f2')}</li>
                                <li>{t('features.f3')}</li>
                                <li>{t('features.f4')}</li>
                            </ul>
                        </div>
                    </div>

                    <div className="buy-block">
                        <h2 className="buy-block-title">{t('chooseBillingCycle')}</h2>
                        <div className="buy-options-grid">
                            {catalog.billingCycles.map((b) => (
                                <button
                                    key={b.id}
                                    type="button"
                                    className={`buy-option${cart.billingCycleId === b.id ? ' buy-option--active' : ''}`}
                                    onClick={() => setCart((c) => ({ ...c, billingCycleId: b.id }))}
                                >
                                    <div className="buy-option-label">{labelFor(locale, b.labelEn, b.labelZh)}</div>
                                    {b.multiplier < 1 && (
                                        <div className="buy-option-sub">
                                            {t('save', { pct: Math.round((1 - b.multiplier) * 100) })}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="buy-block">
                        <h2 className="buy-block-title">{t('supportSystem')}</h2>
                        <div className="buy-options-grid buy-options-grid--support">
                            {catalog.supportTiers.map((s) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    className={`buy-option${cart.supportTierId === s.id ? ' buy-option--active' : ''}`}
                                    onClick={() => setCart((c) => ({ ...c, supportTierId: s.id }))}
                                >
                                    <div className="buy-option-label">{labelFor(locale, s.labelEn, s.labelZh)}</div>
                                    <div className="buy-option-price">
                                        {s.priceCents === 0
                                            ? t('free')
                                            : s.pricingType === 'per_day'
                                                ? `${formatUSD(s.priceCents)}/${t('perDay')}`
                                                : formatUSD(s.priceCents)}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="buy-block">
                        <h2 className="buy-block-title">{t('chooseServer')}</h2>
                        <div className="buy-options-grid buy-options-grid--server">
                            {catalog.serverTiers.map((s) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    className={`buy-option${cart.serverTierId === s.id ? ' buy-option--active' : ''}`}
                                    onClick={() => setCart((c) => ({ ...c, serverTierId: s.id }))}
                                >
                                    <div className="buy-option-label">{labelFor(locale, s.labelEn, s.labelZh)}</div>
                                    <div className="buy-option-price">{formatUSD(s.priceCents)}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <aside className="buy-summary">
                    <h2 className="buy-summary-title">{t('summary.title')}</h2>

                    {billingCycle && serverTier ? (
                        <div className="buy-summary-lines">
                            <div className="buy-summary-line">
                                <span>{labelFor(locale, serverTier.labelEn, serverTier.labelZh)}</span>
                                <span>{formatUSD(serverTier.priceCents)}</span>
                            </div>
                            {supportTier && supportTier.priceCents > 0 && (
                                <div className="buy-summary-line">
                                    <span>{labelFor(locale, supportTier.labelEn, supportTier.labelZh)}</span>
                                    <span>
                                        {supportTier.pricingType === 'per_day'
                                            ? `${formatUSD(supportTier.priceCents)}/${t('perDay')}`
                                            : formatUSD(supportTier.priceCents)}
                                    </span>
                                </div>
                            )}
                            <div className="buy-summary-line">
                                <span>{labelFor(locale, billingCycle.labelEn, billingCycle.labelZh)}</span>
                                <span>× {billingCycle.years}</span>
                            </div>
                        </div>
                    ) : (
                        <p className="buy-summary-empty">{t('summary.selectAll')}</p>
                    )}

                    <div className="buy-summary-divider" />

                    <div className="buy-summary-row">
                        <span>{t('summary.totalRecurring')}</span>
                        <span>{formatUSD(pricing.recurring)}</span>
                    </div>

                    <div className="buy-summary-divider" />

                    <div className="buy-summary-total">
                        <span>{t('summary.total')}</span>
                        <span>{formatUSD(pricing.total)}</span>
                    </div>

                    <button
                        type="button"
                        className="btn btn-primary btn-lg buy-checkout-btn"
                        disabled={!billingCycle || !serverTier}
                        onClick={handleCheckout}
                    >
                        {t('summary.checkout')}
                    </button>
                </aside>
            </div>
        </section>
    );
}
