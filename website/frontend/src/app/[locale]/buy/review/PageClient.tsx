'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { getAuthToken } from '@/lib/api/authApi';
import {
    apiGetCatalog,
    apiApplyPromoCode,
    apiCheckout,
    type Catalog,
    type BillingCycle,
    type SupportTier,
    type ServerTier,
} from '@/lib/api/billingApi';

const CART_KEY = 'gcss_buy_cart';

type Cart = {
    billingCycleId: number;
    supportTierId: number;
    serverTierId: number;
    supportDays: number;
};

type PromoInfo = {
    code: string;
    discountType: 'percent' | 'fixed';
    discountValue: number;
} | null;

type Provider = 'stripe' | 'paypal' | 'pingxx';

function formatUSD(cents: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function labelFor(locale: string, en: string, zh: string) {
    return locale === 'zh' && zh ? zh : en;
}

export default function BuyReviewClient() {
    const t = useTranslations('buy');
    const locale = useLocale();
    const router = useRouter();
    const { user, loading } = useAuth();

    const [catalog, setCatalog] = useState<Catalog | null>(null);
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
        apiGetCatalog().then(setCatalog).catch(() => {});
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

    const billingCycle = useMemo<BillingCycle | undefined>(
        () => catalog?.billingCycles.find((b) => b.id === cart?.billingCycleId),
        [catalog, cart]
    );
    const supportTier = useMemo<SupportTier | undefined>(
        () => catalog?.supportTiers.find((s) => s.id === cart?.supportTierId),
        [catalog, cart]
    );
    const serverTier = useMemo<ServerTier | undefined>(
        () => catalog?.serverTiers.find((s) => s.id === cart?.serverTierId),
        [catalog, cart]
    );

    const pricing = useMemo(() => {
        if (!billingCycle || !serverTier || !cart) return { subtotal: 0, discount: 0, total: 0 };
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
        let discount = 0;
        if (promo) {
            if (promo.discountType === 'percent') discount = Math.floor((subtotal * promo.discountValue) / 100);
            else discount = promo.discountValue;
            if (discount > subtotal) discount = subtotal;
        }
        return { subtotal, discount, total: subtotal - discount };
    }, [billingCycle, supportTier, serverTier, cart, promo]);

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
        if (!cart || !billingCycle || !serverTier) return;
        const token = getAuthToken();
        if (!token) {
            router.push('/login');
            return;
        }
        // Minimal validation for required billing fields.
        const required: (keyof typeof billingAddress)[] = ['firstName', 'lastName', 'email', 'phone', 'street1', 'city', 'country'];
        for (const f of required) {
            if (!billingAddress[f].trim()) {
                setError(t('review.fillRequired'));
                return;
            }
        }

        setCheckoutBusy(true);
        setError('');
        try {
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            const res = await apiCheckout(token, {
                billingCycleId: cart.billingCycleId,
                supportTierId: cart.supportTierId,
                serverTierId: cart.serverTierId,
                supportDays: cart.supportDays,
                promoCode: promo?.code || '',
                billingAddress,
                provider,
                successUrl: `${origin}/${locale}/buy/success`,
                cancelUrl: `${origin}/${locale}/buy/review`,
            });
            // Clear cart + redirect to provider.
            if (typeof window !== 'undefined') window.sessionStorage.removeItem(CART_KEY);
            window.location.href = res.url;
        } catch (err) {
            setError(err instanceof Error ? err.message : t('review.checkoutError'));
            setCheckoutBusy(false);
        }
    };

    if (loading || !user) return null;
    if (!catalog || !cart || !billingCycle || !serverTier) {
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
                        <div className="buy-review-lines">
                            <div className="buy-review-line">
                                <span>{labelFor(locale, serverTier.labelEn, serverTier.labelZh)}</span>
                                <span>{formatUSD(serverTier.priceCents)}</span>
                            </div>
                            {supportTier && supportTier.priceCents > 0 && (
                                <div className="buy-review-line">
                                    <span>{labelFor(locale, supportTier.labelEn, supportTier.labelZh)}</span>
                                    <span>{formatUSD(supportTier.priceCents)}{supportTier.pricingType === 'per_day' ? `/${t('perDay')}` : ''}</span>
                                </div>
                            )}
                            <div className="buy-review-line">
                                <span>{labelFor(locale, billingCycle.labelEn, billingCycle.labelZh)}</span>
                                <span>{t('review.years', { n: billingCycle.years })}</span>
                            </div>
                        </div>
                    </div>

                    <div className="buy-block">
                        <h2 className="buy-block-title">{t('review.promoTitle')}</h2>
                        <div className="buy-promo-row">
                            <input
                                className="form-input"
                                placeholder={t('review.promoPlaceholder')}
                                value={promoCode}
                                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                disabled={promoBusy || !!promo}
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
                        {promoMsg && <div className={`form-banner form-banner--${promoMsg.type}`} style={{ marginTop: 10 }}>{promoMsg.text}</div>}
                    </div>

                    <div className="buy-block">
                        <h2 className="buy-block-title">{t('review.billingDetails')}</h2>
                        <div className="buy-billing-grid">
                            <div className="buy-billing-col">
                                <h3 className="buy-billing-subtitle">{t('review.personalInfo')}</h3>
                                <div className="auth-form-row">
                                    <div className="form-group">
                                        <label className="form-label">{t('review.firstName')} *</label>
                                        <input className="form-input" value={billingAddress.firstName} onChange={(e) => setBillingAddress({ ...billingAddress, firstName: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{t('review.lastName')} *</label>
                                        <input className="form-input" value={billingAddress.lastName} onChange={(e) => setBillingAddress({ ...billingAddress, lastName: e.target.value })} />
                                    </div>
                                </div>
                                <div className="auth-form-row">
                                    <div className="form-group">
                                        <label className="form-label">{t('review.email')} *</label>
                                        <input className="form-input" type="email" value={billingAddress.email} onChange={(e) => setBillingAddress({ ...billingAddress, email: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{t('review.phone')} *</label>
                                        <input className="form-input" type="tel" value={billingAddress.phone} onChange={(e) => setBillingAddress({ ...billingAddress, phone: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('review.company')}</label>
                                    <input className="form-input" value={billingAddress.company} onChange={(e) => setBillingAddress({ ...billingAddress, company: e.target.value })} />
                                </div>
                            </div>

                            <div className="buy-billing-col">
                                <h3 className="buy-billing-subtitle">{t('review.billingAddress')}</h3>
                                <div className="form-group">
                                    <label className="form-label">{t('review.street1')} *</label>
                                    <input className="form-input" value={billingAddress.street1} onChange={(e) => setBillingAddress({ ...billingAddress, street1: e.target.value })} />
                                </div>
                                <div className="auth-form-row">
                                    <div className="form-group">
                                        <label className="form-label">{t('review.street2')}</label>
                                        <input className="form-input" value={billingAddress.street2} onChange={(e) => setBillingAddress({ ...billingAddress, street2: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{t('review.city')} *</label>
                                        <input className="form-input" value={billingAddress.city} onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })} />
                                    </div>
                                </div>
                                <div className="auth-form-row">
                                    <div className="form-group">
                                        <label className="form-label">{t('review.country')} *</label>
                                        <input className="form-input" value={billingAddress.country} onChange={(e) => setBillingAddress({ ...billingAddress, country: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{t('review.state')}</label>
                                        <input className="form-input" value={billingAddress.state} onChange={(e) => setBillingAddress({ ...billingAddress, state: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{t('review.postcode')}</label>
                                        <input className="form-input" value={billingAddress.postcode} onChange={(e) => setBillingAddress({ ...billingAddress, postcode: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="buy-block">
                        <h2 className="buy-block-title">{t('review.paymentMethod')}</h2>
                        <div className="buy-provider-grid">
                            <button type="button" className={`buy-provider${provider === 'stripe' ? ' buy-provider--active' : ''}`} onClick={() => setProvider('stripe')}>
                                <div className="buy-provider-label">{t('review.providerStripe')}</div>
                                <div className="buy-provider-sub">{t('review.providerStripeDesc')}</div>
                            </button>
                            <button type="button" className={`buy-provider${provider === 'paypal' ? ' buy-provider--active' : ''}`} onClick={() => setProvider('paypal')}>
                                <div className="buy-provider-label">{t('review.providerPaypal')}</div>
                                <div className="buy-provider-sub">{t('review.providerPaypalDesc')}</div>
                            </button>
                            <button type="button" className={`buy-provider${provider === 'pingxx' ? ' buy-provider--active' : ''}`} onClick={() => setProvider('pingxx')}>
                                <div className="buy-provider-label">{t('review.providerPingxx')}</div>
                                <div className="buy-provider-sub">{t('review.providerPingxxDesc')}</div>
                            </button>
                        </div>
                    </div>
                </div>

                <aside className="buy-summary">
                    <h2 className="buy-summary-title">{t('summary.title')}</h2>
                    <div className="buy-summary-lines">
                        <div className="buy-summary-line">
                            <span>{labelFor(locale, serverTier.labelEn, serverTier.labelZh)}</span>
                            <span>{formatUSD(serverTier.priceCents)}</span>
                        </div>
                        {supportTier && supportTier.priceCents > 0 && (
                            <div className="buy-summary-line">
                                <span>{labelFor(locale, supportTier.labelEn, supportTier.labelZh)}</span>
                                <span>{formatUSD(supportTier.priceCents)}</span>
                            </div>
                        )}
                        <div className="buy-summary-line">
                            <span>{labelFor(locale, billingCycle.labelEn, billingCycle.labelZh)}</span>
                            <span>× {billingCycle.years}</span>
                        </div>
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

                    <div className="buy-summary-total">
                        <span>{t('summary.total')}</span>
                        <span>{formatUSD(pricing.total)}</span>
                    </div>

                    {error && <div className="form-banner form-banner--error">{error}</div>}

                    <button
                        type="button"
                        className={`btn btn-primary btn-lg buy-checkout-btn${checkoutBusy ? ' btn-loading' : ''}`}
                        disabled={checkoutBusy}
                        onClick={handleCheckout}
                    >
                        {t('summary.checkout')}
                    </button>
                </aside>
            </div>
        </section>
    );
}
