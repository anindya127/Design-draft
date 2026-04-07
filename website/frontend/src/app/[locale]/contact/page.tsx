'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import ScrollAnimation from '@/components/effects/ScrollAnimation';

export default function ContactPage() {
  const t = useTranslations();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneCode: '+852',
    phone: '',
    country: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const QrPlaceholder = () => (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
      <rect x="6" y="6" width="14" height="14" rx="2" />
      <rect x="9" y="9" width="8" height="8" rx="1" />
      <rect x="28" y="6" width="14" height="14" rx="2" />
      <rect x="31" y="9" width="8" height="8" rx="1" />
      <rect x="6" y="28" width="14" height="14" rx="2" />
      <rect x="9" y="31" width="8" height="8" rx="1" />
      <rect x="28" y="28" width="14" height="14" rx="2" />
    </svg>
  );

  return (
    <>
      {/* Hero */}
      <section className="contact-hero mesh-bg particles-bg">
        <ScrollAnimation>
          <div className="container">
            <span className="section-label">{t('contact.label')}</span>
            <h1>
              <span>{t('contact.title1')}</span><br />
              <span className="gradient-text-animated">{t('contact.title2')}</span>
            </h1>
            <p>{t('contact.desc')}</p>
          </div>
        </ScrollAnimation>
      </section>

      {/* Contact Methods */}
      <section className="section-sm">
        <div className="container">
          <ScrollAnimation>
            <div className="contact-methods">

              {/* Business Communication */}
              <div className="contact-method-card">
                <div className="method-icon icon-gradient--gold">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>
                </div>
                <h3>{t('contact.business.title')}</h3>
                <p>{t('contact.business.desc')}</p>
                <div className="qr-row">
                  <div className="qr-item">
                    <div className="qr-box"><QrPlaceholder /></div>
                    <span>WeChat</span>
                  </div>
                  <div className="qr-item">
                    <div className="qr-box"><QrPlaceholder /></div>
                    <span>WhatsApp</span>
                  </div>
                  <div className="qr-item">
                    <div className="qr-box"><QrPlaceholder /></div>
                    <span>Telegram</span>
                  </div>
                </div>
              </div>

              {/* Technical Support */}
              <div className="contact-method-card">
                <div className="method-icon icon-gradient--green">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
                </div>
                <h3>{t('contact.tech.title')}</h3>
                <p>{t('contact.tech.desc')}</p>
                <div className="qr-row">
                  <div className="qr-item">
                    <div className="qr-box"><QrPlaceholder /></div>
                    <span>WeChat</span>
                  </div>
                  <div className="qr-item">
                    <div className="qr-box"><QrPlaceholder /></div>
                    <span>WhatsApp</span>
                  </div>
                </div>
              </div>

              {/* Quick Connect */}
              <div className="contact-method-card">
                <div className="method-icon icon-gradient--amber">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                </div>
                <h3>{t('contact.quick.title')}</h3>
                <p>{t('contact.quick.desc')}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', marginTop: 8 }}>
                  <a href="mailto:support@gcss.hk" className="btn btn-primary btn-sm" style={{ minWidth: 160 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                    <span>{t('contact.quick.email')}</span>
                  </a>
                  <Link href="/forum" className="btn btn-secondary btn-sm" style={{ minWidth: 160 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                    <span>{t('contact.quick.forum')}</span>
                  </Link>
                </div>
              </div>

            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* Contact Form + Info Section */}
      <section className="section">
        <div className="container">
          <ScrollAnimation>
            <div className="contact-form-section">

              {/* Left: Info */}
              <div className="form-info">
                <h2>
                  <span>{t('contact.form.title')}</span>
                  <span className="text-gradient">{t('contact.form.title2')}</span>
                </h2>
                <p>{t('contact.form.desc')}</p>

                <div className="info-item">
                  <div className="info-icon icon-gradient--gold">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" /></svg>
                  </div>
                  <div>
                    <h4>{t('contact.form.phone')}</h4>
                    <p>+852 XXXX XXXX<br />{t('contact.form.phone.hours')}</p>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon icon-gradient--green">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                  </div>
                  <div>
                    <h4>{t('contact.form.email')}</h4>
                    <p>support@gcss.hk<br />sales@gcss.hk</p>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon icon-gradient--amber">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                  </div>
                  <div>
                    <h4>{t('contact.form.office')}</h4>
                    <p>{t('contact.form.office.hk')}<br />{t('contact.form.office.cn')}</p>
                  </div>
                </div>

                <div style={{ marginTop: 32 }}>
                  <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: 16, background: 'linear-gradient(135deg, #1a1a3e, #0B1120)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 600 }}>Image Placeholder</div>
                </div>
              </div>

              {/* Right: Form */}
              <div className="contact-form-card">
                <h3>{t('contact.form.card.title')}</h3>

                {submitted && (
                  <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid #10B981', borderRadius: 8, marginBottom: 16, color: '#065F46', fontWeight: 600, fontSize: '0.9rem' }}>
                    {t('contact.form.success')}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label><span>{t('contact.form.firstname')}</span><span style={{ color: '#E6A817' }}>*</span></label>
                      <input type="text" name="firstName" placeholder="John" required value={formData.firstName} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label><span>{t('contact.form.lastname')}</span><span style={{ color: '#E6A817' }}>*</span></label>
                      <input type="text" name="lastName" placeholder="Doe" required value={formData.lastName} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label><span>{t('contact.form.workemail')}</span><span style={{ color: '#E6A817' }}>*</span></label>
                    <input type="email" name="email" placeholder="john@company.com" required value={formData.email} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label><span>{t('contact.form.phonenum')}</span><span style={{ color: '#E6A817' }}>*</span></label>
                    <div className="phone-field">
                      <input type="text" className="code" value={formData.phoneCode} readOnly />
                      <input type="tel" name="phone" placeholder="1234 5678" required value={formData.phone} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label><span>{t('contact.form.country.label')}</span><span style={{ color: '#E6A817' }}>*</span></label>
                    <select name="country" required value={formData.country} onChange={handleChange}>
                      <option value="">{t('contact.form.country.select')}</option>
                      <option>Hong Kong</option>
                      <option>China</option>
                      <option>United States</option>
                      <option>United Kingdom</option>
                      <option>Germany</option>
                      <option>France</option>
                      <option>Japan</option>
                      <option>South Korea</option>
                      <option>Australia</option>
                      <option>Singapore</option>
                      <option>Thailand</option>
                      <option>Vietnam</option>
                      <option>Indonesia</option>
                      <option>Malaysia</option>
                      <option>India</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t('contact.form.help.label')}</label>
                    <textarea name="message" placeholder={t('contact.form.help.placeholder')} value={formData.message} onChange={handleChange} />
                  </div>
                  <button type="submit" className="submit-btn">
                    <span>{t('contact.form.submit')}</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 6 }}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                  </button>
                </form>
              </div>

            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* Office Locations */}
      <section className="section section-alt">
        <div className="container">
          <ScrollAnimation>
            <div className="offices-section">
              <span className="section-label">{t('contact.office.label')}</span>
              <h2>{t('contact.office.title')}</h2>
              <p style={{ maxWidth: 500, margin: '8px auto 0', color: 'var(--text-tertiary)' }}>{t('contact.office.desc')}</p>

              <div className="offices-grid">
                <div className="office-card">
                  <div className="office-img" style={{ background: 'linear-gradient(135deg, #1a1a3e, #0B1120)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 600 }}>Image Placeholder</div>
                  <div className="office-info">
                    <h4>{t('contact.office.hk.title')}</h4>
                    <p>{t('contact.office.hk.desc')}</p>
                  </div>
                </div>
                <div className="office-card">
                  <div className="office-img" style={{ background: 'linear-gradient(135deg, #1a1a3e, #0B1120)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 600 }}>Image Placeholder</div>
                  <div className="office-info">
                    <h4>{t('contact.office.cn.title')}</h4>
                    <p>{t('contact.office.cn.desc')}</p>
                  </div>
                </div>
                <div className="office-card">
                  <div className="office-img" style={{ background: 'linear-gradient(135deg, #1a1a3e, #0B1120)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 600 }}>Image Placeholder</div>
                  <div className="office-info">
                    <h4>{t('contact.office.sea.title')}</h4>
                    <p>{t('contact.office.sea.desc')}</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section mesh-bg">
        <ScrollAnimation>
          <div className="container">
            <h2>{t('contact.cta.title')}</h2>
            <p style={{ maxWidth: 500, margin: '0 auto 28px' }}>{t('contact.cta.desc')}</p>
            <div className="cta-buttons">
              <Link href="/pricing" className="btn btn-primary btn-lg">{t('contact.cta.btn1')}</Link>
              <Link href={{ pathname: '/product', hash: 'demo' }} className="btn btn-secondary btn-lg">{t('contact.cta.btn2')}</Link>
            </div>
          </div>
        </ScrollAnimation>
      </section>
    </>
  );
}
