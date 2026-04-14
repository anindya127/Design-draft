import { getTranslations, setRequestLocale } from 'next-intl/server';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import CounterAnimation from '@/components/effects/CounterAnimation';
import ScrollAnimation from '@/components/effects/ScrollAnimation';
import ImagePlaceholder from '@/components/ui/ImagePlaceholder';
import SubNav from './SubNav';
import DemoTabs from './DemoTabs';
import LanguageRequestForm from './LanguageRequestForm';
import PaymentRequestForm from '@/components/sections/home/PaymentRequestForm';

export const metadata = {
  title: 'B2C Model - GCSS | Direct Operator EV Charging Platform',
  description: 'GCSS B2C solution for direct operators: real-time station management, automated billing, OCPP 1.6 support, and the complete toolkit to run your own charging network.',
};

/* Reusable check-mark SVG */
function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, height: 18, flexShrink: 0 }}>
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
    </svg>
  );
}

export default async function B2CPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <>
      {/* ==================== Sub Navigation ==================== */}
      <SubNav />

      {/* ==================== Section 1: System Overview (Hero) ==================== */}
      <section className="hero mesh-bg product-hero" id="overview">
        <div className="container">
          <div className="hero-content hero-split">
            <div className="hero-text">
              <div className="hero-badge">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="var(--primary)"><path d="M7 0l1.76 5.24L14 7l-5.24 1.76L7 14l-1.76-5.24L0 7l5.24-1.76L7 0z" /></svg>
                <span>{t('product.badge')}</span>
              </div>
              <h1 className="hero-title">OCPP CPMS<br /><span className="text-gradient">{t('product.title2')}</span></h1>
              <p className="hero-desc">{t('product.desc')}</p>
              <div className="hero-buttons">
                <a href="#demo" className="btn btn-primary btn-lg">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><path d="M7.5 4.5v9l6-4.5-6-4.5z" /></svg>
                  <span>{t('product.cta1')}</span>
                </a>
                <a href="#license" className="btn btn-secondary btn-lg">
                  <span>{t('product.cta2')}</span>
                </a>
              </div>
            </div>

          </div>

          {/* Feature Grid */}
          <ScrollAnimation>
            <div className="grid grid-3" style={{ marginTop: 60 }}>
              <div className="card glass-card tilt-card">
                <div className="card-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 16V7a2 2 0 00-2-2H6a2 2 0 00-2 2v9m16 0H4m16 0l1 3H3l1-3" /></svg>
                </div>
                <h3>{t('product.f1.title')}</h3>
                <p>{t('product.f1.desc')}</p>
              </div>
              <div className="card glass-card tilt-card">
                <div className="card-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>
                </div>
                <h3>{t('product.f2.title')}</h3>
                <p>{t('product.f2.desc')}</p>
              </div>
              <div className="card glass-card tilt-card">
                <div className="card-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
                </div>
                <h3>{t('product.f3.title')}</h3>
                <p>{t('product.f3.desc')}</p>
              </div>
              <div className="card glass-card tilt-card">
                <div className="card-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
                </div>
                <h3>{t('product.f4.title')}</h3>
                <p>{t('product.f4.desc')}</p>
              </div>
              <div className="card glass-card tilt-card">
                <div className="card-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                </div>
                <h3>{t('product.f5.title')}</h3>
                <p>{t('product.f5.desc')}</p>
              </div>
              <div className="card glass-card tilt-card">
                <div className="card-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                </div>
                <h3>{t('product.f6.title')}</h3>
                <p>{t('product.f6.desc')}</p>
              </div>
            </div>
          </ScrollAnimation>
        </div>

        {/* Hero Footer Stats Bar — full width */}
        <div className="hero-footer-bar">
          <div className="hero-footer-inner container">
            <div className="hero-footer-stat">
              <span className="hero-footer-icon" style={{ color: 'var(--primary)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
              </span>
              <span className="hero-footer-label">{t('product.stat1')}</span>
              <span className="hero-footer-value"><CounterAnimation target={1000} suffix="+" /></span>
            </div>
            <div className="hero-footer-divider" />
            <div className="hero-footer-stat">
              <span className="hero-footer-icon" style={{ color: 'var(--primary)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>
              </span>
              <span className="hero-footer-label">{t('product.stat2')}</span>
              <span className="hero-footer-value"><CounterAnimation target={100} suffix="+" /></span>
            </div>
            <div className="hero-footer-divider" />
            <div className="hero-footer-stat">
              <span className="hero-footer-icon" style={{ color: 'var(--primary)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              </span>
              <span className="hero-footer-label">{t('product.stat3')}</span>
              <span className="hero-footer-value"><CounterAnimation target={100} suffix="+" /></span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== Section 2: Feature Highlights ==================== */}
      <section className="section section-alt" id="features">
        <div className="container">
          <ScrollAnimation>
            <div className="section-header">
              <span className="section-label">{t('product.features.label')}</span>
              <h2>{t('product.features.title')}</h2>
              <p>{t('product.features.desc')}</p>
            </div>
          </ScrollAnimation>

          {/* 6 Feature Cards */}
          <ScrollAnimation>
            <div className="grid grid-3">
              <div className="card glass-card tilt-card">
                <h3>{t('product.ff1.title')}</h3>
                <p>{t('product.ff1.desc')}</p>
              </div>
              <div className="card glass-card tilt-card">
                <h3>{t('product.ff2.title')}</h3>
                <p>{t('product.ff2.desc')}</p>
              </div>
              <div className="card glass-card tilt-card">
                <h3>{t('product.ff3.title')}</h3>
                <p>{t('product.ff3.desc')}</p>
              </div>
              <div className="card glass-card tilt-card">
                <h3>{t('product.ff4.title')}</h3>
                <p>{t('product.ff4.desc')}</p>
              </div>
              <div className="card glass-card tilt-card">
                <h3>{t('product.ff5.title')}</h3>
                <p>{t('product.ff5.desc')}</p>
              </div>
              <div className="card glass-card tilt-card">
                <h3>{t('product.ff6.title')}</h3>
                <p>{t('product.ff6.desc')}</p>
              </div>
            </div>
          </ScrollAnimation>

          {/* Stunning UI Design */}
          <ScrollAnimation>
            <div style={{ marginTop: 80 }}>
              <div className="feature-row">
                <div className="feature-image-placeholder">
                  <Image src="/images/Ui GCSS.png" alt={t('product.ui.title')} width={1920} height={1080} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14 }} />
                </div>
                <div className="feature-text">
                  <h3>{t('product.ui.title')}</h3>
                  <p>{t('product.ui.desc')}</p>
                  <ul className="feature-list">
                    <li>
                      <CheckIcon />
                      <span>{t('product.ui.li1')}</span>
                    </li>
                    <li>
                      <CheckIcon />
                      <span>{t('product.ui.li2')}</span>
                    </li>
                    <li>
                      <CheckIcon />
                      <span>{t('product.ui.li3')}</span>
                    </li>
                    <li>
                      <CheckIcon />
                      <span>{t('product.ui.li4')}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </ScrollAnimation>

          {/* Your Brand. Your Rules. */}
          <ScrollAnimation>
            <div style={{ marginTop: 40 }}>
              <div className="feature-row reverse">
                <div className="feature-image-placeholder">
                  <Image src="/images/OEM.png" alt={t('product.brand.title')} width={1920} height={1080} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14 }} />
                </div>
                <div className="feature-text">
                  <h3>{t('product.brand.title')}</h3>
                  <p>{t('product.brand.desc')}</p>
                  <ul className="feature-list">
                    <li>
                      <CheckIcon />
                      <span>{t('product.brand.li1')}</span>
                    </li>
                    <li>
                      <CheckIcon />
                      <span>{t('product.brand.li2')}</span>
                    </li>
                    <li>
                      <CheckIcon />
                      <span>{t('product.brand.li3')}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </ScrollAnimation>

          {/* Exclusive UI Customization & Zero-Touch Config */}
          <ScrollAnimation>
            <div className="grid grid-2" style={{ marginTop: 60 }}>
              <div className="card glass-card tilt-card" style={{ textAlign: 'center', padding: 40 }}>
                <div className="card-icon" style={{ margin: '0 auto 20px', background: '#FCE7F3', color: '#9D174D' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                </div>
                <h3>{t('product.uicustom.title')}</h3>
                <p>{t('product.uicustom.desc')}</p>
              </div>
              <div className="card glass-card tilt-card" style={{ textAlign: 'center', padding: 40 }}>
                <div className="card-icon" style={{ margin: '0 auto 20px', background: '#D1FAE5', color: '#065F46' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                </div>
                <h3>{t('product.zeroconfig.title')}</h3>
                <p>{t('product.zeroconfig.desc')}</p>
              </div>
            </div>
          </ScrollAnimation>

          {/* Global Payment Matrix */}
          <ScrollAnimation>
            <div style={{ marginTop: 80 }}>
              <div className="section-header">
                <span className="section-label">{t('product.pay.label')}</span>
                <h2>{t('product.pay.title')}</h2>
                <p>{t('product.pay.desc')}</p>
              </div>

              <div className="grid grid-3" style={{ marginTop: 32, gap: 20 }}>
                <div className="card" style={{ textAlign: 'center' }}>
                  <h4 style={{ marginBottom: 12 }}>{t('product.pay.asia')}</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                    <span className="tag">Alipay</span>
                    <span className="tag">WeChat Pay</span>
                    <span className="tag">GrabPay</span>
                    <span className="tag">GCash</span>
                    <span className="tag">TrueMoney</span>
                    <span className="tag">DragonPay</span>
                    <span className="tag">Boost</span>
                    <span className="tag">JCB</span>
                  </div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                  <h4 style={{ marginBottom: 12 }}>{t('product.pay.europe')}</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                    <span className="tag">Stripe</span>
                    <span className="tag">SEPA</span>
                    <span className="tag">TrustPay</span>
                    <span className="tag">Skrill</span>
                    <span className="tag">Neosurf</span>
                  </div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                  <h4 style={{ marginBottom: 12 }}>{t('product.pay.oceania')}</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                    <span className="tag">Visa</span>
                    <span className="tag">Mastercard</span>
                    <span className="tag">Apple Pay</span>
                    <span className="tag">Google Pay</span>
                  </div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                  <h4 style={{ marginBottom: 12 }}>{t('product.pay.africa')}</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                    <span className="tag">M-PESA</span>
                    <span className="tag">PayPal</span>
                  </div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                  <h4 style={{ marginBottom: 12 }}>{t('product.pay.southamerica')}</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                    <span className="tag">PIX</span>
                    <span className="tag">Visa</span>
                    <span className="tag">Mastercard</span>
                  </div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                  <h4 style={{ marginBottom: 12 }}>{t('product.pay.northamerica')}</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                    <span className="tag">Stripe</span>
                    <span className="tag">Apple Pay</span>
                    <span className="tag">Google Pay</span>
                    <span className="tag">PayPal</span>
                  </div>
                </div>
              </div>
              <PaymentRequestForm />
            </div>
          </ScrollAnimation>

          {/* 20+ Global Languages */}
          <ScrollAnimation>
            <div style={{ marginTop: 80 }}>
              <div className="section-header">
                <span className="section-label">{t('product.lang.label')}</span>
                <h2>{t('product.lang.title')}</h2>
                <p>{t('product.lang.desc')}</p>
              </div>
              <div className="language-cloud">
                <span style={{ fontSize: '2.5rem' }}>English</span>
                <span style={{ fontSize: '2rem' }}>中文</span>
                <span style={{ fontSize: '1.8rem' }}>Francais</span>
                <span style={{ fontSize: '1.6rem' }}>日本語</span>
                <span style={{ fontSize: '1.7rem' }}>한국어</span>
                <span style={{ fontSize: '1.5rem' }}>Espanol</span>
                <span style={{ fontSize: '1.4rem' }}>Deutsch</span>
                <span style={{ fontSize: '1.9rem' }}>Tieng Viet</span>
                <span style={{ fontSize: '1.3rem' }}>ภาษาไทย</span>
                <span style={{ fontSize: '1.6rem' }}>Bahasa</span>
                <span style={{ fontSize: '1.5rem' }}>Русский</span>
                <span style={{ fontSize: '1.4rem' }}>العربية</span>
                <span style={{ fontSize: '1.8rem' }}>Portugues</span>
                <span style={{ fontSize: '1.3rem' }}>සිංහල</span>
                <span style={{ fontSize: '1.5rem' }}>ខ្មែរ</span>
              </div>

              {/* Language Request Form */}
              <LanguageRequestForm />
            </div>
          </ScrollAnimation>

          {/* APP / H5 */}
          <ScrollAnimation>
            <div style={{ marginTop: 80 }}>
              <div className="feature-row">
                <div className="feature-image-placeholder">
                  <Image src="/images/App.png" alt={t('product.app.title')} width={1920} height={480} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14 }} />
                </div>
                <div className="feature-text">
                  <h3>{t('product.app.title')}</h3>
                  <p>{t('product.app.desc')}</p>
                  <ul className="feature-list">
                    <li>
                      <CheckIcon />
                      <span>{t('product.app.li1')}</span>
                    </li>
                    <li>
                      <CheckIcon />
                      <span>{t('product.app.li2')}</span>
                    </li>
                    <li>
                      <CheckIcon />
                      <span>{t('product.app.li3')}</span>
                    </li>
                    <li>
                      <CheckIcon />
                      <span>{t('product.app.li4')}</span>
                    </li>
                    <li>
                      <CheckIcon />
                      <span>{t('product.app.li5')}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </ScrollAnimation>

          {/* Smart Operations Center */}
          <ScrollAnimation>
            <div style={{ marginTop: 40 }}>
              <div className="feature-row reverse">
                <div
                  className="feature-image-placeholder"
                  style={{
                    position: 'relative',
                    aspectRatio: '16/10',
                    borderRadius: 'var(--radius-md, 14px)',
                    overflow: 'hidden',
                    background: '#1a1210',
                    boxShadow:
                      '0 12px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(254, 191, 29, 0.2), 0 0 36px rgba(254, 191, 29, 0.12)',
                  }}
                >
                  <Image
                    src="/images/smart-ops-dashboard.png"
                    alt={t('product.ops.title')}
                    fill
                    sizes="(max-width: 900px) 100vw, 560px"
                    style={{ objectFit: 'cover' }}
                    priority={false}
                  />
                </div>
                <div className="feature-text">
                  <h3>{t('product.ops.title')}</h3>
                  <p>{t('product.ops.desc')}</p>
                  <ul className="feature-list">
                    <li>
                      <CheckIcon />
                      <span>{t('product.ops.li1')}</span>
                    </li>
                    <li>
                      <CheckIcon />
                      <span>{t('product.ops.li2')}</span>
                    </li>
                    <li>
                      <CheckIcon />
                      <span>{t('product.ops.li3')}</span>
                    </li>
                    <li>
                      <CheckIcon />
                      <span>{t('product.ops.li4')}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* ==================== Section 5: Product Gallery ==================== */}
      <section className="section" id="gallery">
        <div className="container">
          <ScrollAnimation>
            <div className="section-header">
              <span className="section-label">{t('product.gallery.label')}</span>
              <h2>{t('product.gallery.title')}</h2>
              <p>{t('product.gallery.desc')}</p>
            </div>
          </ScrollAnimation>

          <ScrollAnimation>
            <div className="grid grid-4 gallery-grid">
              <div className="gallery-phone">
                <Image src="/images/Mobile_home.png" alt={t('product.gallery.home')} width={390} height={844} style={{ width: '100%', height: 'auto', borderRadius: 24 }} />
                <span className="gallery-label">{t('product.gallery.home')}</span>
              </div>
              <div className="gallery-phone">
                <Image src="/images/mobile_ charge.png" alt={t('product.gallery.charging')} width={390} height={844} style={{ width: '100%', height: 'auto', borderRadius: 24 }} />
                <span className="gallery-label">{t('product.gallery.charging')}</span>
              </div>
              <div className="gallery-phone">
                <Image src="/images/Mobile-Map.png" alt={t('product.gallery.map')} width={390} height={844} style={{ width: '100%', height: 'auto', borderRadius: 24 }} />
                <span className="gallery-label">{t('product.gallery.map')}</span>
              </div>
              <div className="gallery-phone">
                <Image src="/images/Mobile_payment.png" alt={t('product.gallery.payment')} width={390} height={844} style={{ width: '100%', height: 'auto', borderRadius: 24 }} />
                <span className="gallery-label">{t('product.gallery.payment')}</span>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* ==================== Section 6: After-sales Service ==================== */}
      <section className="section section-alt" id="support">
        <div className="container">
          <ScrollAnimation>
            <div className="section-header">
              <span className="section-label">{t('product.support.label')}</span>
              <h2>{t('product.support.title')}</h2>
              <p>{t('product.support.desc')}</p>
            </div>
          </ScrollAnimation>

          <ScrollAnimation>
            <div className="grid grid-4">
              <div className="card glass-card tilt-card" style={{ textAlign: 'center', padding: '32px 24px' }}>
                <div className="card-icon" style={{ margin: '0 auto 20px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>
                </div>
                <h3>{t('product.support.s1.title')}</h3>
                <p>{t('product.support.s1.desc')}</p>
              </div>
              <div className="card glass-card tilt-card" style={{ textAlign: 'center', padding: '32px 24px' }}>
                <div className="card-icon" style={{ margin: '0 auto 20px', background: '#F3E8FF', color: '#D4890A' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                </div>
                <h3>{t('product.support.s2.title')}</h3>
                <p>{t('product.support.s2.desc')}</p>
              </div>
              <div className="card glass-card tilt-card" style={{ textAlign: 'center', padding: '32px 24px' }}>
                <div className="card-icon" style={{ margin: '0 auto 20px', background: '#D1FAE5', color: '#065F46' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
                </div>
                <h3>{t('product.support.s3.title')}</h3>
                <p>{t('product.support.s3.desc')}</p>
              </div>
              <div className="card glass-card tilt-card" style={{ textAlign: 'center', padding: '32px 24px' }}>
                <div className="card-icon" style={{ margin: '0 auto 20px', background: '#FEF3C7', color: '#92400E' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                </div>
                <h3>{t('product.support.s4.title')}</h3>
                <p>{t('product.support.s4.desc')}</p>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* ==================== Section 7: System Demo ==================== */}
      <section className="section" id="demo">
        <div className="container">
          <ScrollAnimation>
            <div className="section-header">
              <span className="section-label">{t('product.demo.label')}</span>
              <h2>{t('product.demo.title')}</h2>
              <p>{t('product.demo.desc')}</p>
            </div>
          </ScrollAnimation>

          <ScrollAnimation>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              {/* Tabs */}
              <DemoTabs />

              {/* Status Bar */}
              <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 100, fontSize: '0.8rem' }}>
                  <span style={{ width: 8, height: 8, background: '#10B981', borderRadius: '50%', display: 'inline-block' }}></span>
                  <span style={{ fontWeight: 600 }}>{t('product.demo.status.label')}</span>
                  <span style={{ color: 'var(--gray-500)' }}>{t('product.demo.status.online')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 100, fontSize: '0.8rem' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#F59E0B" strokeWidth="1.5"><circle cx="7" cy="7" r="5.5" /><path d="M7 4v3l2 1" /></svg>
                  <span style={{ fontWeight: 600 }}>{t('product.demo.latency')}</span>
                  <span style={{ color: 'var(--gray-500)' }}>24ms</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 100, fontSize: '0.8rem' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#10B981" strokeWidth="1.5"><path d="M7 1v2M7 11v2M1 7h2M11 7h2" /><circle cx="7" cy="7" r="3" /></svg>
                  <span style={{ fontWeight: 600 }}>{t('product.demo.connection.label')}</span>
                  <span style={{ color: 'var(--gray-500)' }}>{t('product.demo.connection.secure')}</span>
                </div>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* ==================== Section 8: Purchase & License ==================== */}
      <section className="section section-alt" id="license">
        <div className="container">
          <ScrollAnimation>
            <div className="section-header">
              <span className="section-label">{t('product.license.label')}</span>
              <h2>{t('product.license.title')}</h2>
              <p>{t('product.license.desc')}</p>
            </div>
          </ScrollAnimation>

          <ScrollAnimation>
            <div className="pricing-cards">
              {/* Community Edition */}
              <div className="pricing-card glass-card tilt-card">
                <div className="plan-name">{t('product.plan1.name')}</div>
                <div className="plan-price">{t('product.plan1.price')}</div>
                <div className="plan-period">{t('product.plan1.period')}</div>
                <ul className="plan-features">
                  <li><span className="check">&#10003;</span> <span>{t('product.plan1.f1')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('product.plan1.f2')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('product.plan1.f3')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('product.plan1.f4')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('product.plan1.f5')}</span></li>
                </ul>
                <a href="#license" className="btn btn-outline" style={{ width: '100%' }}>{t('product.plan1.btn')}</a>
              </div>

              {/* Enterprise Standard */}
              <div className="pricing-card featured glass-card tilt-card">
                <div className="plan-name">{t('product.plan2.name')}</div>
                <div className="plan-price"><span className="currency">$</span>300</div>
                <div className="plan-period">{t('product.plan2.period')}</div>
                <ul className="plan-features">
                  <li><span className="check">&#10003;</span> <span>{t('product.plan2.f1')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('product.plan2.f2')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('product.plan2.f3')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('product.plan2.f4')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('product.plan2.f5')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('product.plan2.f6')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('product.plan2.f7')}</span></li>
                </ul>
                <a href="#license" className="btn btn-primary" style={{ width: '100%' }}>{t('product.plan2.btn')}</a>
              </div>

              {/* Enterprise Plus */}
              <div className="pricing-card glass-card tilt-card">
                <div className="plan-name">{t('product.plan3.name')}</div>
                <div className="plan-price"><span className="currency">$</span>16,900</div>
                <div className="plan-period">{t('product.plan3.period')}</div>
                <ul className="plan-features">
                  <li><span className="check">&#10003;</span> <span>{t('product.plan3.f1')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('product.plan3.f2')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('product.plan3.f3')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('product.plan3.f4')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('product.plan3.f5')}</span></li>
                  <li><span className="check">&#10003;</span> <span>{t('product.plan3.f6')}</span></li>
                </ul>
                <Link href="/contact" className="btn btn-accent" style={{ width: '100%' }}>{t('product.plan3.btn')}</Link>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* ==================== CTA Section ==================== */}
      <section className="cta-section">
        <ScrollAnimation>
          <div className="container">
            <h2>{t('product.cta.title')}</h2>
            <p>{t('product.cta.desc')}</p>
            <div className="cta-buttons">
              <a href="#license" className="btn btn-primary btn-lg">{t('product.cta.btn1')}</a>
              <Link href="/contact" className="btn btn-secondary btn-lg">{t('product.cta.btn2')}</Link>
            </div>
          </div>
        </ScrollAnimation>
      </section>

      {/* ==================== Changelog (always last on the page) ==================== */}
      <section className="section section-dark" id="changelog">
        <div className="container">
          <ScrollAnimation>
            <div className="section-header">
              <span className="section-label" style={{ background: 'rgba(37,99,235,0.2)', color: '#60A5FA' }}>{t('product.changelog.label')}</span>
              <h2>{t('product.changelog.title')}</h2>
              <p>{t('product.changelog.desc')}</p>
            </div>
          </ScrollAnimation>

          <ScrollAnimation>
            <div className="timeline" style={{ maxWidth: 700, margin: '0 auto' }}>
              <div className="timeline-item">
                <div className="timeline-date">{t('product.changelog.r1date')}</div>
                <div className="timeline-title" style={{ color: 'var(--text-primary)' }}>{t('product.changelog.r1title')}</div>
                <ul style={{ marginTop: 12, paddingLeft: 0 }}>
                  <li style={{ padding: '4px 0', fontSize: '0.9rem', color: 'var(--gray-400)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ color: '#10B981', fontWeight: 700, flexShrink: 0 }}>FIX</span> {t('product.changelog.r1f1')}
                  </li>
                  <li style={{ padding: '4px 0', fontSize: '0.9rem', color: 'var(--gray-400)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ color: '#E6A817', fontWeight: 700, flexShrink: 0 }}>NEW</span> {t('product.changelog.r1f2')}
                  </li>
                  <li style={{ padding: '4px 0', fontSize: '0.9rem', color: 'var(--gray-400)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ color: '#F59E0B', fontWeight: 700, flexShrink: 0 }}>UPD</span> {t('product.changelog.r1f3')}
                  </li>
                  <li style={{ padding: '4px 0', fontSize: '0.9rem', color: 'var(--gray-400)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ color: '#10B981', fontWeight: 700, flexShrink: 0 }}>FIX</span> {t('product.changelog.r1f4')}
                  </li>
                </ul>
              </div>
              <div className="timeline-item">
                <div className="timeline-date">{t('product.changelog.r2date')}</div>
                <div className="timeline-title" style={{ color: 'var(--text-primary)' }}>{t('product.changelog.r2title')}</div>
                <ul style={{ marginTop: 12, paddingLeft: 0 }}>
                  <li style={{ padding: '4px 0', fontSize: '0.9rem', color: 'var(--gray-400)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ color: '#E6A817', fontWeight: 700, flexShrink: 0 }}>NEW</span> {t('product.changelog.r2f1')}
                  </li>
                  <li style={{ padding: '4px 0', fontSize: '0.9rem', color: 'var(--gray-400)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ color: '#E6A817', fontWeight: 700, flexShrink: 0 }}>NEW</span> {t('product.changelog.r2f2')}
                  </li>
                  <li style={{ padding: '4px 0', fontSize: '0.9rem', color: 'var(--gray-400)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ color: '#E6A817', fontWeight: 700, flexShrink: 0 }}>NEW</span> {t('product.changelog.r2f3')}
                  </li>
                  <li style={{ padding: '4px 0', fontSize: '0.9rem', color: 'var(--gray-400)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ color: '#E6A817', fontWeight: 700, flexShrink: 0 }}>NEW</span> {t('product.changelog.r2f4')}
                  </li>
                  <li style={{ padding: '4px 0', fontSize: '0.9rem', color: 'var(--gray-400)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ color: '#F59E0B', fontWeight: 700, flexShrink: 0 }}>UPD</span> {t('product.changelog.r2f5')}
                  </li>
                  <li style={{ padding: '4px 0', fontSize: '0.9rem', color: 'var(--gray-400)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ color: '#F59E0B', fontWeight: 700, flexShrink: 0 }}>UPD</span> {t('product.changelog.r2f6')}
                  </li>
                </ul>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </section>
    </>
  );
}
