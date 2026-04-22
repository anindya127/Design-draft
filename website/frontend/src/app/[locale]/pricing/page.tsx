import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import ScrollAnimation from '@/components/effects/ScrollAnimation';

export const metadata = {
    title: 'Pricing - GCSS | EV Charging Management Platform',
    description: 'Transparent pricing for GCSS EV charging management. Six tiers across two hosting modes. From $84/year/charger SaaS to full enterprise platform.',
};

type Plan = {
    keyBase: string;
    featureCount: number;
    featured?: boolean;
};

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations();

    const hostedPlans: Plan[] = [
        { keyBase: 'pricing.saas', featureCount: 6 },
        { keyBase: 'pricing.dedicated', featureCount: 6 },
    ];

    const selfhostedPlans: Plan[] = [
        { keyBase: 'pricing.customweb', featureCount: 8 },
        { keyBase: 'pricing.appent', featureCount: 8 },
        { keyBase: 'pricing.webplat', featureCount: 8 },
        { keyBase: 'pricing.appplat', featureCount: 8, featured: true },
    ];

    const renderCard = (plan: Plan) => (
        <div key={plan.keyBase} className={`pricing-card glass-card${plan.featured ? ' featured' : ''}`}>
            <div className="plan-name">{t(`${plan.keyBase}.name` as any)}</div>
            <div className="plan-price">
                <span>{t(`${plan.keyBase}.price` as any)}</span>
                <span className="plan-price-unit">{t(`${plan.keyBase}.priceUnit` as any)}</span>
            </div>
            <div className="plan-price-note">{t(`${plan.keyBase}.priceNote` as any)}</div>
            <ul className="plan-features">
                {Array.from({ length: plan.featureCount }).map((_, i) => (
                    <li key={i}>
                        <span className="check">&#10003;</span>
                        <span>{t(`${plan.keyBase}.f${i + 1}` as any)}</span>
                    </li>
                ))}
            </ul>
            <div className="plan-actions">
                <Link href="/buy" className="btn btn-primary btn-full">{t('pricing.buynow')}</Link>
                <Link href="/contact" className="btn btn-secondary btn-full">{t('pricing.contactsales')}</Link>
            </div>
        </div>
    );

    const addons = [
        { key: 'mobileLang', priceKey: 'mobileLangPrice' },
        { key: 'adminLang', priceKey: 'adminLangPrice' },
        { key: 'gateway', priceKey: 'gatewayPrice' },
        { key: 'pos', priceKey: 'posPrice' },
        { key: 'custom', priceKey: 'customPrice' },
        { key: 'store', priceKey: 'storePrice' },
    ];

    return (
        <>
            {/* Hero */}
            <section className="section mesh-bg" style={{ paddingTop: 140, paddingBottom: 48, textAlign: 'center' }}>
                <div className="container">
                    <ScrollAnimation>
                        <div className="section-header">
                            <span className="section-label">{t('pricing.label')}</span>
                            <h1>{t('pricing.title')}</h1>
                            <p>{t('pricing.desc')}</p>
                        </div>
                    </ScrollAnimation>
                </div>
            </section>

            {/* Hosted Mode */}
            <section className="section" style={{ paddingTop: 0 }}>
                <div className="container">
                    <ScrollAnimation>
                        <div className="section-header" style={{ marginBottom: 24 }}>
                            <span className="section-label">{t('pricing.hosted.label')}</span>
                            <h2>{t('pricing.hosted.title')}</h2>
                            <p>{t('pricing.hosted.desc')}</p>
                        </div>
                    </ScrollAnimation>
                    <ScrollAnimation>
                        <div className="pricing-cards pricing-cards--2col">
                            {hostedPlans.map(renderCard)}
                        </div>
                    </ScrollAnimation>
                </div>
            </section>

            {/* Private Deployment */}
            <section className="section" style={{ paddingTop: 0 }}>
                <div className="container">
                    <ScrollAnimation>
                        <div className="section-header" style={{ marginBottom: 24 }}>
                            <span className="section-label">{t('pricing.selfhosted.label')}</span>
                            <h2>{t('pricing.selfhosted.title')}</h2>
                            <p>{t('pricing.selfhosted.desc')}</p>
                        </div>
                    </ScrollAnimation>
                    <ScrollAnimation>
                        <div className="pricing-cards pricing-cards--4col">
                            {selfhostedPlans.map(renderCard)}
                        </div>
                    </ScrollAnimation>
                </div>
            </section>

            {/* Add-ons */}
            <section className="section section-alt">
                <div className="container">
                    <ScrollAnimation>
                        <div className="section-header">
                            <span className="section-label">{t('pricing.addons.label')}</span>
                            <h2>{t('pricing.addons.title')}</h2>
                            <p>{t('pricing.addons.desc')}</p>
                        </div>
                    </ScrollAnimation>
                    <ScrollAnimation>
                        <div className="addons-grid">
                            {addons.map((a) => (
                                <div key={a.key} className="addon-card">
                                    <div className="addon-label">{t(`pricing.addons.${a.key}` as any)}</div>
                                    <div className="addon-price">{t(`pricing.addons.${a.priceKey}` as any)}</div>
                                </div>
                            ))}
                        </div>
                    </ScrollAnimation>
                </div>
            </section>

            {/* Feature Comparison */}
            <section className="section">
                <div className="container">
                    <ScrollAnimation>
                        <div className="section-header">
                            <span className="section-label">{t('pricing.compare.label')}</span>
                            <h2>{t('pricing.compare.title')}</h2>
                            <p>{t('pricing.compare.desc')}</p>
                        </div>
                    </ScrollAnimation>

                    <ScrollAnimation>
                        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                            <table className="comparison-table">
                                <thead>
                                    <tr>
                                        <th>{t('pricing.table.feature')}</th>
                                        <th>{t('pricing.saas.name')}<br /><small>$84/yr/charger</small></th>
                                        <th>{t('pricing.dedicated.name')}<br /><small>$200/mo</small></th>
                                        <th>{t('pricing.customweb.name')}<br /><small>$300 + $120/mo</small></th>
                                        <th>{t('pricing.appent.name')}<br /><small>$16,900</small></th>
                                        <th>{t('pricing.webplat.name')}<br /><small>$21,800</small></th>
                                        <th>{t('pricing.appplat.name')}<br /><small>$34,200</small></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* CPMS */}
                                    <tr className="category-row"><td colSpan={7}>{t('pricing.table.cpms')}</td></tr>
                                    <tr><td>{t('pricing.table.dashboard')}</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td></tr>
                                    <tr><td>{t('pricing.table.device')}</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td></tr>
                                    <tr><td>{t('pricing.table.station')}</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td></tr>
                                    <tr><td>{t('pricing.table.rate')}</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td></tr>
                                    <tr><td>{t('pricing.table.order')}</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td></tr>
                                    <tr><td>{t('pricing.table.account')}</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td></tr>
                                    <tr><td>{t('pricing.table.nfc')}</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td></tr>
                                    <tr><td>{t('pricing.table.reports')}</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td></tr>

                                    {/* Super Admin */}
                                    <tr className="category-row"><td colSpan={7}>{t('pricing.table.superadmin')}</td></tr>
                                    <tr><td>{t('pricing.table.platformstats')}</td><td>&#10005;</td><td>&#10005;</td><td>&#10005;</td><td>&#10005;</td><td>&#10003;</td><td>&#10003;</td></tr>
                                    <tr><td>{t('pricing.table.operator')}</td><td>&#10005;</td><td>&#10005;</td><td>&#10005;</td><td>&#10005;</td><td>&#10003;</td><td>&#10003;</td></tr>
                                    <tr><td>{t('pricing.table.permission')}</td><td>&#10005;</td><td>&#10005;</td><td>&#10005;</td><td>&#10005;</td><td>&#10003;</td><td>&#10003;</td></tr>
                                    <tr><td>{t('pricing.table.usermgmt')}</td><td>&#10005;</td><td>&#10005;</td><td>&#10005;</td><td>&#10005;</td><td>&#10003;</td><td>&#10003;</td></tr>
                                    <tr><td>{t('pricing.table.syslog')}</td><td>&#10005;</td><td>&#10005;</td><td>&#10005;</td><td>&#10005;</td><td>&#10003;</td><td>&#10003;</td></tr>

                                    {/* Description */}
                                    <tr className="category-row"><td colSpan={7}>{t('pricing.table.description')}</td></tr>
                                    <tr><td>{t('pricing.table.delivery')}</td><td>SaaS</td><td>Hosted</td><td>Web APP</td><td>Native APP</td><td>Web APP</td><td>Native APP</td></tr>
                                    <tr><td>{t('pricing.table.endpoints')}</td><td>H5</td><td>H5</td><td>H5</td><td>Google Play &amp; App Store</td><td>H5</td><td>Google Play &amp; App Store</td></tr>
                                    <tr><td>{t('pricing.table.reglogin')}</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td></tr>
                                    <tr><td>{t('pricing.table.qrscan')}</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td></tr>
                                    <tr><td>{t('pricing.table.reservation')}</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td></tr>
                                    <tr><td>{t('pricing.table.langswitching')}</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td></tr>
                                    <tr><td>{t('pricing.table.mapnav')}</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td></tr>
                                    <tr><td>{t('pricing.table.iccard')}</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </ScrollAnimation>
                </div>
            </section>

            {/* CTA */}
            <section className="cta-section">
                <ScrollAnimation>
                    <div className="container">
                        <h2>{t('cta.title')}</h2>
                        <p>{t('cta.desc')}</p>
                        <div className="cta-buttons">
                            <Link href="/buy" className="btn btn-primary btn-lg">{t('cta.btn1')}</Link>
                            <Link href="/contact" className="btn btn-secondary btn-lg">{t('pricing.contactsales')}</Link>
                        </div>
                    </div>
                </ScrollAnimation>
            </section>
        </>
    );
}
