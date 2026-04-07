'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function LoginPage() {
  const t = useTranslations();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    captcha: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="auth-page">

      {/* Left: Visual Side */}
      <div className="auth-visual auth-visual-gradient">
        <div className="auth-visual-content">
          <div style={{ width: '100%', maxWidth: 400, aspectRatio: '4/3', borderRadius: 16, background: 'linear-gradient(135deg, #1a1a3e, #0B1120)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 600 }}>Image Placeholder</div>
          <h2>{t('login.visual.title')}</h2>
          <div className="auth-visual-qr">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="6" fill="white" fillOpacity="0.2" />
              <rect x="8" y="8" width="12" height="12" rx="2" fill="white" fillOpacity="0.6" />
              <rect x="28" y="8" width="12" height="12" rx="2" fill="white" fillOpacity="0.6" />
              <rect x="8" y="28" width="12" height="12" rx="2" fill="white" fillOpacity="0.6" />
              <rect x="24" y="24" width="4" height="4" fill="white" fillOpacity="0.4" />
              <rect x="32" y="28" width="8" height="8" rx="1" fill="white" fillOpacity="0.4" />
            </svg>
          </div>
        </div>
      </div>

      {/* Right: Form Side */}
      <div className="auth-form-side glass">
        <div className="auth-form-container">
          <h1 className="auth-title">{t('login.title')}</h1>
          <p className="auth-subtitle">{t('login.subtitle')}</p>

          {submitted && (
            <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid #10B981', borderRadius: 8, marginBottom: 16, color: '#065F46', fontWeight: 600, fontSize: '0.9rem' }}>
              Login successful! Redirecting...
            </div>
          )}

          {error && (
            <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid #EF4444', borderRadius: 8, marginBottom: 16, color: '#991B1B', fontWeight: 600, fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">{t('login.usernameLabel')}</label>
              <input
                type="text"
                id="username"
                name="username"
                className="form-input"
                required
                placeholder={t('login.username.placeholder')}
                value={formData.username}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">{t('login.passwordLabel')}</label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-input"
                required
                placeholder={t('login.password.placeholder')}
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="captcha">{t('login.captchaLabel')}</label>
              <input
                type="text"
                id="captcha"
                name="captcha"
                className="form-input"
                required
                placeholder={t('login.captcha.placeholder')}
                value={formData.captcha}
                onChange={handleChange}
              />
            </div>

            <div className="form-group" style={{ textAlign: 'right' }}>
              <Link href="/forgot-password" className="auth-link" style={{ color: '#E6A817' }}>{t('login.forgot')}</Link>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>{t('login.btn')}</button>
          </form>

          <p className="auth-footer-text">
            <span>{t('login.noaccount')}</span>{' '}
            <Link href="/register" className="auth-link">{t('login.register')}</Link>
          </p>
        </div>
      </div>

    </div>
  );
}
