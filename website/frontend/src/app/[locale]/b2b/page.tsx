import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Building2, User, Smartphone, Server as ServerIcon, ShieldCheck } from 'lucide-react';
import ScrollAnimation from '@/components/effects/ScrollAnimation';
import SubNav from './SubNav';

export const metadata = {
  title: 'B2B Platform - GCSS | EV Charging SaaS Solution',
  description: 'Build your own EV charging SaaS platform with GCSS B2B solution. Multi-tenant, unlimited operators, automated billing, Super Admin control.',
};

// Demo-only credentials displayed on the page so visitors can try the sandbox.
// Not real secrets — do not add production credentials here.
const DEMO_CREDS = {
  admin: { account: 'admin', pass: '123456' },
  merchant: { account: 'test_merchant', pass: '123456' },
};

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16, flexShrink: 0 }}>
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
    </svg>
  );
}

export default async function B2BPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const rawList = (key: string): string[] => {
    const v = t.raw(key);
    return Array.isArray(v) ? (v as string[]) : [];
  };

  const modeIcons = [
    <svg key="net" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>,
    <svg key="bld" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1" /><rect x="5" y="3" width="14" height="18" rx="1" /></svg>,
    <svg key="link" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>,
    <svg key="ref" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56" /><polyline points="21 3 21 9 15 9" /></svg>,
  ];

  const revenueIcons = [
    <svg key="coin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>,
    <svg key="bank" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="10" width="18" height="11" rx="1" /><path d="M12 3l9 7H3z" /><line x1="7" y1="14" x2="7" y2="17" /><line x1="12" y1="14" x2="12" y2="17" /><line x1="17" y1="14" x2="17" y2="17" /></svg>,
    <svg key="zap" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
    <svg key="meg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>,
  ];

  const modes = ['mode1', 'mode2', 'mode3', 'mode4'] as const;
  const revenues = ['item1', 'item2', 'item3', 'item4'] as const;
  const feats = ['feat1', 'feat2', 'feat3'] as const;
  const aftersalesItems = ['item1', 'item2', 'item3', 'item4'] as const;
  const aftersalesIcons = [
    <svg key="vid" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>,
    <svg key="book" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>,
    <svg key="chat" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>,
    <svg key="target" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
  ];
  const profitColors = ['primary-dim', 'success-dim', 'blue-dim', 'purple-dim'];
  const profitIcons = [
    <svg key="z" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E6A817" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
    <svg key="p" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>,
    <svg key="a" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>,
    <svg key="v" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  ];

  return (
    <>
      <SubNav />

      {/* ==================== Section 1: Hero ==================== */}
      <section className="hero mesh-bg particles-bg" id="overview">
        <div className="container">
          <div className="hero-content hero-split">
            <div className="hero-text">
              <div className="hero-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
                </svg>
                <span>{t('b2b.label')}</span>
              </div>
              <h1 className="hero-title">
                {t('b2b.hero.title')}
              </h1>
              <p className="hero-desc">{t('b2b.hero.desc')}</p>
              <div className="hero-buttons">
                <Link href="/contact" className="btn btn-primary btn-lg">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
                  </svg>
                  <span>{t('b2b.hero.cta1')}</span>
                </Link>
                <Link href="/contact" className="btn btn-secondary btn-lg">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                  </svg>
                  <span>{t('b2b.hero.cta2')}</span>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ==================== Section 2: Architecture ==================== */}
      <section className="section" id="architecture">
        <div className="container">
          <ScrollAnimation>
            <div className="section-header">
              <span className="section-label">{t('b2b.nav.overview')}</span>
              <h2>{t('b2b.overview.title')}</h2>
            </div>
          </ScrollAnimation>
          <ScrollAnimation>
            <div className="b2b-arch-diagram" aria-label={t('b2b.overview.title')}>
              {/* Connecting lines (behind boxes) */}
              <svg className="b2b-arch-connectors" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {/* Platform → Center (vertical) */}
                <line x1="50" y1="26" x2="50" y2="48" stroke="currentColor" strokeWidth="0.4" strokeDasharray="1 1" className="b2b-arch-connector" />
                {/* Operator → Center (horizontal-ish) */}
                <line x1="24" y1="62" x2="42" y2="62" stroke="currentColor" strokeWidth="0.4" strokeDasharray="1 1" className="b2b-arch-connector b2b-arch-connector--2" />
                {/* User → Center */}
                <line x1="58" y1="62" x2="76" y2="62" stroke="currentColor" strokeWidth="0.4" strokeDasharray="1 1" className="b2b-arch-connector b2b-arch-connector--3" />
              </svg>

              {/* Platform box — top */}
              <div className="b2b-arch-box" data-role="platform">
                <div className="b2b-arch-box-header">
                  <span className="b2b-arch-box-title">{t('b2b.overview.platform')}</span>
                </div>
                <div className="b2b-arch-pills">
                  {rawList('b2b.overview.platformItems').map((item, i) => (
                    <span key={i} className="b2b-arch-pill" style={{ ['--i' as string]: i }}>{item}</span>
                  ))}
                </div>
              </div>

              {/* Operator box — left */}
              <div className="b2b-arch-box" data-role="operator">
                <div className="b2b-arch-box-header">
                  <span className="b2b-arch-box-title">{t('b2b.overview.operator')}</span>
                </div>
                <div className="b2b-arch-instances">
                  {['A', 'B', 'N'].map((letter, i) => (
                    <div key={letter} className="b2b-arch-instance" style={{ ['--i' as string]: i }}>
                      <span className="b2b-arch-instance-dot" aria-hidden="true">
                        <Building2 size={22} strokeWidth={2.2} />
                      </span>
                      <span className="b2b-arch-instance-label">{t('b2b.overview.operator')} {letter}</span>
                    </div>
                  ))}
                </div>
                <div className="b2b-arch-pills">
                  {rawList('b2b.overview.operatorItems').map((item, i) => (
                    <span key={i} className="b2b-arch-pill" style={{ ['--i' as string]: i }}>{item}</span>
                  ))}
                </div>
              </div>

              {/* Center circle — APP · CPMS · ADMIN */}
              <div className="b2b-arch-center" aria-label={t('b2b.overview.center')}>
                <div className="b2b-arch-center-ring" aria-hidden="true" />
                <div className="b2b-arch-center-inner">
                  <span><Smartphone size={18} strokeWidth={2.2} /> APP</span>
                  <span><ServerIcon size={18} strokeWidth={2.2} /> CPMS</span>
                  <span><ShieldCheck size={18} strokeWidth={2.2} /> ADMIN</span>
                </div>
                <div className="b2b-arch-center-caption">{t('b2b.overview.model')}</div>
              </div>

              {/* User box — right */}
              <div className="b2b-arch-box" data-role="user">
                <div className="b2b-arch-box-header">
                  <span className="b2b-arch-box-title">{t('b2b.overview.user')}</span>
                </div>
                <div className="b2b-arch-instances">
                  {['A', 'B', 'N'].map((letter, i) => (
                    <div key={letter} className="b2b-arch-instance" style={{ ['--i' as string]: i }}>
                      <span className="b2b-arch-instance-dot" aria-hidden="true">
                        <User size={22} strokeWidth={2.2} />
                      </span>
                      <span className="b2b-arch-instance-label">{t('b2b.overview.user')} {letter}</span>
                    </div>
                  ))}
                </div>
                <div className="b2b-arch-pills">
                  {rawList('b2b.overview.userItems').map((item, i) => (
                    <span key={i} className="b2b-arch-pill" style={{ ['--i' as string]: i }}>{item}</span>
                  ))}
                </div>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* ==================== Section 3: Operation Modes ==================== */}
      <section className="section section-alt" id="modes">
        <div className="container">
          <ScrollAnimation>
            <div className="section-header">
              <span className="section-label">{t('b2b.nav.modes')}</span>
              <h2>{t('b2b.modes.title')}</h2>
              <p>{t('b2b.modes.desc')}</p>
            </div>
          </ScrollAnimation>
          <div className="grid-4">
            {modes.map((mode, i) => (
              <ScrollAnimation key={mode} style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="card glass-card" style={{ height: '100%' }}>
                  <div className="card-icon">{modeIcons[i]}</div>
                  <h3>{t(`b2b.modes.${mode}.title`)}</h3>
                  <p>{t(`b2b.modes.${mode}.desc`)}</p>
                </div>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== Section 4: Revenue Sources ==================== */}
      <section className="section" id="revenue">
        <div className="container">
          <ScrollAnimation>
            <div className="section-header">
              <span className="section-label">{t('b2b.nav.revenue')}</span>
              <h2>{t('b2b.revenue.title')}</h2>
              <p>{t('b2b.revenue.desc')}</p>
            </div>
          </ScrollAnimation>
          <div className="grid-4">
            {revenues.map((item, i) => (
              <ScrollAnimation key={item} style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="card glass-card" style={{ height: '100%' }}>
                  <div className="card-icon">{revenueIcons[i]}</div>
                  <h3>{t(`b2b.revenue.${item}.title`)}</h3>
                  <p>{t(`b2b.revenue.${item}.desc`)}</p>
                </div>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== Section 5: Key Features ==================== */}
      <section className="section section-alt" id="features">
        <div className="container">
          <ScrollAnimation>
            <div className="section-header">
              <span className="section-label">{t('b2b.nav.features')}</span>
              <h2>{t('b2b.features.title')}</h2>
            </div>
          </ScrollAnimation>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            {feats.map((feat, i) => (
              <ScrollAnimation key={feat} style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="b2b-feat-item">
                  <div className="b2b-feat-num">{i + 1}</div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 8 }}>{t(`b2b.features.${feat}.title`)}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.7 }}>{t(`b2b.features.${feat}.desc`)}</p>
                  </div>
                </div>
              </ScrollAnimation>
            ))}
            <ScrollAnimation style={{ transitionDelay: `${feats.length * 0.1}s` }}>
              <div className="b2b-payment-flow-wrap">
                <h4 className="b2b-payment-flow-title">{t('b2b.advantages.paymentTitle')}</h4>
                <div className="b2b-payment-flow" role="list">
                  {[t('b2b.advantages.payment1'), t('b2b.advantages.payment2'), t('b2b.advantages.payment3')].map((step, i, arr) => (
                    <div key={i} className="b2b-payment-step-wrap" role="listitem">
                      <div className="b2b-payment-step-card" style={{ ['--i' as string]: i }}>
                        <div className="b2b-payment-step-num">{i + 1}</div>
                        <div className="b2b-payment-step-text">{step}</div>
                      </div>
                      {i < arr.length - 1 && (
                        <div className="b2b-payment-step-arrow" aria-hidden="true">
                          <svg width="32" height="20" viewBox="0 0 32 20" fill="none">
                            <line x1="2" y1="10" x2="26" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 4" />
                            <path d="M22 4 L30 10 L22 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* ==================== Section 7: Revenue Model ==================== */}
      <section className="section section-alt" id="profit">
        <div className="container">
          <ScrollAnimation>
            <div className="section-header">
              <span className="section-label">{t('b2b.nav.profit')}</span>
              <h2>{t('b2b.profit.title')}</h2>
              <p>{t('b2b.profit.subtitle')}</p>
            </div>
          </ScrollAnimation>
          <div className="grid-4">
            {(['stream1', 'stream2', 'stream3', 'stream4'] as const).map((stream, i) => (
              <ScrollAnimation key={stream} style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="card glass-card" style={{ textAlign: 'center', height: '100%' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 14, background: i === 0 ? 'var(--primary-dim)' : i === 1 ? 'rgba(16,185,129,0.1)' : i === 2 ? 'rgba(59,130,246,0.1)' : 'rgba(139,92,246,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    {profitIcons[i]}
                  </div>
                  <h3>{t(`b2b.profit.${stream}.title`)}</h3>
                  <p>{t(`b2b.profit.${stream}.desc`)}</p>
                </div>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== Section 8: Feature Support Matrix ==================== */}
      <section className="section" id="support">
        <div className="container">
          <ScrollAnimation>
            <div className="section-header">
              <span className="section-label">{t('b2b.nav.support')}</span>
              <h2>{t('b2b.support.title')}</h2>
            </div>
          </ScrollAnimation>
          <ScrollAnimation>
            <div className="support-matrix">
              {/* APP / H5 column */}
              <div className="support-col" data-accent="rose">
                <div className="support-col-header">
                  <div className="support-col-icon" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="2" width="14" height="20" rx="2.5" />
                      <line x1="12" y1="18" x2="12" y2="18" />
                    </svg>
                  </div>
                  <div className="support-col-title">{t('b2b.support.app')}</div>
                </div>
                <ul className="support-col-list">
                  {rawList('b2b.support.appFeatures').map((f, i) => (
                    <li key={i} style={{ ['--i' as string]: i }}>
                      <span className="support-row-dot" aria-hidden="true" />
                      <span className="support-row-text">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CPMS column */}
              <div className="support-col" data-accent="gold">
                <div className="support-col-header">
                  <div className="support-col-icon" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="4" width="16" height="16" rx="2" />
                      <rect x="9" y="9" width="6" height="6" />
                      <line x1="9" y1="1" x2="9" y2="4" />
                      <line x1="15" y1="1" x2="15" y2="4" />
                      <line x1="9" y1="20" x2="9" y2="23" />
                      <line x1="15" y1="20" x2="15" y2="23" />
                      <line x1="20" y1="9" x2="23" y2="9" />
                      <line x1="20" y1="14" x2="23" y2="14" />
                      <line x1="1" y1="9" x2="4" y2="9" />
                      <line x1="1" y1="14" x2="4" y2="14" />
                    </svg>
                  </div>
                  <div className="support-col-title">{t('b2b.support.cpms')}</div>
                </div>
                <ul className="support-col-list">
                  {rawList('b2b.support.cpmsFeatures').map((f, i) => (
                    <li key={i} style={{ ['--i' as string]: i }}>
                      <span className="support-row-dot" aria-hidden="true" />
                      <span className="support-row-text">{f}</span>
                    </li>
                  ))}
                  {rawList('b2b.support.cpmsFeatures2').map((f, i) => {
                    const idx = i + 8;
                    return (
                      <li key={`2-${i}`} style={{ ['--i' as string]: idx }}>
                        <span className="support-row-dot" aria-hidden="true" />
                        <span className="support-row-text">{f}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Platform Management column */}
              <div className="support-col" data-accent="emerald">
                <div className="support-col-header">
                  <div className="support-col-icon" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                  </div>
                  <div className="support-col-title">{t('b2b.support.admin')}</div>
                </div>
                <ul className="support-col-list">
                  {rawList('b2b.support.adminFeatures').map((f, i) => (
                    <li key={i} style={{ ['--i' as string]: i }}>
                      <span className="support-row-dot" aria-hidden="true" />
                      <span className="support-row-text">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* ==================== Section 10: After-Sales ==================== */}
      <section className="section" id="aftersales">
        <div className="container">
          <ScrollAnimation>
            <div className="section-header">
              <span className="section-label">{t('b2b.nav.aftersales')}</span>
              <h2>{t('b2b.aftersales.title')}</h2>
              <p>{t('b2b.aftersales.desc')}</p>
            </div>
          </ScrollAnimation>
          <div className="grid-2">
            {aftersalesItems.map((item, i) => (
              <ScrollAnimation key={item} style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="card glass-card" style={{ height: '100%' }}>
                  <div className="card-icon">{aftersalesIcons[i]}</div>
                  <h3>{t(`b2b.aftersales.${item}.title`)}</h3>
                  <p>{t(`b2b.aftersales.${item}.desc`)}</p>
                </div>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== Section 12: System Demo ==================== */}
      <section className="section section-alt" id="demo">
        <div className="container">
          <ScrollAnimation>
            <div className="section-header">
              <span className="section-label">{t('b2b.nav.demo')}</span>
              <h2>{t('b2b.demo.title')}</h2>
            </div>
          </ScrollAnimation>
          <div className="grid-2" style={{ gap: 32, alignItems: 'start' }}>
            <ScrollAnimation>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="glass-card" style={{ padding: 28, borderRadius: 'var(--radius-lg)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>{t('b2b.demo.admin.title')}</h3>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginBottom: 16 }}>{t('b2b.demo.admin.subtitle')}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginBottom: 10 }}>{t('b2b.demo.demoAccount')}</div>
                  <div className="b2b-demo-field"><span>{t('b2b.demo.account')}:</span><code>{DEMO_CREDS.admin.account}</code></div>
                  <div className="b2b-demo-field"><span>{t('b2b.demo.password')}:</span><code>{DEMO_CREDS.admin.pass}</code></div>
                  <button type="button" className="btn btn-secondary" style={{ marginTop: 16 }}>{t('b2b.demo.launch')}</button>
                </div>
                <div className="glass-card" style={{ padding: 28, borderRadius: 'var(--radius-lg)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>{t('b2b.demo.merchant.title')}</h3>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginBottom: 16 }}>{t('b2b.demo.merchant.subtitle')}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginBottom: 10 }}>{t('b2b.demo.demoAccount')}</div>
                  <div className="b2b-demo-field"><span>{t('b2b.demo.account')}:</span><code>{DEMO_CREDS.merchant.account}</code></div>
                  <div className="b2b-demo-field"><span>{t('b2b.demo.password')}:</span><code>{DEMO_CREDS.merchant.pass}</code></div>
                  <button type="button" className="btn btn-secondary" style={{ marginTop: 16 }}>{t('b2b.demo.launch')}</button>
                </div>
              </div>
            </ScrollAnimation>
            <ScrollAnimation style={{ transitionDelay: '0.15s' }}>
              <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div className="glass-card" style={{ width: 'clamp(120px, 20vw, 160px)', height: 'clamp(120px, 20vw, 160px)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-lg)', marginBottom: 10 }}>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>QR Code</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('b2b.demo.mobileDemo')}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div className="glass-card" style={{ width: 'clamp(120px, 20vw, 160px)', height: 'clamp(120px, 20vw, 160px)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-lg)', marginBottom: 10 }}>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>QR Code</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('b2b.demo.webDemo')}</div>
                </div>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* ==================== Section 13: Pricing ==================== */}
      <section className="section" id="pricing">
        <div className="container">
          <ScrollAnimation>
            <div className="section-header">
              <span className="section-label">{t('b2b.nav.pricing')}</span>
              <h2>{t('b2b.pricing.title')}</h2>
              <p>{t('b2b.pricing.desc')}</p>
            </div>
          </ScrollAnimation>
          <div className="grid-2" style={{ maxWidth: 900, margin: '0 auto', gap: 32 }}>
            <ScrollAnimation>
              <div className="pricing-card glass-card">
                <h3>{t('b2b.pricing.standard.title')}</h3>
                <div className="pricing-amount">{t('b2b.pricing.standard.price')}</div>
                <ul className="pricing-features">
                  {rawList('b2b.pricing.standard.features').map((f, i) => (
                    <li key={i}><CheckIcon /><span>{f}</span></li>
                  ))}
                </ul>
                <Link href="/contact" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>{t('b2b.pricing.cta')}</Link>
              </div>
            </ScrollAnimation>
            <ScrollAnimation style={{ transitionDelay: '0.1s' }}>
              <div className="pricing-card glass-card featured">
                <h3>{t('b2b.pricing.enhanced.title')}</h3>
                <div className="pricing-amount">{t('b2b.pricing.enhanced.price')}</div>
                <ul className="pricing-features">
                  {rawList('b2b.pricing.enhanced.features').map((f, i) => (
                    <li key={i}><CheckIcon /><span>{f}</span></li>
                  ))}
                </ul>
                <Link href="/contact" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>{t('b2b.pricing.cta')}</Link>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* ==================== Section 14: Release History (end of page) ==================== */}
      <section className="section section-alt" id="releases">
        <div className="container">
          <ScrollAnimation>
            <div className="section-header">
              <span className="section-label">{t('b2b.releases.label')}</span>
              <h2>{t('b2b.releases.title')}</h2>
              <p>{t('b2b.releases.desc')}</p>
            </div>
          </ScrollAnimation>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            {(['v3_2', 'v3_1', 'v3_0', 'v2_5', 'v2_0'] as const).map((ver, i) => (
              <ScrollAnimation key={ver}>
                <div className="release-item" style={{ display: 'flex', gap: 20, marginBottom: 32, position: 'relative', paddingLeft: 32 }}>
                  <div style={{ position: 'absolute', left: 0, top: 6, width: 12, height: 12, borderRadius: '50%', background: i === 0 ? 'var(--primary)' : 'var(--border-medium)', boxShadow: i === 0 ? '0 0 12px rgba(230,168,23,0.4)' : 'none' }} />
                  {i < 4 && <div style={{ position: 'absolute', left: 5, top: 20, width: 2, height: 'calc(100% + 12px)', background: 'var(--border-subtle)' }} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{t(`b2b.releases.${ver}.version`)}</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>{t(`b2b.releases.${ver}.date`)}</span>
                      {i === 0 && <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 100, background: 'var(--primary-dim)', color: 'var(--primary)', fontWeight: 600 }}>{t('b2b.releases.latest')}</span>}
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 8 }}>{t(`b2b.releases.${ver}.summary`)}</p>
                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {([1, 2, 3] as const).map((n) => (
                        <li key={n} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          <CheckIcon />
                          <span>{t(`b2b.releases.${ver}.f${n}`)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
