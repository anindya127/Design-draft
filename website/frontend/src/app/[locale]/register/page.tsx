'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function RegisterPage() {
  const t = useTranslations();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
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
          <h2>{t('register.visual.title')}</h2>
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
          <h1 className="auth-title">{t('register.title')}</h1>
          <p className="auth-subtitle">{t('register.subtitle')}</p>

          {submitted && (
            <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid #10B981', borderRadius: 8, marginBottom: 16, color: '#065F46', fontWeight: 600, fontSize: '0.9rem' }}>
              Account created successfully! Redirecting to login...
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">{t('register.usernameLabel')}</label>
              <input
                type="text"
                id="username"
                name="username"
                className="form-input"
                required
                placeholder={t('register.username.placeholder')}
                value={formData.username}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">{t('register.passwordLabel')}</label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-input"
                required
                placeholder={t('register.password.placeholder')}
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">{t('register.confirmLabel')}</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="form-input"
                required
                placeholder={t('register.confirm.placeholder')}
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="firstName">{t('register.firstnameLabel')}</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                className="form-input"
                required
                placeholder={t('register.firstname.placeholder')}
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="lastName">{t('register.lastnameLabel')}</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                className="form-input"
                required
                placeholder={t('register.lastname.placeholder')}
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">{t('register.emailLabel')}</label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-input"
                required
                placeholder={t('register.email.placeholder')}
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone">{t('register.phoneLabel')}</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className="form-input"
                required
                placeholder={t('register.phone.placeholder')}
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="company">{t('register.companyLabel')}</label>
              <input
                type="text"
                id="company"
                name="company"
                className="form-input"
                placeholder={t('register.company.placeholder')}
                value={formData.company}
                onChange={handleChange}
              />
            </div>

            {error && (
              <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid #EF4444', borderRadius: 8, marginBottom: 16, color: '#991B1B', fontWeight: 600, fontSize: '0.9rem' }}>
                {error}
              </div>
            )}
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>{t('register.btn')}</button>
          </form>

          <p className="auth-footer-text">
            <span>{t('register.hasaccount')}</span>{' '}
            <Link href="/login" className="auth-link">{t('register.login')}</Link>
          </p>
        </div>
      </div>

    </div>
  );
}
