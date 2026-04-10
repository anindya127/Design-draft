import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import ScrollAnimation from '@/components/effects/ScrollAnimation';

export const metadata = {
  title: 'Pricing - GCSS | EV Charging Management Platform',
  description: 'Simple, transparent pricing for GCSS EV charging management. From free community edition to full enterprise platform.',
};

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <>
      {/* Hero Section */}
      <section className="section mesh-bg" style={{ paddingTop: 140, paddingBottom: 60, textAlign: 'center' }}>
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

      {/* B2C Pricing Cards */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <ScrollAnimation>
            <div className="section-header" style={{ marginBottom: 32 }}>
              <span className="section-label">{t('pricing.b2c.label')}</span>
              <h2>{t('pricing.b2c.title')}</h2>
              <p>{t('pricing.b2c.desc')}</p>
            </div>
          </ScrollAnimation>
          <ScrollAnimation>
            <div className="pricing-cards">

              {/* H5 Free */}
              <div className="pricing-card glass-card">
                <div className="plan-name">{t('pricing.h5free.name')}</div>
                <div className="plan-price"><span className="currency">$</span>0</div>
                <div className="plan-period">USD</div>
                <ul className="plan-features">
                  <li><span className="check">&#10003;</span> <span>{t('pricing.h5free.f1')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('pricing.h5free.f2')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('pricing.h5free.f3')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('pricing.h5free.f4')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('pricing.h5free.f5')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('pricing.h5free.f6')}</span></li>
                </ul>
                <Link href="/contact" className="btn btn-accent" style={{ width: '100%' }}>{t('pricing.getstarted')}</Link>
              </div>

              {/* H5 Enterprise */}
              <div className="pricing-card glass-card">
                <div className="plan-name">{t('pricing.h5ent.name')}</div>
                <div className="plan-price"><span className="currency">$</span>300</div>
                <div className="plan-period">USD</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginTop: 4, marginBottom: 8, textAlign: 'center' }}>{t('pricing.h5ent.priceNote')}</div>
                <ul className="plan-features">
                  <li><span className="check">&#10003;</span> <span>{t('pricing.h5ent.f1')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('pricing.h5ent.f2')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('pricing.h5ent.f3')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('pricing.h5ent.f4')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('pricing.h5ent.f5')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('pricing.h5ent.f6')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('pricing.h5ent.f7')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('pricing.h5ent.f8')}</span></li>
                </ul>
                <Link href="/contact" className="btn btn-accent" style={{ width: '100%' }}>{t('pricing.buynow')}</Link>
              </div>

              {/* APP Enterprise (Featured) */}
              <div className="pricing-card featured glass-card">
                <div className="plan-name">{t('pricing.appent.name')}</div>
                <div className="plan-price"><span className="currency">$</span>13,900</div>
                <div className="plan-period">USD</div>
                <ul className="plan-features">
                  <li><span className="check">&#10003;</span> <span>{t('pricing.appent.f1')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('pricing.appent.f2')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('pricing.appent.f3')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('pricing.appent.f4')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('pricing.appent.f5')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('pricing.appent.f6')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('pricing.appent.f7')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('pricing.appent.f8')}</span></li>
                </ul>
                <Link href="/contact" className="btn btn-accent" style={{ width: '100%' }}>{t('pricing.buynow')}</Link>
              </div>

            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* B2B Platform Pricing Cards */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <ScrollAnimation>
            <div className="section-header" style={{ marginBottom: 32 }}>
              <span className="section-label">{t('pricing.b2b.label')}</span>
              <h2>{t('pricing.b2b.title')}</h2>
              <p>{t('pricing.b2b.desc')}</p>
            </div>
          </ScrollAnimation>
          <ScrollAnimation>
            <div className="pricing-cards">

              {/* H5 Platform */}
              <div className="pricing-card glass-card">
                <div className="plan-name">{t('pricing.h5plat.name')}</div>
                <div className="plan-price"><span className="currency">$</span>18,800</div>
                <div className="plan-period">USD</div>
                <ul className="plan-features">
                  <li><span className="check">&#10003;</span> <span>{t('pricing.h5plat.f1')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('pricing.h5plat.f2')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('pricing.h5plat.f3')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('pricing.h5plat.f4')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('pricing.h5plat.f5')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('pricing.h5plat.f6')}</span></li>
                </ul>
                <div className="flex-col gap-sm">
                  <Link href="/contact" className="btn btn-accent" style={{ width: '100%' }}>{t('pricing.buynow')}</Link>
                  <Link href="/contact" className="btn btn-outline" style={{ width: '100%', borderColor: '#92400E', color: '#92400E', background: 'transparent' }}>{t('pricing.contactsales')}</Link>
                </div>
              </div>

              {/* APP Platform (Featured) */}
              <div className="pricing-card featured glass-card">
                <div className="plan-name">{t('pricing.appplat.name')}</div>
                <div className="plan-price"><span className="currency">$</span>34,200</div>
                <div className="plan-period">USD</div>
                <ul className="plan-features">
                  <li><span className="check">&#10003;</span> <span>{t('pricing.appplat.f1')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('pricing.appplat.f2')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('pricing.appplat.f3')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('pricing.appplat.f4')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('pricing.appplat.f5')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('pricing.appplat.f6')}</span></li>
                </ul>
                <div className="flex-col gap-sm">
                  <Link href="/contact" className="btn btn-accent" style={{ width: '100%' }}>{t('pricing.buynow')}</Link>
                  <Link href="/contact" className="btn btn-outline" style={{ width: '100%', borderColor: '#92400E', color: '#92400E', background: 'transparent' }}>{t('pricing.contactsales')}</Link>
                </div>
              </div>

            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="section section-alt">
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
                    <th>{t('pricing.h5free.name')}<br /><small style={{ fontWeight: 500, color: 'var(--gray-500)' }}>$0</small></th>
                    <th>{t('pricing.h5ent.name')}<br /><small style={{ fontWeight: 500, color: 'var(--gray-500)' }}>$300 + $1,200/yr</small></th>
                    <th>{t('pricing.appent.name')}<br /><small style={{ fontWeight: 500, color: 'var(--gray-500)' }}>$13,900</small></th>
                    <th>{t('pricing.h5plat.name')}<br /><small style={{ fontWeight: 500, color: 'var(--gray-500)' }}>$18,800</small></th>
                    <th>{t('pricing.appplat.name')}<br /><small style={{ fontWeight: 500, color: 'var(--gray-500)' }}>$34,200</small></th>
                  </tr>
                </thead>
                <tbody>
                  {/* CPMS Category */}
                  <tr className="category-row">
                    <td colSpan={6}>{t('pricing.table.cpms')}</td>
                  </tr>
                  <tr><td>{t('pricing.table.dashboard')}</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td></tr>
                  <tr><td>{t('pricing.table.device')}</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td></tr>
                  <tr><td>{t('pricing.table.station')}</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td></tr>
                  <tr><td>{t('pricing.table.rate')}</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td></tr>
                  <tr><td>{t('pricing.table.order')}</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td></tr>
                  <tr><td>{t('pricing.table.account')}</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td></tr>
                  <tr><td>{t('pricing.table.nfc')}</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td></tr>
                  <tr><td>{t('pricing.table.reports')}</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td></tr>
                  <tr><td>{t('pricing.table.stats')}</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td></tr>

                  {/* Super Admin Category */}
                  <tr className="category-row">
                    <td colSpan={6}>{t('pricing.table.superadmin')}</td>
                  </tr>
                  <tr><td>{t('pricing.table.platformstats')}</td><td>&bull;</td><td>&bull;</td><td>&bull;</td><td>&#10003;</td><td>&#10003;</td></tr>
                  <tr><td>{t('pricing.table.operator')}</td><td>&bull;</td><td>&bull;</td><td>&bull;</td><td>&#10003;</td><td>&#10003;</td></tr>
                  <tr><td>{t('pricing.table.permission')}</td><td>&bull;</td><td>&bull;</td><td>&bull;</td><td>&#10003;</td><td>&#10003;</td></tr>
                  <tr><td>{t('pricing.table.usermgmt')}</td><td>&bull;</td><td>&bull;</td><td>&bull;</td><td>&#10003;</td><td>&#10003;</td></tr>
                  <tr><td>{t('pricing.table.syslog')}</td><td>&bull;</td><td>&bull;</td><td>&bull;</td><td>&#10003;</td><td>&#10003;</td></tr>

                  {/* Description Category */}
                  <tr className="category-row">
                    <td colSpan={6}>{t('pricing.table.description')}</td>
                  </tr>
                  <tr><td>{t('pricing.table.delivery')}</td><td>H5 Web</td><td>H5 Web</td><td>Native APP</td><td>H5 Web</td><td>Native APP</td></tr>
                  <tr><td>{t('pricing.table.endpoints')}</td><td>H5 Page</td><td>H5 Page</td><td>Google Play &amp; App Store</td><td>H5 Page</td><td>Google Play &amp; App Store</td></tr>
                  <tr><td>{t('pricing.table.reglogin')}</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td></tr>
                  <tr><td>{t('pricing.table.qrscan')}</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td></tr>
                  <tr><td>{t('pricing.table.reservation')}</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td></tr>
                  <tr><td>{t('pricing.table.langswitching')}</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td></tr>
                  <tr><td>{t('pricing.table.mapnav')}</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td></tr>
                  <tr><td>{t('pricing.table.order')}</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td></tr>
                  <tr><td>{t('pricing.table.iccard')}</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td></tr>
                </tbody>
              </table>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <ScrollAnimation>
          <div className="container">
            <h2>{t('cta.title')}</h2>
            <p>{t('cta.desc')}</p>
            <div className="cta-buttons">
              <Link href={{ pathname: '/product', hash: 'demo' }} className="btn btn-primary btn-lg">{t('cta.btn1')}</Link>
              <Link href="/contact" className="btn btn-secondary btn-lg">{t('pricing.contactsales')}</Link>
            </div>
          </div>
        </ScrollAnimation>
      </section>
    </>
  );
}
