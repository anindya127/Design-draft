'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { getAuthToken } from '@/lib/api/authApi';
import {
    apiGetPlans,
    apiApplyPromoCode,
    apiCheckout,
    type PlanCatalog,
} from '@/lib/api/billingApi';
import {
    buildLineItems,
    buildMetaRows,
    computePrice,
    formatUSD,
    pickLabel,
    type Cart,
} from '@/lib/buy/pricing';

const CART_KEY = 'gcss_buy_cart';

type PromoInfo = {
    code: string;
    discountType: 'percent' | 'fixed';
    discountValue: number;
} | null;

type Provider = 'stripe' | 'paypal' | 'pingxx' | 'bank_transfer';

// Mirror of backend/cmd/server/billing.go — any change there must be
// mirrored here so the UI gates match the server's rules.
const DEPOSIT_CENTS = 20_000; // $200
const BANK_TRANSFER_THRESHOLD_CENTS = 150_000; // $1,500
const PLATFORM_PLANS = new Set(['appent', 'webplat', 'appplat']);

export default function BuyReviewClient() {
    const t = useTranslations('buy');
    const locale = useLocale();
    const router = useRouter();
    const { user, loading } = useAuth();

    const [catalog, setCatalog] = useState<PlanCatalog | null>(null);
    const [cart, setCart] = useState<Cart | null>(null);

    const [billingAddress, setBillingAddress] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        street1: '',
        street2: '',
        city: '',
        state: '',
        country: '',
        postcode: '',
    });

    const [promoCode, setPromoCode] = useState('');
    const [promo, setPromo] = useState<PromoInfo>(null);
    const [promoBusy, setPromoBusy] = useState(false);
    const [promoMsg, setPromoMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [provider, setProvider] = useState<Provider>('stripe');
    // Deposit defaults ON for eligible platform plans. The actual gating still
    // happens on depositEligible below; backend double-checks too.
    const [useDeposit, setUseDeposit] = useState(true);
    const [invalidFields, setInvalidFields] = useState<string[]>([]);
    const isInvalid = (f: string) => invalidFields.includes(f);

    useEffect(() => {
        if (locale === 'zh') setProvider('pingxx');
    }, [locale]);

    const [checkoutBusy, setCheckoutBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [loading, user, router]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const raw = window.sessionStorage.getItem(CART_KEY);
        if (!raw) {
            router.push('/buy');
            return;
        }
        try {
            setCart(JSON.parse(raw));
        } catch {
            router.push('/buy');
        }
    }, [router]);

    useEffect(() => {
        apiGetPlans().then(setCatalog).catch(() => {});
    }, []);

    useEffect(() => {
        if (user) {
            setBillingAddress((b) => ({
                ...b,
                firstName: user.firstName || b.firstName,
                lastName: user.lastName || b.lastName,
                email: user.email || b.email,
                phone: user.phone || b.phone,
                company: user.company || b.company,
            }));
        }
    }, [user]);

    const plan = useMemo(
        () => catalog?.plans.find((p) => p.key === cart?.planKey) || null,
        [catalog, cart]
    );

    const pricing = useMemo(() => {
        if (!catalog || !plan || !cart) return { subtotal: 0, discount: 0, total: 0 };
        const subtotal = computePrice(plan, cart, catalog.addons);
        let discount = 0;
        if (promo) {
            if (promo.discountType === 'percent') discount = Math.floor((subtotal * promo.discountValue) / 100);
            else discount = promo.discountValue;
            if (discount > subtotal) discount = subtotal;
        }
        return { subtotal, discount, total: subtotal - discount };
    }, [catalog, plan, cart, promo]);

    // Payment-method eligibility. These rules mirror the backend's enforcement
    // in handlePlanCheckout so the UI reflects what will actually work.
    const isPlatformPlan = plan ? PLATFORM_PLANS.has(plan.key) : false;
    const depositEligible = isPlatformPlan && pricing.total > DEPOSIT_CENTS;
    const chargeAmount = useDeposit && depositEligible ? DEPOSIT_CENTS : pricing.total;
    const balanceAmount = useDeposit && depositEligible ? pricing.total - DEPOSIT_CENTS : 0;
    // Bank transfer is mandatory when the charge amount exceeds the threshold.
    // If the user is paying the full amount and it exceeds the threshold,
    // we hide online gateways — bank transfer is the only option.
    const mustUseBankTransfer = chargeAmount > BANK_TRANSFER_THRESHOLD_CENTS;

    // Auto-switch the provider when the policy forces bank_transfer.
    useEffect(() => {
        if (mustUseBankTransfer && provider !== 'bank_transfer') {
            setProvider('bank_transfer');
        }
    }, [mustUseBankTransfer, provider]);

    // When the user turns off the deposit toggle and the total still requires
    // bank transfer, keep them on bank_transfer. When they turn it on and the
    // charge amount drops below the threshold, restore a sensible default.
    useEffect(() => {
        if (!mustUseBankTransfer && provider === 'bank_transfer') {
            setProvider(locale === 'zh' ? 'pingxx' : 'stripe');
        }
    }, [mustUseBankTransfer, provider, locale]);

    const handleApplyPromo = async () => {
        if (!promoCode.trim()) return;
        setPromoBusy(true);
        setPromoMsg(null);
        try {
            const p = await apiApplyPromoCode(promoCode.trim());
            setPromo(p);
            setPromoMsg({ type: 'success', text: t('review.promoApplied', { code: p.code }) });
        } catch (err) {
            setPromo(null);
            setPromoMsg({ type: 'error', text: err instanceof Error ? err.message : t('review.promoError') });
        } finally {
            setPromoBusy(false);
        }
    };

    const handleCheckout = async () => {
        if (!cart || !plan) return;
        const token = getAuthToken();
        if (!token) {
            router.push('/login');
            return;
        }
        const required: (keyof typeof billingAddress)[] = ['firstName', 'lastName', 'email', 'phone', 'street1', 'city', 'country'];
        const missing = required.filter((f) => !billingAddress[f].trim());
        if (missing.length > 0) {
            setInvalidFields(missing);
            setError(t('review.fillRequired'));
            requestAnimationFrame(() => {
                const el = document.getElementById(`ba-${missing[0]}`);
                if (el) (el as HTMLInputElement).focus();
            });
            return;
        }
        setInvalidFields([]);

        setCheckoutBusy(true);
        setError('');
        try {
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            // Bank transfer orders redirect to a bank-info + slip-upload page
            // instead of the gateway success page. Online gateway orders with
            // a deposit still land on /buy/success after the deposit clears
            // — they'll also get a follow-up email to upload the balance slip.
            const successPath = provider === 'bank_transfer' ? '/buy/bank-transfer' : '/buy/success';
            const res = await apiCheckout(token, {
                planKey: cart.planKey,
                billingMode: cart.billingMode,
                years: cart.years,
                chargers: cart.chargers,
                withHosting: cart.withHosting,
                addons: cart.addons,
                useDeposit: useDeposit && depositEligible,
                promoCode: promo?.code || '',
                billingAddress,
                provider,
                successUrl: `${origin}/${locale}${successPath}`,
                cancelUrl: `${origin}/${locale}/buy/review`,
            });
            if (typeof window !== 'undefined') window.sessionStorage.removeItem(CART_KEY);
            window.location.href = res.url;
        } catch (err) {
            setError(err instanceof Error ? err.message : t('review.checkoutError'));
            setCheckoutBusy(false);
        }
    };

    if (loading || !user) return null;
    if (!catalog || !cart || !plan) {
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
                    <Link href="/buy" className="buy-back-link">← {t('review.backToConfig')}</Link>
                    <h1 className="buy-title">{t('review.title')}</h1>

                    <div className="buy-block">
                        <h2 className="buy-block-title">{t('review.reviewOrder')}</h2>
                        <div className="buy-summary-meta">
                            {buildMetaRows(plan, cart, locale, (k, v) => t(k as never, v as never)).map((row) => (
                                <div key={row.label} className="buy-summary-meta-row">
                                    <span className="buy-summary-meta-k">{row.label}</span>
                                    <span className="buy-summary-meta-v">{row.value}</span>
                                </div>
                            ))}
                        </div>
                        <div className="buy-summary-divider" />
                        <div className="buy-summary-lines">
                            {buildLineItems(plan, cart, catalog.addons, locale, (k, v) => t(k as never, v as never)).map((item, i) => (
                                <div key={i} className="buy-summary-line buy-summary-line--rich">
                                    <div className="buy-summary-line-main">
                                        <span className="buy-summary-line-label">{item.label}</span>
                                        {item.detail && <span className="buy-summary-line-detail">{item.detail}</span>}
                                    </div>
                                    <span className="buy-summary-line-amt">{formatUSD(item.amountCents)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="buy-block">
                        <h2 className="buy-block-title">{t('review.promoTitle')}</h2>
                        <div className="buy-promo-row">
                            <label htmlFor="buy-promo" className="visually-hidden">{t('review.promoTitle')}</label>
                            <input
                                id="buy-promo"
                                className="form-input"
                                placeholder={t('review.promoPlaceholder')}
                                value={promoCode}
                                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                disabled={promoBusy || !!promo}
                                autoComplete="off"
                            />
                            {promo ? (
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => { setPromo(null); setPromoMsg(null); setPromoCode(''); }}
                                >
                                    {t('review.removePromo')}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className={`btn btn-secondary${promoBusy ? ' btn-loading' : ''}`}
                                    onClick={handleApplyPromo}
                                    disabled={promoBusy}
                                >
                                    {t('review.applyPromo')}
                                </button>
                            )}
                        </div>
                        {promoMsg && <div className={`form-banner form-banner--${promoMsg.type}`} role={promoMsg.type === 'error' ? 'alert' : 'status'} aria-live={promoMsg.type === 'error' ? 'assertive' : 'polite'} style={{ marginTop: 10 }}>{promoMsg.text}</div>}
                    </div>

                    <div className="buy-block">
                        <h2 className="buy-block-title">{t('review.billingDetails')}</h2>
                        <div className="buy-billing-grid">
                            <div className="buy-billing-col">
                                <h3 className="buy-billing-subtitle">{t('review.personalInfo')}</h3>
                                <div className="auth-form-row">
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="ba-firstName">{t('review.firstName')} *</label>
                                        <input id="ba-firstName" className={`form-input${isInvalid('firstName') ? ' input-error' : ''}`} aria-invalid={isInvalid('firstName') || undefined} autoComplete="given-name" value={billingAddress.firstName} onChange={(e) => setBillingAddress({ ...billingAddress, firstName: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="ba-lastName">{t('review.lastName')} *</label>
                                        <input id="ba-lastName" className={`form-input${isInvalid('lastName') ? ' input-error' : ''}`} aria-invalid={isInvalid('lastName') || undefined} autoComplete="family-name" value={billingAddress.lastName} onChange={(e) => setBillingAddress({ ...billingAddress, lastName: e.target.value })} />
                                    </div>
                                </div>
                                <div className="auth-form-row">
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="ba-email">{t('review.email')} *</label>
                                        <input id="ba-email" className={`form-input${isInvalid('email') ? ' input-error' : ''}`} aria-invalid={isInvalid('email') || undefined} type="email" autoComplete="email" value={billingAddress.email} onChange={(e) => setBillingAddress({ ...billingAddress, email: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="ba-phone">{t('review.phone')} *</label>
                                        <input id="ba-phone" className={`form-input${isInvalid('phone') ? ' input-error' : ''}`} aria-invalid={isInvalid('phone') || undefined} type="tel" autoComplete="tel" value={billingAddress.phone} onChange={(e) => setBillingAddress({ ...billingAddress, phone: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="ba-company">{t('review.company')}</label>
                                    <input id="ba-company" className="form-input" autoComplete="organization" value={billingAddress.company} onChange={(e) => setBillingAddress({ ...billingAddress, company: e.target.value })} />
                                </div>
                            </div>

                            <div className="buy-billing-col">
                                <h3 className="buy-billing-subtitle">{t('review.billingAddress')}</h3>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="ba-street1">{t('review.street1')} *</label>
                                    <input id="ba-street1" className={`form-input${isInvalid('street1') ? ' input-error' : ''}`} aria-invalid={isInvalid('street1') || undefined} autoComplete="address-line1" value={billingAddress.street1} onChange={(e) => setBillingAddress({ ...billingAddress, street1: e.target.value })} />
                                </div>
                                <div className="auth-form-row">
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="ba-street2">{t('review.street2')}</label>
                                        <input id="ba-street2" className="form-input" autoComplete="address-line2" value={billingAddress.street2} onChange={(e) => setBillingAddress({ ...billingAddress, street2: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="ba-city">{t('review.city')} *</label>
                                        <input id="ba-city" className={`form-input${isInvalid('city') ? ' input-error' : ''}`} aria-invalid={isInvalid('city') || undefined} autoComplete="address-level2" value={billingAddress.city} onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })} />
                                    </div>
                                </div>
                                <div className="auth-form-row">
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="ba-country">{t('review.country')} *</label>
                                        <input id="ba-country" className={`form-input${isInvalid('country') ? ' input-error' : ''}`} aria-invalid={isInvalid('country') || undefined} autoComplete="country-name" value={billingAddress.country} onChange={(e) => setBillingAddress({ ...billingAddress, country: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="ba-state">{t('review.state')}</label>
                                        <input id="ba-state" className="form-input" autoComplete="address-level1" value={billingAddress.state} onChange={(e) => setBillingAddress({ ...billingAddress, state: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="ba-postcode">{t('review.postcode')}</label>
                                        <input id="ba-postcode" className="form-input" autoComplete="postal-code" value={billingAddress.postcode} onChange={(e) => setBillingAddress({ ...billingAddress, postcode: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {depositEligible && (
                        <div className="buy-block">
                            <h2 className="buy-block-title">{t('review.depositTitle')}</h2>
                            <label className={`buy-deposit-option${useDeposit ? ' buy-deposit-option--active' : ''}`}>
                                <input
                                    type="checkbox"
                                    checked={useDeposit}
                                    onChange={(e) => setUseDeposit(e.target.checked)}
                                />
                                <div className="buy-deposit-body">
                                    <div className="buy-deposit-head">
                                        <span className="buy-deposit-title">{t('review.depositLabel', { amount: formatUSD(DEPOSIT_CENTS) })}</span>
                                        <span className="buy-deposit-chip">{formatUSD(pricing.total - DEPOSIT_CENTS)} {t('review.depositBalance')}</span>
                                    </div>
                                    <p className="buy-deposit-help">{t('review.depositHelp', { amount: formatUSD(DEPOSIT_CENTS) })}</p>
                                </div>
                            </label>
                        </div>
                    )}

                    <div className="buy-block">
                        <h2 className="buy-block-title">{t('review.paymentMethod')}</h2>
                        {mustUseBankTransfer && (
                            <div className="form-banner form-banner--info" role="status" style={{ marginBottom: 12 }}>
                                {t('review.bankTransferRequired', { threshold: formatUSD(BANK_TRANSFER_THRESHOLD_CENTS) })}
                            </div>
                        )}
                        <div className="buy-provider-grid" role="radiogroup" aria-label={t('review.paymentMethod')}>
                            {!mustUseBankTransfer && (
                                <>
                                    <button type="button" role="radio" aria-checked={provider === 'stripe'} className={`buy-provider${provider === 'stripe' ? ' buy-provider--active' : ''}`} onClick={() => setProvider('stripe')}>
                                        <div className="buy-provider-label">{t('review.providerStripe')}</div>
                                        <div className="buy-provider-sub">{t('review.providerStripeDesc')}</div>
                                    </button>
                                    <button type="button" role="radio" aria-checked={provider === 'paypal'} className={`buy-provider${provider === 'paypal' ? ' buy-provider--active' : ''}`} onClick={() => setProvider('paypal')}>
                                        <div className="buy-provider-label">{t('review.providerPaypal')}</div>
                                        <div className="buy-provider-sub">{t('review.providerPaypalDesc')}</div>
                                    </button>
                                    <button type="button" role="radio" aria-checked={provider === 'pingxx'} className={`buy-provider${provider === 'pingxx' ? ' buy-provider--active' : ''}`} onClick={() => setProvider('pingxx')}>
                                        <div className="buy-provider-label">{t('review.providerPingxx')}</div>
                                        <div className="buy-provider-sub">{t('review.providerPingxxDesc')}</div>
                                    </button>
                                </>
                            )}
                            <button type="button" role="radio" aria-checked={provider === 'bank_transfer'} className={`buy-provider${provider === 'bank_transfer' ? ' buy-provider--active' : ''}`} onClick={() => setProvider('bank_transfer')}>
                                <div className="buy-provider-label">{t('review.providerBank')}</div>
                                <div className="buy-provider-sub">{t('review.providerBankDesc')}</div>
                            </button>
                        </div>
                    </div>
                </div>

                <aside className="buy-summary">
                    <h2 className="buy-summary-title">{t('summary.title')}</h2>
                    <div className="buy-summary-meta">
                        {buildMetaRows(plan, cart, locale, (k, v) => t(k as never, v as never)).map((row) => (
                            <div key={row.label} className="buy-summary-meta-row">
                                <span className="buy-summary-meta-k">{row.label}</span>
                                <span className="buy-summary-meta-v">{row.value}</span>
                            </div>
                        ))}
                    </div>

                    <div className="buy-summary-divider" />

                    <div className="buy-summary-lines">
                        {buildLineItems(plan, cart, catalog.addons, locale, (k, v) => t(k as never, v as never)).map((item, i) => (
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

                    <div className="buy-summary-row">
                        <span>{t('summary.subtotal')}</span>
                        <span>{formatUSD(pricing.subtotal)}</span>
                    </div>

                    {pricing.discount > 0 && (
                        <div className="buy-summary-row" style={{ color: '#10B981' }}>
                            <span>{t('summary.discount')}</span>
                            <span>−{formatUSD(pricing.discount)}</span>
                        </div>
                    )}

                    <div className="buy-summary-divider" />

                    {useDeposit && depositEligible ? (
                        <>
                            <div className="buy-summary-row buy-summary-row--strike" aria-live="polite">
                                <span>{t('summary.fullPrice')}</span>
                                <span className="buy-summary-strike">{formatUSD(pricing.total)}</span>
                            </div>
                            <div className="buy-summary-hero" aria-live="polite">
                                <span className="buy-summary-hero-label">{t('summary.payToday')}</span>
                                <span className="buy-summary-hero-amount">{formatUSD(chargeAmount)}</span>
                                <span className="buy-summary-hero-note">
                                    {t('summary.remainingVia', { amount: formatUSD(balanceAmount) })}
                                </span>
                            </div>
                        </>
                    ) : (
                        <div className="buy-summary-total">
                            <span>{t('summary.total')}</span>
                            <span>{formatUSD(pricing.total)}</span>
                        </div>
                    )}

                    {provider === 'bank_transfer' && !useDeposit && (
                        <div className="buy-summary-split" aria-live="polite">
                            <div className="buy-summary-split-row">
                                <span>{t('summary.bankTransferAmount')}</span>
                                <span className="buy-summary-split-amt">{formatUSD(pricing.total)}</span>
                            </div>
                        </div>
                    )}

                    {error && <div className="form-banner form-banner--error" role="alert" aria-live="assertive">{error}</div>}

                    <button
                        type="button"
                        className={`btn btn-primary btn-lg buy-checkout-btn${checkoutBusy ? ' btn-loading' : ''}`}
                        disabled={checkoutBusy}
                        onClick={handleCheckout}
                    >
                        {useDeposit && depositEligible
                            ? t('summary.checkoutDeposit', { amount: formatUSD(chargeAmount) })
                            : t('summary.checkout')}
                    </button>
                </aside>
            </div>

            {/* Mobile-only sticky bottom CTA — summary is always in view */}
            <div className="buy-mobile-bar" role="region" aria-label={t('summary.title')}>
                <div className="buy-mobile-bar-info">
                    {useDeposit && depositEligible ? (
                        <>
                            <span className="buy-mobile-bar-label">{t('summary.payToday')}</span>
                            <span className="buy-mobile-bar-amount">{formatUSD(chargeAmount)}</span>
                            <span className="buy-mobile-bar-sub">
                                {t('summary.wasPrice', { amount: formatUSD(pricing.total) })}
                            </span>
                        </>
                    ) : (
                        <>
                            <span className="buy-mobile-bar-label">{t('summary.total')}</span>
                            <span className="buy-mobile-bar-amount">{formatUSD(pricing.total)}</span>
                        </>
                    )}
                </div>
                <button
                    type="button"
                    className={`btn btn-primary buy-mobile-bar-btn${checkoutBusy ? ' btn-loading' : ''}`}
                    disabled={checkoutBusy}
                    onClick={handleCheckout}
                >
                    {useDeposit && depositEligible
                        ? t('summary.checkoutDepositShort', { amount: formatUSD(chargeAmount) })
                        : t('summary.checkout')}
                </button>
            </div>
        </section>
    );
}

