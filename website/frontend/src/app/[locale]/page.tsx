import { getTranslations, setRequestLocale } from 'next-intl/server';
import TypingText from '@/components/effects/TypingText';
import CounterAnimation from '@/components/effects/CounterAnimation';
import ScrollAnimation from '@/components/effects/ScrollAnimation';
import { Link } from '@/i18n/navigation';
import BusinessDiagram3D from '@/components/sections/home/BusinessDiagram3D';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: 'GCSS - Global Charger System Service | EV Charging Management Platform',
    description: 'GCSS is the ultimate OCPP-compatible EV charging management platform. Free deployment, flexible scaling, full customization.',
  };
}

const CheckIcon = () => (
  <svg viewBox="0 0 20 20" fill="#10B981">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
  </svg>
);

const StarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="#E6A817">
    <path d="M8 0l2.5 5 5.5.8-4 3.9.9 5.3L8 12.5 3.1 15l.9-5.3-4-3.9L5.5 5z" />
  </svg>
);

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <>
      {/* Hero Section */}
      <section className="hero" style={{ backgroundImage: 'url(/images/hero-bg.webp)', backgroundPosition: 'center 40%', backgroundRepeat: 'no-repeat' }}>
        <div className="container">
          <div className="hero-content hero-split">
            <div className="hero-text">
              <div className="hero-badge">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="var(--primary)">
                  <path d="M7 0l1.76 5.24L14 7l-5.24 1.76L7 14l-1.76-5.24L0 7l5.24-1.76L7 0z" />
                </svg>
                <span>{t('hero.badge')}</span>
              </div>

              <h1 className="hero-title" style={{ marginBottom: 16 }}>
                <span>{t('hero.title1')}</span><br />
                <TypingText words={['CSMS Platform', '管理系统', 'Charge Hub', '充电平台']} />
              </h1>

              <p className="hero-desc">{t('hero.desc')}</p>

              <div className="hero-buttons">
                <Link href="/product" className="btn btn-primary btn-lg">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span>{t('hero.cta1')}</span>
                </Link>
                <Link href="/pricing" className="btn btn-secondary btn-lg">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>{t('hero.cta2')}</span>
                </Link>
              </div>

            </div>

            <div className="hero-visual">
              {/* Floating Icons */}
              <div className="hero-floating-icon float-3d hero-float-1 glass">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <div className="hero-floating-icon float-3d hero-float-2 glass">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                </svg>
              </div>
              <div className="hero-floating-icon float-3d hero-float-3 glass">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className="hero-floating-icon float-3d hero-float-4 glass">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
            </div>
          </div>

        </div>

        {/* Hero Footer Stats Bar — full width */}
        <div className="hero-footer-bar">
          <div className="hero-footer-inner container">
            <div className="hero-footer-stat">
              <span className="hero-footer-icon" style={{ color: 'var(--primary)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m4-5l5 5 5-5m-5 5V3" /></svg>
              </span>
              <span className="hero-footer-label">{t('hero.stat1')}</span>
              <span className="hero-footer-value"><CounterAnimation target={9999} suffix="" /></span>
            </div>
            <div className="hero-footer-divider" />
            <div className="hero-footer-stat">
              <span className="hero-footer-icon" style={{ color: 'var(--primary)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
              </span>
              <span className="hero-footer-label">{t('hero.stat2')}</span>
              <span className="hero-footer-value"><CounterAnimation target={1069} suffix="+" /></span>
            </div>
            <div className="hero-footer-divider" />
            <div className="hero-footer-stat">
              <span className="hero-footer-icon" style={{ color: 'var(--primary)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>
              </span>
              <span className="hero-footer-label">{t('hero.stat3')}</span>
              <span className="hero-footer-value"><CounterAnimation target={100} suffix="+" /></span>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Bar */}
      <section className="trusted-bar">
        <div className="container">
          <p className="trusted-label">{t('trusted.label')}</p>
          <div className="marquee">
  <div className="marquee-track">
    {['ChargePoint', 'EVBox', 'Wallbox', 'ABB E-mobility', 'Schneider', 'Delta', 'BYD', 'Kempower', 'Tritium', 'Autel'].map((name) => (
      <span key={name} className="marquee-item">{name}</span>
    ))}
    {['ChargePoint', 'EVBox', 'Wallbox', 'ABB E-mobility', 'Schneider', 'Delta', 'BYD', 'Kempower', 'Tritium', 'Autel'].map((name) => (
      <span key={`${name}-dup`} className="marquee-item">{name}</span>
    ))}
  </div>
</div>
        </div>
      </section>

      {/* Platform Architecture Section - 3D Diagram */}
      <section className="section" id="business-flow">
        <div className="container">
          <ScrollAnimation>
            <div className="section-header">
              <span className="section-label">{t('businessFlow.label')}</span>
              <h2>{t('businessFlow.title')}</h2>
              <p>{t('businessFlow.desc')}</p>
            </div>
          </ScrollAnimation>
          <BusinessDiagram3D />
          <ScrollAnimation>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Link href="/product" className="btn btn-primary">{t('businessFlow.cta')}</Link>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* Business Models Section */}
      <section className="section section-alt" id="models">
        <div className="container">
          <ScrollAnimation>
            <div className="section-header">
              <span className="section-label">{t('models.label')}</span>
              <h2>{t('models.title')}</h2>
              <p>{t('models.desc')}</p>
            </div>
          </ScrollAnimation>
          <div className="grid grid-2">
            <ScrollAnimation>
              <div className="model-card">
                <div className="model-icon">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <rect x="4" y="8" width="24" height="16" rx="2" stroke="white" strokeWidth="2" />
                    <path d="M16 8V6M12 8V4M20 8V4" stroke="white" strokeWidth="2" />
                  </svg>
                </div>
                <h3>{t('models.b2c.title')}</h3>
                <p>{t('models.b2c.desc')}</p>
                <Link href="/product" className="btn btn-accent" style={{ marginTop: 12 }}>{t('models.learnmore')}</Link>
              </div>
            </ScrollAnimation>
            <ScrollAnimation>
              <div className="model-card">
                <div className="model-icon">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <circle cx="16" cy="16" r="10" stroke="white" strokeWidth="2" />
                    <circle cx="16" cy="16" r="4" stroke="white" strokeWidth="2" />
                    <path d="M16 6v4M16 22v4M6 16h4M22 16h4" stroke="white" strokeWidth="2" />
                  </svg>
                </div>
                <h3>{t('models.b2b.title')}</h3>
                <p>{t('models.b2b.desc')}</p>
                <Link href="/product" className="btn btn-accent" style={{ marginTop: 12 }}>{t('models.learnmore')}</Link>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section" id="how-it-works">
        <div className="container">
          <ScrollAnimation>
            <div className="section-header">
              <span className="section-label">{t('steps.label')}</span>
              <h2>{t('steps.title')}</h2>
              <p>{t('steps.desc')}</p>
            </div>
          </ScrollAnimation>
          <ScrollAnimation>
            <div className="steps-timeline">
              <div className="step-card">
                <div className="step-number">01</div>
                <div className="step-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </div>
                <h3>{t('steps.s1.title')}</h3>
                <p>{t('steps.s1.desc')}</p>
              </div>
              <div className="step-connector">
                <svg width="40" height="2" viewBox="0 0 40 2">
                  <line x1="0" y1="1" x2="40" y2="1" stroke="var(--primary)" strokeWidth="2" strokeDasharray="6 4" />
                </svg>
              </div>
              <div className="step-card">
                <div className="step-number">02</div>
                <div className="step-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h3>{t('steps.s2.title')}</h3>
                <p>{t('steps.s2.desc')}</p>
              </div>
              <div className="step-connector">
                <svg width="40" height="2" viewBox="0 0 40 2">
                  <line x1="0" y1="1" x2="40" y2="1" stroke="var(--primary)" strokeWidth="2" strokeDasharray="6 4" />
                </svg>
              </div>
              <div className="step-card">
                <div className="step-number">03</div>
                <div className="step-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <h3>{t('steps.s3.title')}</h3>
                <p>{t('steps.s3.desc')}</p>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="section section-alt" id="features">
        <div className="container">
          <ScrollAnimation>
            <div className="section-header">
              <span className="section-label">{t('features.label')}</span>
              <h2>{t('features.title')}</h2>
              <p>{t('features.desc')}</p>
            </div>
          </ScrollAnimation>

          <div className="grid grid-3">
            <ScrollAnimation>
              <div className="card">
                <div className="card-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                </div>
                <h3>{t('features.f1.title')}</h3>
                <p>{t('features.f1.desc')}</p>
              </div>
            </ScrollAnimation>
            <ScrollAnimation>
              <div className="card">
                <div className="card-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                </div>
                <h3>{t('features.f2.title')}</h3>
                <p>{t('features.f2.desc')}</p>
              </div>
            </ScrollAnimation>
            <ScrollAnimation>
              <div className="card">
                <div className="card-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <h3>{t('features.f3.title')}</h3>
                <p>{t('features.f3.desc')}</p>
              </div>
            </ScrollAnimation>
            <ScrollAnimation>
              <div className="card">
                <div className="card-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
                <h3>{t('features.f4.title')}</h3>
                <p>{t('features.f4.desc')}</p>
              </div>
            </ScrollAnimation>
            <ScrollAnimation>
              <div className="card">
                <div className="card-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <h3>{t('features.f5.title')}</h3>
                <p>{t('features.f5.desc')}</p>
              </div>
            </ScrollAnimation>
            <ScrollAnimation>
              <div className="card">
                <div className="card-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <h3>{t('features.f6.title')}</h3>
                <p>{t('features.f6.desc')}</p>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* Feature Showcase */}
      <section className="section">
        <div className="container">
          <ScrollAnimation>
            <div className="feature-row">
              <div className="feature-text">
                <span className="section-label">{t('index.smartops.label')}</span>
                <h3>{t('index.smartops.title')}</h3>
                <p>{t('index.smartops.desc')}</p>
                <ul className="feature-list">
                  <li><CheckIcon /> <span>{t('index.smartops.li1')}</span></li>
                  <li><CheckIcon /> <span>{t('index.smartops.li2')}</span></li>
                  <li><CheckIcon /> <span>{t('index.smartops.li3')}</span></li>
                  <li><CheckIcon /> <span>{t('index.smartops.li4')}</span></li>
                </ul>
              </div>
              <div className="image-container">
                <div className="ai-image" style={{ aspectRatio: '4/3', background: 'linear-gradient(135deg, #1a1a3e, #0B1120)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 16, color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 600 }}>Image Placeholder</div>
              </div>
            </div>
          </ScrollAnimation>

          <ScrollAnimation>
            <div className="feature-row reverse">
              <div className="feature-text">
                <span className="section-label">{t('index.mobile.label')}</span>
                <h3>{t('index.mobile.title')}</h3>
                <p>{t('index.mobile.desc')}</p>
                <ul className="feature-list">
                  <li><CheckIcon /> <span>{t('index.mobile.li1')}</span></li>
                  <li><CheckIcon /> <span>{t('index.mobile.li2')}</span></li>
                  <li><CheckIcon /> <span>{t('index.mobile.li3')}</span></li>
                  <li><CheckIcon /> <span>{t('index.mobile.li4')}</span></li>
                </ul>
              </div>
              <div className="image-container">
                <div className="ai-image" style={{ aspectRatio: '4/3', background: 'linear-gradient(135deg, #1a1a3e, #0B1120)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 16, color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 600 }}>Image Placeholder</div>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* Feature Support Matrix */}
      <section className="section section-alt" id="matrix">
        <div className="container">
          <ScrollAnimation>
            <div className="section-header">
              <span className="section-label">{t('matrix.label')}</span>
              <h2>{t('matrix.title')}</h2>
              <p>{t('matrix.desc')}</p>
            </div>
          </ScrollAnimation>
          <div className="matrix-section">
            <ScrollAnimation>
              <div className="matrix-column" style={{ border: '1px solid var(--border-light)' }}>
                <div className="matrix-header">{t('matrix.app.title')}</div>
                <div className="matrix-body">
                  <ul>
                    <li>{t('matrix.app.li1')}</li>
                    <li>{t('matrix.app.li2')}</li>
                    <li>{t('matrix.app.li3')}</li>
                    <li>{t('matrix.app.li4')}</li>
                    <li>{t('matrix.app.li5')}</li>
                    <li>{t('matrix.app.li6')}</li>
                    <li>{t('matrix.app.li7')}</li>
                    <li>{t('matrix.app.li8')}</li>
                  </ul>
                </div>
              </div>
            </ScrollAnimation>
            <ScrollAnimation>
              <div className="matrix-column" style={{ border: '1px solid var(--border-light)' }}>
                <div className="matrix-header">{t('matrix.cpms.title')}</div>
                <div className="matrix-body">
                  <ul>
                    <li>{t('matrix.cpms.li1')}</li>
                    <li>{t('matrix.cpms.li2')}</li>
                    <li>{t('matrix.cpms.li3')}</li>
                    <li>{t('matrix.cpms.li4')}</li>
                    <li>{t('matrix.cpms.li5')}</li>
                    <li>{t('matrix.cpms.li6')}</li>
                    <li>{t('matrix.cpms.li7')}</li>
                    <li>{t('matrix.cpms.li8')}</li>
                    <li>{t('matrix.cpms.li9')}</li>
                    <li>{t('matrix.cpms.li10')}</li>
                    <li>{t('matrix.cpms.li11')}</li>
                  </ul>
                </div>
              </div>
            </ScrollAnimation>
            <ScrollAnimation>
              <div className="matrix-column" style={{ border: '1px solid var(--border-light)' }}>
                <div className="matrix-header" style={{ background: 'linear-gradient(135deg,#EB5A3C,#D4452A)' }}>{t('matrix.platform.title')}</div>
                <div className="matrix-body">
                  <ul>
                    <li>{t('matrix.platform.li1')}</li>
                    <li>{t('matrix.platform.li2')}</li>
                    <li>{t('matrix.platform.li3')}</li>
                    <li>{t('matrix.platform.li4')}</li>
                    <li>{t('matrix.platform.li5')}</li>
                    <li>{t('matrix.platform.li6')}</li>
                  </ul>
                </div>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* Multi-Language Section */}
      <section className="section">
        <div className="container">
          <ScrollAnimation>
            <div className="section-header">
              <span className="section-label">{t('lang.label')}</span>
              <h2>{t('lang.title')}</h2>
              <p>{t('lang.desc')}</p>
            </div>
          </ScrollAnimation>
          <ScrollAnimation>
            <div className="language-cloud">
              <span style={{ fontSize: '2.8rem' }}>你好</span>
              <span style={{ fontSize: '2rem' }}>Hello</span>
              <span style={{ fontSize: '1.5rem' }}>Xin chào</span>
              <span style={{ fontSize: '2.2rem' }}>Привет</span>
              <span style={{ fontSize: '1.5rem' }}>Apa kabar</span>
              <span style={{ fontSize: '1.8rem' }}>Hai</span>
              <span style={{ fontSize: '1.7rem' }}>สวัสดี</span>
              <span style={{ fontSize: '2.4rem' }}>හෙලෝ</span>
              <span style={{ fontSize: '1.4rem' }}>مرحبا</span>
              <span style={{ fontSize: '2rem' }}>Bonjour</span>
              <span style={{ fontSize: '1.6rem' }}>Hola</span>
              <span style={{ fontSize: '1.5rem' }}>Ciao</span>
            </div>
          </ScrollAnimation>
          <ScrollAnimation>
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Link href="/product" className="btn btn-secondary">{t('lang.viewMore')}</Link>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* Global Map Section */}
      <section className="map-section">
        <div className="container">
          <ScrollAnimation>
            <div className="section-header">
              <span className="section-label">{t('map.label')}</span>
              <h2>{t('map.title')}</h2>
              <p>{t('map.desc')}</p>
            </div>
          </ScrollAnimation>
          <ScrollAnimation>
            <div className="map-container" style={{ background: 'linear-gradient(135deg, #0B1120 0%, #1a1a3e 50%, #0B1120 100%)' }}>
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(26,26,62,0.4), rgba(11,17,32,0.4))', position: 'absolute', inset: 0 }} />
              <div className="map-placeholder-text" style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'white', marginBottom: 8 }}>100+</div>
                <div style={{ color: '#94A3B8' }}>Countries &amp; Growing</div>
              </div>
              <div className="map-dot" style={{ top: '35%', left: '20%' }} />
              <div className="map-dot" style={{ top: '30%', left: '48%', animationDelay: '-0.5s' }} />
              <div className="map-dot" style={{ top: '35%', left: '72%', animationDelay: '-1s' }} />
              <div className="map-dot" style={{ top: '55%', left: '55%', animationDelay: '-1.5s' }} />
              <div className="map-dot" style={{ top: '40%', left: '80%', animationDelay: '-2s' }} />
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* Payment Partners Section */}
      <section className="section section-alt">
        <div className="container">
          <ScrollAnimation>
            <div className="section-header">
              <span className="section-label">{t('payment.label')}</span>
              <h2>{t('payment.title')}</h2>
              <p>{t('payment.desc')}</p>
            </div>
          </ScrollAnimation>
          <ScrollAnimation>
            <div className="payment-logos">
              {['Visa', 'Mastercard', 'PayPal', 'Alipay', 'WeChat Pay', 'Apple Pay', 'Google Pay', 'Stripe', 'GrabPay', 'TrueMoney', 'GCash', 'M-PESA', 'Neosurf', 'Skrill', 'PIX', 'JCB'].map((name) => (
                <div key={name} className="payment-logo" style={{ padding: '10px 18px', borderRadius: 10, background: 'var(--dark-card)', border: '1px solid var(--border-subtle)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  {name}
                </div>
              ))}
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section" id="testimonials">
        <div className="container">
          <ScrollAnimation>
            <div className="section-header">
              <span className="section-label">{t('testimonials.label')}</span>
              <h2>{t('testimonials.title')}</h2>
              <p>{t('testimonials.desc')}</p>
            </div>
          </ScrollAnimation>
          <div className="grid grid-3">
            <ScrollAnimation>
              <div className="testimonial-card">
                <div className="testimonial-stars">
                  <StarIcon /><StarIcon /><StarIcon /><StarIcon /><StarIcon />
                </div>
                <p className="testimonial-text">{t('testimonials.t1.text')}</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">ST</div>
                  <div>
                    <div className="testimonial-name">{t('testimonials.t1.name')}</div>
                    <div className="testimonial-role">{t('testimonials.t1.role')}</div>
                  </div>
                </div>
              </div>
            </ScrollAnimation>
            <ScrollAnimation>
              <div className="testimonial-card">
                <div className="testimonial-stars">
                  <StarIcon /><StarIcon /><StarIcon /><StarIcon /><StarIcon />
                </div>
                <p className="testimonial-text">{t('testimonials.t2.text')}</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">ML</div>
                  <div>
                    <div className="testimonial-name">{t('testimonials.t2.name')}</div>
                    <div className="testimonial-role">{t('testimonials.t2.role')}</div>
                  </div>
                </div>
              </div>
            </ScrollAnimation>
            <ScrollAnimation>
              <div className="testimonial-card">
                <div className="testimonial-stars">
                  <StarIcon /><StarIcon /><StarIcon /><StarIcon /><StarIcon />
                </div>
                <p className="testimonial-text">{t('testimonials.t3.text')}</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">AK</div>
                  <div>
                    <div className="testimonial-name">{t('testimonials.t3.name')}</div>
                    <div className="testimonial-role">{t('testimonials.t3.role')}</div>
                  </div>
                </div>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section" style={{ background: 'var(--dark)' }}>
        <div className="container">
          <ScrollAnimation>
            <div className="hero-badge" style={{ marginBottom: 16 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="var(--primary)">
                <path d="M7 0l1.76 5.24L14 7l-5.24 1.76L7 14l-1.76-5.24L0 7l5.24-1.76L7 0z" />
              </svg>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t('cta.badge')}</span>
            </div>
            <h2>{t('cta.title')}</h2>
            <p>{t('cta.desc')}</p>
            <div className="cta-buttons">
              <Link href="/product" className="btn btn-primary btn-lg">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span>{t('cta.btn1')}</span>
              </Link>
              <Link href="/contact" className="btn btn-secondary btn-lg">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                <span>{t('cta.btn3')}</span>
              </Link>
            </div>
            <div className="cta-trust">
              <div className="cta-trust-item">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13.5 4.5l-7 7L3 8" stroke="#10B981" strokeWidth="2" />
                </svg>
                <span>{t('cta.trust1')}</span>
              </div>
              <div className="cta-trust-item">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13.5 4.5l-7 7L3 8" stroke="#10B981" strokeWidth="2" />
                </svg>
                <span>{t('cta.trust2')}</span>
              </div>
              <div className="cta-trust-item">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13.5 4.5l-7 7L3 8" stroke="#10B981" strokeWidth="2" />
                </svg>
                <span>{t('cta.trust3')}</span>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </section>
    </>
  );
}
