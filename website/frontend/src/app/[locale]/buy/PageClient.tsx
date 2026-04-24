'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { apiGetPlans, type Plan, type PlanCatalog } from '@/lib/api/billingApi';
import {
    buildLineItems,
    buildMetaRows,
    computePrice,
    formatUSD,
    pickLabel,
    type Cart,
} from '@/lib/buy/pricing';

const CART_KEY = 'gcss_buy_cart';

// Mirror of backend/cmd/server/billing.go — platform plans (one-time
// appent / webplat / appplat) can be started with a $200 deposit instead
// of the full price. Surface this in the summary so users see the hook.
const DEPOSIT_CENTS = 20_000; // $200
const PLATFORM_PLANS = new Set(['appent', 'webplat', 'appplat']);

function emptyCart(): Cart {
    return { planKey: '', billingMode: 'yearly', years: 1, chargers: 10, withHosting: false, addons: [] };
}

function planSupportsMonthly(plan: Plan) {
    return plan.hasMonthly;
}
function planIsOneTime(plan: Plan) {
    return !plan.hasMonthly && !plan.hasYearly && plan.basePriceCents > 0;
}

export default function BuyClient() {
    const t = useTranslations('buy');
    const locale = useLocale();
    const router = useRouter();
    const searchParams = useSearchParams();
    const requestedPlan = searchParams?.get('plan') || '';

    const [catalog, setCatalog] = useState<PlanCatalog | null>(null);
    const [error, setError] = useState('');
    const [cart, setCart] = useState<Cart>(emptyCart());

    useEffect(() => {
        apiGetPlans()
            .then((c) => {
                setCatalog(c);
                setCart((prev) => {
                    if (prev.planKey) return prev;
                    const target = requestedPlan && c.plans.find((p) => p.key === requestedPlan);
                    const first = target || c.plans[0];
                    if (!first) return prev;
                    return seedDefaults(prev, first);
                });
            })
            .catch((err) => setError(err instanceof Error ? err.message : t('loadError')));
    }, [t, requestedPlan]);

    const plan = useMemo(
        () => catalog?.plans.find((p) => p.key === cart.planKey) || null,
        [catalog, cart.planKey]
    );

    const total = useMemo(() => {
        if (!catalog || !plan) return 0;
        return computePrice(plan, cart, catalog.addons);
    }, [catalog, plan, cart]);

    const setPlan = (next: Plan) => {
        setCart((prev) => seedDefaults(prev, next));
    };

    const setAddonQty = (key: string, qty: number) => {
        setCart((prev) => {
            const others = prev.addons.filter((a) => a.key !== key);
            if (qty <= 0) return { ...prev, addons: others };
            return { ...prev, addons: [...others, { key, quantity: qty }] };
        });
    };
    const getAddonQty = (key: string): number =>
        cart.addons.find((a) => a.key === key)?.quantity ?? 0;

    const handleCheckout = () => {
        if (!plan) return;
        if (typeof window !== 'undefined') {
            window.sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
        }
        router.push('/buy/review');
    };

    if (error) {
        return (
            <section className="section container">
                <div className="form-banner form-banner--error" role="alert" aria-live="assertive">{error}</div>
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

                    {/* 1. Hosting Model */}
                    <div className="buy-block">
                        <h2 className="buy-block-title">{t('hostingModelLabel')}</h2>
                        <div className="buy-plan-grid buy-plan-grid--2" role="radiogroup" aria-label={t('hostingModelLabel')}>
                            {(['hosted', 'private'] as const).map((fam) => {
                                const selected = plan?.family === fam;
                                return (
                                    <button
                                        key={fam}
                                        type="button"
                                        role="radio"
                                        aria-checked={selected}
                                        className={`buy-plan-card${selected ? ' buy-plan-card--active' : ''}`}
                                        onClick={() => {
                                            const firstInFamily = catalog.plans.find((x) => x.family === fam);
                                            if (firstInFamily) setPlan(firstInFamily);
                                        }}
                                    >
                                        <div className="buy-plan-family">{t(fam === 'hosted' ? 'familyHosted' : 'familyPrivate')}</div>
                                        <div className="buy-plan-name">{t(fam === 'hosted' ? 'hostingModelHostedTitle' : 'hostingModelPrivateTitle')}</div>
                                        <p className="buy-plan-desc">{t(fam === 'hosted' ? 'hostingModelHostedDesc' : 'hostingModelPrivateDesc')}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 2. Plan (filtered by selected hosting model) */}
                    {plan && (
                        <div className="buy-block">
                            <h2 className="buy-block-title">{t('choosePlan')}</h2>
                            <div className="buy-plan-grid" role="radiogroup" aria-label={t('choosePlan')}>
                                {catalog.plans.filter((p) => p.family === plan.family).map((p) => {
                                    const selected = cart.planKey === p.key;
                                    return (
                                        <button
                                            key={p.key}
                                            type="button"
                                            role="radio"
                                            aria-checked={selected}
                                            className={`buy-plan-card${selected ? ' buy-plan-card--active' : ''}`}
                                            onClick={() => setPlan(p)}
                                        >
                                            <div className="buy-plan-name">{pickLabel(locale, p.labelEn, p.labelZh)}</div>
                                            <div className="buy-plan-price">{planHeadline(p, locale, t)}</div>
                                            <p className="buy-plan-desc">{pickLabel(locale, p.descriptionEn, p.descriptionZh)}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 3. Term & billing */}
                    {plan && (
                        <div className="buy-block">
                            <h2 className="buy-block-title">{t('termBillingLabel')}</h2>
                            <TermBillingOptions plan={plan} cart={cart} setCart={setCart} />
                        </div>
                    )}

                    {/* 4. Per-plan extras (chargers, hosting toggle) */}
                    {plan && <PerPlanExtras plan={plan} cart={cart} setCart={setCart} />}

                    {/* Add-ons */}
                    <div className="buy-block">
                        <h2 className="buy-block-title">{t('addonsTitle')}</h2>
                        <p className="buy-block-subtitle">{t('addonsSubtitle')}</p>
                        <div className="buy-addons-list">
                            {catalog.addons.map((a) => {
                                const qty = getAddonQty(a.key);
                                return (
                                    <div key={a.key} className={`buy-addon-row${qty > 0 ? ' buy-addon-row--active' : ''}`}>
                                        <div className="buy-addon-info">
                                            <div className="buy-addon-name">{pickLabel(locale, a.labelEn, a.labelZh)}</div>
                                            <div className="buy-addon-meta">
                                                {formatUSD(a.priceCents)} · {pickLabel(locale, a.unitNoteEn, a.unitNoteZh)}
                                            </div>
                                        </div>
                                        <div className="buy-addon-qty">
                                            <button type="button" className="buy-qty-btn" aria-label={t('decrement')} onClick={() => setAddonQty(a.key, qty - 1)} disabled={qty === 0}>−</button>
                                            <span className="buy-qty-val" aria-live="polite">{qty}</span>
                                            <button type="button" className="buy-qty-btn" aria-label={t('increment')} onClick={() => setAddonQty(a.key, qty + 1)}>+</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <aside className="buy-summary">
                    <h2 className="buy-summary-title">{t('summary.title')}</h2>

                    {plan ? (
                        <SummaryDetail plan={plan} cart={cart} addons={catalog.addons} locale={locale} total={total} />
                    ) : (
                        <p className="buy-summary-empty">{t('summary.selectAll')}</p>
                    )}

                    <button
                        type="button"
                        className="btn btn-primary btn-lg buy-checkout-btn"
                        disabled={!plan || total < 50}
                        onClick={handleCheckout}
                    >
                        {plan && PLATFORM_PLANS.has(plan.key) && total > DEPOSIT_CENTS
                            ? t('summary.continueDeposit', { amount: formatUSD(DEPOSIT_CENTS) })
                            : t('summary.continue')}
                    </button>
                </aside>
            </div>

            {/* Mobile-only sticky bottom CTA — summary is always in view */}
            {plan && total >= 50 && (
                <div className="buy-mobile-bar" role="region" aria-label={t('summary.title')}>
                    <div className="buy-mobile-bar-info">
                        {PLATFORM_PLANS.has(plan.key) && total > DEPOSIT_CENTS ? (
                            <>
                                <span className="buy-mobile-bar-label">{t('summary.payToday')}</span>
                                <span className="buy-mobile-bar-amount">{formatUSD(DEPOSIT_CENTS)}</span>
                                <span className="buy-mobile-bar-sub">
                                    {t('summary.wasPrice', { amount: formatUSD(total) })}
                                </span>
                            </>
                        ) : (
                            <>
                                <span className="buy-mobile-bar-label">{t('summary.total')}</span>
                                <span className="buy-mobile-bar-amount">{formatUSD(total)}</span>
                            </>
                        )}
                    </div>
                    <button
                        type="button"
                        className="btn btn-primary buy-mobile-bar-btn"
                        onClick={handleCheckout}
                    >
                        {t('summary.continueShort')}
                    </button>
                </div>
            )}
        </section>
    );
}

function SummaryDetail({ plan, cart, addons, locale, total }: {
    plan: Plan;
    cart: Cart;
    addons: PlanCatalog['addons'];
    locale: string;
    total: number;
}) {
    const t = useTranslations('buy');
    const items = buildLineItems(plan, cart, addons, locale, (k, v) => t(k as never, v as never));
    const metaRows = buildMetaRows(plan, cart, locale, (k, v) => t(k as never, v as never));
    const subtotal = items.reduce((s, i) => s + i.amountCents, 0);
    const depositEligible = PLATFORM_PLANS.has(plan.key) && total > DEPOSIT_CENTS;

    return (
        <>
            <div className="buy-summary-meta">
                {metaRows.map((row) => (
                    <div key={row.label} className="buy-summary-meta-row">
                        <span className="buy-summary-meta-k">{row.label}</span>
                        <span className="buy-summary-meta-v">{row.value}</span>
                    </div>
                ))}
            </div>

            <div className="buy-summary-divider" />

            <div className="buy-summary-lines">
                {items.map((item, i) => (
                    <div key={i} className="buy-summary-line buy-summary-line--rich">
                        <div className="buy-summary-line-main">
                            <span className="buy-summary-line-label">{item.label}</span>
                            {item.detail && <span className="buy-summary-line-detail">{item.detail}</span>}
                        </div>
                        <span className="buy-summary-line-amt">{formatUSD(item.amountCents)}</span>
                    </div>
                ))}
            </div>

            <div className="buy-summary-divider" />

            {items.length > 1 && (
                <div className="buy-summary-row">
                    <span>{t('summary.subtotal')}</span>
                    <span>{formatUSD(subtotal)}</span>
                </div>
            )}

            {depositEligible ? (
                <>
                    <div className="buy-summary-row buy-summary-row--strike">
                        <span>{t('summary.fullPrice')}</span>
                        <span className="buy-summary-strike">{formatUSD(total)}</span>
                    </div>
                    <div className="buy-summary-hero">
                        <span className="buy-summary-hero-label">{t('summary.payToday')}</span>
                        <span className="buy-summary-hero-amount">{formatUSD(DEPOSIT_CENTS)}</span>
                        <span className="buy-summary-hero-note">
                            {t('summary.remainingVia', { amount: formatUSD(total - DEPOSIT_CENTS) })}
                        </span>
                    </div>
                </>
            ) : (
                <div className="buy-summary-total">
                    <span>{t('summary.total')}</span>
                    <span>{formatUSD(total)}</span>
                </div>
            )}
        </>
    );
}

// ── helpers ───────────────────────────────────────────────────────────

function seedDefaults(prev: Cart, plan: Plan): Cart {
    const next: Cart = { ...prev, planKey: plan.key, addons: prev.addons };
    if (plan.key === 'saas') {
        next.billingMode = 'yearly';
        next.years = 1;
        if (!next.chargers || next.chargers < 1) next.chargers = 10;
    } else if (plan.key === 'customweb') {
        next.billingMode = planSupportsMonthly(plan) ? 'monthly' : 'yearly';
        next.years = 1;
    } else if (planIsOneTime(plan)) {
        next.billingMode = 'one_time';
        next.years = 1;
        next.withHosting = false;
    }
    return next;
}

function planHeadline(plan: Plan, locale: string, _t: ReturnType<typeof useTranslations>): string {
    switch (plan.key) {
        case 'saas':
            return locale === 'zh' ? '$84 / 年 / 桩' : '$84 / yr / charger';
        case 'customweb':
            return locale === 'zh' ? '$300 + $120 / 月' : '$300 + $120 / mo';
        case 'appent':
            return '$16,900';
        case 'webplat':
            return '$21,800';
        case 'appplat':
            return '$34,200';
        default:
            return '';
    }
}

// Term & billing cycle — recurring plans show a Monthly/Annual toggle plus
// a 1-5 year picker; one-time plans collapse into "One-time purchase".
function TermBillingOptions({ plan, cart, setCart }: { plan: Plan; cart: Cart; setCart: (fn: (prev: Cart) => Cart) => void }) {
    const t = useTranslations('buy');
    const isOneTime = !plan.hasMonthly && !plan.hasYearly;

    if (isOneTime) {
        return (
            <div className="buy-options-stack">
                <div className="buy-option-row">
                    <span className="buy-option-label-row">{t('billingModeLabel')}</span>
                    <span className="buy-option-static">{t('oneTime')}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="buy-options-stack">
            <div className="buy-option-row">
                <span className="buy-option-label-row">{t('billingModeLabel')}</span>
                <div className="buy-option-toggle" role="radiogroup">
                    {plan.hasMonthly && (
                        <button
                            type="button"
                            role="radio"
                            aria-checked={cart.billingMode === 'monthly'}
                            className={`buy-option-toggle-btn${cart.billingMode === 'monthly' ? ' buy-option-toggle-btn--active' : ''}`}
                            onClick={() => setCart((prev) => ({ ...prev, billingMode: 'monthly' }))}
                        >
                            {t('billingMonthly')}
                        </button>
                    )}
                    {plan.hasYearly && (
                        <button
                            type="button"
                            role="radio"
                            aria-checked={cart.billingMode === 'yearly'}
                            className={`buy-option-toggle-btn${cart.billingMode === 'yearly' ? ' buy-option-toggle-btn--active' : ''}`}
                            onClick={() => setCart((prev) => ({ ...prev, billingMode: 'yearly' }))}
                        >
                            {t('billingYearly')}
                        </button>
                    )}
                </div>
            </div>
            <YearsPicker years={cart.years} setYears={(y) => setCart((prev) => ({ ...prev, years: y }))} />
        </div>
    );
}

// Per-plan extras: charger count for SaaS, optional hosting for one-time
// platform plans. Each appears in its own independent section.
function PerPlanExtras({ plan, cart, setCart }: { plan: Plan; cart: Cart; setCart: (fn: (prev: Cart) => Cart) => void }) {
    const t = useTranslations('buy');
    const sections: ReactNode[] = [];

    if (plan.key === 'saas') {
        sections.push(
            <div className="buy-block" key="chargers">
                <h2 className="buy-block-title">{t('chargersLabel')}</h2>
                <div className="buy-options-stack">
                    <div className="buy-option-row">
                        <label htmlFor="opt-chargers" className="buy-option-label-row">{t('chargersLabelShort')}</label>
                        <input
                            id="opt-chargers"
                            type="number"
                            min={1}
                            max={100000}
                            className="form-input buy-option-input"
                            value={cart.chargers}
                            onChange={(e) => setCart((prev) => ({ ...prev, chargers: Math.max(1, parseInt(e.target.value || '1', 10) || 1) }))}
                        />
                    </div>
                    <p className="buy-option-help">{t('chargersHelp')}</p>
                </div>
            </div>
        );
    }

    const isOneTimePlatform = plan.key === 'appent' || plan.key === 'webplat' || plan.key === 'appplat';
    if (isOneTimePlatform) {
        sections.push(
            <div className="buy-block" key="hosting">
                <h2 className="buy-block-title">{t('hostingBlockTitle')}</h2>
                <div className="buy-options-stack">
                    <div className="buy-option-row">
                        <label htmlFor="opt-hosting" className="buy-option-label-row">{t('hostingLabel')}</label>
                        <label className="buy-toggle">
                            <input
                                id="opt-hosting"
                                type="checkbox"
                                checked={cart.withHosting}
                                onChange={(e) => setCart((prev) => ({ ...prev, withHosting: e.target.checked }))}
                            />
                            <span className="buy-toggle-slider" />
                        </label>
                    </div>
                    <p className="buy-option-help">{t('hostingHelp')}</p>
                    {cart.withHosting && (
                        <YearsPicker years={cart.years} setYears={(y) => setCart((prev) => ({ ...prev, years: y }))} label={t('hostingYearsLabel')} />
                    )}
                </div>
            </div>
        );
    }

    if (sections.length === 0) return null;
    return <>{sections}</>;
}

function YearsPicker({ years, setYears, label }: { years: number; setYears: (y: number) => void; label?: string }) {
    const t = useTranslations('buy');
    const opts = [1, 2, 3, 4, 5];
    return (
        <div className="buy-option-row">
            <span className="buy-option-label-row">{label || t('yearsLabel')}</span>
            <div className="buy-option-toggle" role="radiogroup">
                {opts.map((y) => (
                    <button
                        key={y}
                        type="button"
                        role="radio"
                        aria-checked={years === y}
                        className={`buy-option-toggle-btn${years === y ? ' buy-option-toggle-btn--active' : ''}`}
                        onClick={() => setYears(y)}
                    >
                        {y}y
                    </button>
                ))}
            </div>
        </div>
    );
}
