import { getTranslations, setRequestLocale } from 'next-intl/server';
import Image from 'next/image';
import TypingText from '@/components/effects/TypingText';
import CounterAnimation from '@/components/effects/CounterAnimation';
import ScrollAnimation from '@/components/effects/ScrollAnimation';
import { Link } from '@/i18n/navigation';
import BusinessModelsSection from '@/components/sections/home/BusinessModelsSection';
import { DiagramModalProvider } from '@/components/sections/home/DiagramModal';
import GlobeVisualization from '@/components/sections/home/GlobeVisualization';
import PaymentRequestForm from '@/components/sections/home/PaymentRequestForm';
import { PAYMENT_ICONS, PAYMENT_REGIONS } from '@/components/sections/home/paymentIcons';

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
    <DiagramModalProvider>
      {/* Hero Section */}
      <section className="hero hero-themed-bg">
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

      {/* EV Charger Manufacturers Bar */}
      <section className="trusted-bar">
        <div className="container">
          <p className="trusted-label">{t('manufacturers.label')}</p>
          <div className="marquee">
            <div className="marquee-track marquee-track-reverse">
              {['TiTans', 'Daoer', 'winline', 'yes', 'jingyi', 'shiyou', 'xundao', 'Fullwatt', 'TOPSTAR', 'UNIT', 'Xupernova', 'wolun', 'Willdigits', 'lingao', 'diangshanjia', 'LV C-CHONG', 'Lifud', 'Delixi', 'Evcity', 'bomern'].map((name) => (
                <span key={name} className="marquee-item">{name}</span>
              ))}
              {['TiTans', 'Daoer', 'winline', 'yes', 'jingyi', 'shiyou', 'xundao', 'Fullwatt', 'TOPSTAR', 'UNIT', 'Xupernova', 'wolun', 'Willdigits', 'lingao', 'diangshanjia', 'LV C-CHONG', 'Lifud', 'Delixi', 'Evcity', 'bomern'].map((name) => (
                <span key={`${name}-dup`} className="marquee-item">{name}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Business Models Section */}
      <BusinessModelsSection />

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
                <div className="step-number">{t('steps.stepLabel', { n: 1 })}</div>
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
                <div className="step-number">{t('steps.stepLabel', { n: 2 })}</div>
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
                <div className="step-number">{t('steps.stepLabel', { n: 3 })}</div>
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
              <div className="card card-with-img" style={{ height: '100%' }}>
                <div className="card-img-placeholder">
                  <svg viewBox="0 0 280 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="20" y="20" width="240" height="120" rx="8" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
                    <rect x="40" y="45" width="60" height="40" rx="6" fill="var(--primary-dim)" stroke="var(--primary)" strokeWidth="1" opacity="0.6" />
                    <circle cx="70" cy="58" r="4" fill="var(--primary)" opacity="0.5" />
                    <rect x="42" y="72" width="56" height="3" rx="1.5" fill="var(--primary)" opacity="0.3" />
                    <rect x="120" y="45" width="60" height="40" rx="6" fill="var(--primary-dim)" stroke="var(--primary)" strokeWidth="1" opacity="0.6" />
                    <circle cx="150" cy="58" r="4" fill="#10B981" opacity="0.5" />
                    <rect x="122" y="72" width="56" height="3" rx="1.5" fill="var(--primary)" opacity="0.3" />
                    <rect x="200" y="45" width="60" height="40" rx="6" fill="var(--primary-dim)" stroke="var(--primary)" strokeWidth="1" opacity="0.4" />
                    <circle cx="230" cy="58" r="4" fill="var(--text-tertiary)" opacity="0.4" />
                    <rect x="40" y="100" width="220" height="6" rx="3" fill="var(--primary-dim)" opacity="0.4" />
                    <rect x="40" y="112" width="140" height="6" rx="3" fill="var(--primary-dim)" opacity="0.25" />
                  </svg>
                </div>
                <h3>{t('features.f1.title')}</h3>
                <p>{t('features.f1.desc')}</p>
              </div>
            </ScrollAnimation>
            <ScrollAnimation>
              <div className="card card-with-img">
                <div className="card-img-placeholder">
                  <svg viewBox="0 0 280 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="20" y="20" width="240" height="120" rx="8" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
                    <rect x="40" y="40" width="200" height="55" rx="6" fill="var(--primary-dim)" opacity="0.3" />
                    <rect x="50" y="50" width="60" height="8" rx="2" fill="var(--primary)" opacity="0.4" />
                    <text x="50" y="56" fontSize="5" fill="var(--primary)" opacity="0.5">Peak</text>
                    <rect x="50" y="62" width="90" height="12" rx="2" fill="#10B981" opacity="0.3" />
                    <rect x="50" y="78" width="50" height="12" rx="2" fill="#3B82F6" opacity="0.3" />
                    <line x1="160" y1="48" x2="160" y2="90" stroke="var(--text-tertiary)" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
                    <circle cx="180" cy="55" r="12" stroke="var(--primary)" strokeWidth="1.5" fill="var(--primary-dim)" opacity="0.5" />
                    <path d="M176 55l3 3 5-6" stroke="var(--primary)" strokeWidth="1.5" opacity="0.6" />
                    <rect x="40" y="105" width="120" height="5" rx="2.5" fill="var(--primary-dim)" opacity="0.3" />
                    <rect x="40" y="115" width="80" height="5" rx="2.5" fill="var(--primary-dim)" opacity="0.2" />
                  </svg>
                </div>
                <h3>{t('features.f2.title')}</h3>
                <p>{t('features.f2.desc')}</p>
              </div>
            </ScrollAnimation>
            <ScrollAnimation>
              <div className="card card-with-img" style={{ height: '100%' }}>
                <div className="card-img-placeholder">
                  <svg viewBox="0 0 280 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="20" y="20" width="240" height="120" rx="8" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
                    <path d="M80 90 L140 50 L200 90" stroke="#EF4444" strokeWidth="2" fill="none" opacity="0.5" />
                    <circle cx="140" cy="50" r="16" stroke="#EF4444" strokeWidth="1.5" fill="rgba(239,68,68,0.08)" />
                    <line x1="140" y1="42" x2="140" y2="54" stroke="#EF4444" strokeWidth="2" opacity="0.7" />
                    <circle cx="140" cy="60" r="1.5" fill="#EF4444" opacity="0.7" />
                    <rect x="60" y="100" width="160" height="4" rx="2" fill="var(--primary-dim)" opacity="0.3" />
                    <rect x="60" y="108" width="100" height="4" rx="2" fill="var(--primary-dim)" opacity="0.2" />
                    <circle cx="70" cy="55" r="6" fill="#10B981" stroke="#10B981" strokeWidth="1" opacity="0.3" />
                    <circle cx="210" cy="55" r="6" fill="#EF4444" stroke="#EF4444" strokeWidth="1" opacity="0.3" />
                  </svg>
                </div>
                <h3>{t('features.f3.title')}</h3>
                <p>{t('features.f3.desc')}</p>
              </div>
            </ScrollAnimation>
            <ScrollAnimation>
              <div className="card card-with-img" style={{ height: '100%' }}>
                <div className="card-img-placeholder">
                  <svg viewBox="0 0 280 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="20" y="20" width="240" height="120" rx="8" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
                    <rect x="90" y="35" width="100" height="65" rx="8" fill="var(--primary-dim)" stroke="var(--primary)" strokeWidth="1" opacity="0.4" />
                    <rect x="100" y="45" width="80" height="10" rx="3" fill="var(--primary)" opacity="0.15" />
                    <rect x="100" y="60" width="80" height="3" rx="1.5" fill="var(--text-tertiary)" opacity="0.3" />
                    <rect x="100" y="67" width="55" height="3" rx="1.5" fill="var(--text-tertiary)" opacity="0.2" />
                    <rect x="100" y="78" width="36" height="14" rx="4" fill="var(--primary)" opacity="0.3" />
                    <circle cx="60" cy="68" r="16" stroke="var(--primary)" strokeWidth="1.5" fill="var(--primary-dim)" opacity="0.4" />
                    <path d="M54 68 h12 M60 62 v12" stroke="var(--primary)" strokeWidth="1.5" opacity="0.5" />
                    <rect x="60" y="110" width="160" height="4" rx="2" fill="var(--primary-dim)" opacity="0.3" />
                    <rect x="60" y="118" width="100" height="4" rx="2" fill="var(--primary-dim)" opacity="0.2" />
                  </svg>
                </div>
                <h3>{t('features.f4.title')}</h3>
                <p>{t('features.f4.desc')}</p>
              </div>
            </ScrollAnimation>
            <ScrollAnimation>
              <div className="card card-with-img" style={{ height: '100%' }}>
                <div className="card-img-placeholder">
                  <svg viewBox="0 0 280 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="20" y="20" width="240" height="120" rx="8" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
                    <rect x="100" y="35" width="80" height="50" rx="6" fill="var(--primary-dim)" stroke="var(--primary)" strokeWidth="1" opacity="0.4" />
                    <rect x="110" y="45" width="60" height="6" rx="2" fill="var(--primary)" opacity="0.3" />
                    <rect x="110" y="55" width="40" height="6" rx="2" fill="#10B981" opacity="0.3" />
                    <rect x="110" y="65" width="50" height="6" rx="2" fill="var(--primary)" opacity="0.2" />
                    <path d="M140 90 L140 105" stroke="var(--primary)" strokeWidth="1.5" opacity="0.4" />
                    <polyline points="133 98 140 105 147 98" stroke="var(--primary)" strokeWidth="1.5" fill="none" opacity="0.4" />
                    <rect x="115" y="108" width="50" height="20" rx="4" fill="var(--primary-dim)" stroke="var(--primary)" strokeWidth="1" opacity="0.3" />
                    <path d="M132 118 l4-4 8 8" stroke="#10B981" strokeWidth="1.5" fill="none" opacity="0.5" />
                  </svg>
                </div>
                <h3>{t('features.f5.title')}</h3>
                <p>{t('features.f5.desc')}</p>
              </div>
            </ScrollAnimation>
            <ScrollAnimation>
              <div className="card card-with-img" style={{ height: '100%' }}>
                <div className="card-img-placeholder">
                  <Image
                    src="/images/dashboard-home.png"
                    alt="Analytics Dashboard"
                    width={1920}
                    height={1080}
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="card-image"
                  />
                </div>
                <h3>{t('features.f6.title')}</h3>
                <p>{t('features.f6.desc')}</p>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* Mobile Feature Cards */}
      <section className="section">
        <div className="container">
          <ScrollAnimation>
            <div className="section-header">
              <span className="section-label">{t('index.mobile.label')}</span>
              <h2>{t('index.mobile.title')}</h2>
              <p>{t('index.mobile.desc')}</p>
            </div>
          </ScrollAnimation>
          <div className="grid grid-4">
            <ScrollAnimation>
              <div className="card card-with-img" style={{ height: '100%' }}>
                <div className="card-img-placeholder">
                  <svg viewBox="0 0 280 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="20" y="15" width="240" height="110" rx="8" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
                    <rect x="90" y="30" width="50" height="50" rx="8" stroke="var(--primary)" strokeWidth="1.5" fill="var(--primary-dim)" opacity="0.5" />
                    <rect x="97" y="37" width="10" height="10" rx="2" fill="var(--primary)" opacity="0.4" />
                    <rect x="111" y="37" width="10" height="10" rx="2" fill="var(--primary)" opacity="0.3" />
                    <rect x="97" y="51" width="10" height="10" rx="2" fill="var(--primary)" opacity="0.3" />
                    <rect x="111" y="51" width="10" height="10" rx="2" fill="var(--primary)" opacity="0.4" />
                    <rect x="125" y="37" width="10" height="10" rx="2" fill="var(--primary)" opacity="0.2" />
                    <rect x="125" y="51" width="10" height="10" rx="2" fill="var(--primary)" opacity="0.35" />
                    <rect x="155" y="45" width="30" height="8" rx="4" fill="var(--primary)" opacity="0.2" />
                    <rect x="155" y="58" width="50" height="4" rx="2" fill="var(--text-tertiary)" opacity="0.2" />
                    <rect x="55" y="45" width="25" height="25" rx="12.5" fill="var(--primary-dim)" stroke="var(--primary)" strokeWidth="1" opacity="0.4" />
                    <rect x="80" y="95" width="120" height="5" rx="2.5" fill="var(--primary-dim)" opacity="0.3" />
                    <rect x="100" y="105" width="80" height="4" rx="2" fill="var(--primary-dim)" opacity="0.2" />
                  </svg>
                </div>
                <h3>{t('index.mobile.card1.title')}</h3>
                <p>{t('index.mobile.card1.desc')}</p>
              </div>
            </ScrollAnimation>
            <ScrollAnimation>
              <div className="card card-with-img" style={{ height: '100%' }}>
                <div className="card-img-placeholder">
                  <svg viewBox="0 0 280 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="20" y="15" width="240" height="110" rx="8" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
                    <circle cx="140" cy="60" r="35" fill="var(--primary-dim)" stroke="var(--primary)" strokeWidth="1" opacity="0.3" />
                    <circle cx="140" cy="60" r="20" fill="var(--primary-dim)" stroke="var(--primary)" strokeWidth="0.8" opacity="0.4" />
                    <circle cx="140" cy="60" r="4" fill="#10B981" opacity="0.6" />
                    <circle cx="120" cy="50" r="3" fill="#3B82F6" opacity="0.4" />
                    <circle cx="160" cy="68" r="3" fill="var(--primary)" opacity="0.4" />
                    <circle cx="148" cy="42" r="3" fill="#8B5CF6" opacity="0.4" />
                    <path d="M140 60 L120 50" stroke="var(--primary)" strokeWidth="0.8" opacity="0.3" />
                    <path d="M140 60 L160 68" stroke="var(--primary)" strokeWidth="0.8" opacity="0.3" />
                    <rect x="70" y="100" width="140" height="5" rx="2.5" fill="var(--primary-dim)" opacity="0.3" />
                    <rect x="90" y="110" width="100" height="4" rx="2" fill="var(--primary-dim)" opacity="0.2" />
                  </svg>
                </div>
                <h3>{t('index.mobile.card2.title')}</h3>
                <p>{t('index.mobile.card2.desc')}</p>
              </div>
            </ScrollAnimation>
            <ScrollAnimation>
              <div className="card card-with-img" style={{ height: '100%' }}>
                <div className="card-img-placeholder">
                  <svg viewBox="0 0 280 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="20" y="15" width="240" height="110" rx="8" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
                    <circle cx="105" cy="55" r="18" fill="var(--primary-dim)" stroke="#3B82F6" strokeWidth="1.2" opacity="0.4" />
                    <path d="M100 55 a5 5 0 1 1 10 0 a5 5 0 1 1 -10 0" fill="#3B82F6" opacity="0.3" />
                    <circle cx="140" cy="55" r="18" fill="var(--primary-dim)" stroke="#EF4444" strokeWidth="1.2" opacity="0.4" />
                    <path d="M137 50 l3 3 l3-3 M137 57 l3 3 l3-3" stroke="#EF4444" strokeWidth="1.2" opacity="0.4" fill="none" />
                    <circle cx="175" cy="55" r="18" fill="var(--primary-dim)" stroke="var(--text-tertiary)" strokeWidth="1.2" opacity="0.4" />
                    <path d="M171 52 a4 4 0 0 1 8 0 v3 a4 4 0 0 1-8 0 z" fill="var(--text-tertiary)" opacity="0.3" />
                    <rect x="80" y="95" width="120" height="5" rx="2.5" fill="var(--primary-dim)" opacity="0.3" />
                    <rect x="100" y="105" width="80" height="4" rx="2" fill="var(--primary-dim)" opacity="0.2" />
                  </svg>
                </div>
                <h3>{t('index.mobile.card3.title')}</h3>
                <p>{t('index.mobile.card3.desc')}</p>
              </div>
            </ScrollAnimation>
            <ScrollAnimation>
              <div className="card card-with-img" style={{ height: '100%' }}>
                <div className="card-img-placeholder">
                  <svg viewBox="0 0 280 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="20" y="15" width="240" height="110" rx="8" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
                    <rect x="80" y="30" width="120" height="55" rx="6" fill="var(--primary-dim)" opacity="0.2" />
                    <rect x="90" y="40" width="60" height="6" rx="3" fill="#10B981" opacity="0.35" />
                    <rect x="90" y="50" width="90" height="4" rx="2" fill="var(--primary)" opacity="0.2" />
                    <rect x="90" y="58" width="40" height="4" rx="2" fill="var(--primary)" opacity="0.15" />
                    <circle cx="170" cy="60" r="15" stroke="#10B981" strokeWidth="2" fill="none" opacity="0.3" />
                    <path d="M170 50 v10 h8" stroke="#10B981" strokeWidth="1.5" fill="none" opacity="0.4" />
                    <rect x="90" y="70" width="100" height="6" rx="3" fill="var(--primary-dim)" opacity="0.4" />
                    <rect x="90" y="70" width="65" height="6" rx="3" fill="#10B981" opacity="0.25" />
                    <rect x="80" y="98" width="120" height="5" rx="2.5" fill="var(--primary-dim)" opacity="0.3" />
                    <rect x="100" y="108" width="80" height="4" rx="2" fill="var(--primary-dim)" opacity="0.2" />
                  </svg>
                </div>
                <h3>{t('index.mobile.card4.title')}</h3>
                <p>{t('index.mobile.card4.desc')}</p>
              </div>
            </ScrollAnimation>
          </div>
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
                    <li style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>{t('matrix.more')}</li>
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
                    <li style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>{t('matrix.more')}</li>
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
                    <li style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>{t('matrix.more')}</li>
                  </ul>
                </div>
              </div>
            </ScrollAnimation>
          </div>
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
          <GlobeVisualization />
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
              <span style={{ fontSize: '1.8rem' }}>こんにちは</span>
              <span style={{ fontSize: '1.6rem' }}>안녕하세요</span>
              <span style={{ fontSize: '1.4rem' }}>Hallo</span>
              <span style={{ fontSize: '1.7rem' }}>Olá</span>
              <span style={{ fontSize: '1.3rem' }}>Merhaba</span>
              <span style={{ fontSize: '1.5rem' }}>Γεια σας</span>
              <span style={{ fontSize: '1.6rem' }}>नमस्ते</span>
              <span style={{ fontSize: '1.4rem' }}>Habari</span>
              <span style={{ fontSize: '1.8rem' }}>ជំរាបសួរ</span>
              <span style={{ fontSize: '1.3rem' }}>Kamusta</span>
              <span style={{ fontSize: '1.5rem' }}>سلام</span>
              <span style={{ fontSize: '1.6rem' }}>Hej</span>
              <span style={{ fontSize: '1.4rem' }}>Selamat</span>
              <span style={{ fontSize: '1.7rem' }}>Сайн уу</span>
              <span style={{ fontSize: '1.3rem' }}>Saluton</span>
              <span style={{ fontSize: '1.5rem' }}>Witam</span>
            </div>
          </ScrollAnimation>
          <ScrollAnimation>
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Link href="/product" className="btn btn-secondary">{t('lang.viewMore')}</Link>
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
          <div className="payment-regions">
            {PAYMENT_REGIONS.map((region, i) => (
              <ScrollAnimation key={region.id} style={{ transitionDelay: `${i * 0.06}s` }}>
                <div className="payment-region-card glass-card">
                  <h3 className="payment-region-title">{t(`payment.regions.${region.id}`)}</h3>
                  <div className="payment-region-logos">
                    {region.methods.map((name) => (
                      <div key={`${region.id}-${name}`} className="payment-logo">
                        {PAYMENT_ICONS[name]}
                        <span>{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollAnimation>
            ))}
          </div>
          <ScrollAnimation style={{ transitionDelay: '0.15s' }}>
            <PaymentRequestForm />
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
                <div className="testimonial-video">
                  <div className="testimonial-video-placeholder">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="11" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
                      <polygon points="10,8 17,12 10,16" fill="rgba(255,255,255,0.7)" />
                    </svg>
                  </div>
                </div>
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
                <div className="testimonial-video">
                  <div className="testimonial-video-placeholder">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="11" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
                      <polygon points="10,8 17,12 10,16" fill="rgba(255,255,255,0.7)" />
                    </svg>
                  </div>
                </div>
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
                <div className="testimonial-video">
                  <div className="testimonial-video-placeholder">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="11" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
                      <polygon points="10,8 17,12 10,16" fill="rgba(255,255,255,0.7)" />
                    </svg>
                  </div>
                </div>
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

      {/* Changelog Section */}
      <section className="section changelog-section" id="changelog">
        <div className="container">
          <ScrollAnimation>
            <div className="section-header">
              <span className="section-label">{t('changelog.label')}</span>
              <h2>{t('changelog.title')}</h2>
              <p>{t('changelog.desc')}</p>
            </div>
          </ScrollAnimation>
          <div className="changelog-timeline">
            {(['v1', 'v2', 'v3', 'v4'] as const).map((key, i) => (
              <ScrollAnimation key={key} style={{ transitionDelay: `${i * 0.08}s` }}>
                <article className="changelog-entry glass-card">
                  <div className="changelog-meta">
                    <span className="changelog-version">{t(`changelog.${key}.version`)}</span>
                    <span className="changelog-date">{t(`changelog.${key}.date`)}</span>
                    <span className="changelog-tag">{t(`changelog.${key}.tag`)}</span>
                  </div>
                  <h3 className="changelog-title">{t(`changelog.${key}.title`)}</h3>
                  <p className="changelog-desc">{t(`changelog.${key}.desc`)}</p>
                </article>
              </ScrollAnimation>
            ))}
          </div>
          <ScrollAnimation style={{ transitionDelay: '0.4s' }}>
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <Link href="/blog" className="btn btn-secondary">
                <span>{t('changelog.viewAll')}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </ScrollAnimation>
        </div>
      </section>

    </DiagramModalProvider>
  );
}
