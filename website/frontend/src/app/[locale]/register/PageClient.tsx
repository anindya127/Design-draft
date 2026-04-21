'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { apiRegister, isAuthApiEnabled, setAuthToken } from '@/lib/api/authApi';
import { useAuth } from '@/providers/AuthProvider';

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}

export default function RegisterPage() {
  const t = useTranslations();
  const router = useRouter();
  const { refresh } = useAuth();
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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError(t('register.errors.passwordMismatch'));
      return;
    }
    setError('');
    setLoading(true);

    const useApi = isAuthApiEnabled();
    if (!useApi) {
      setSubmitted(true);
      setLoading(false);
      setTimeout(() => setSubmitted(false), 3000);
      return;
    }

    try {
      const { session, user } = await apiRegister({
        username: formData.username,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
      });
      setAuthToken(session.token);
      await refresh();
      setSubmitted(true);
      setLoading(false);

      const role = (user?.role || '').toLowerCase();
      const nextPath = role === 'admin' ? '/admin' : '/dashboard';
      setTimeout(() => router.push(nextPath), 450);
    } catch {
      setLoading(false);
      setError(t('register.errors.generic'));
    }
  };

  return (
    <div className="auth-page">

      {/* Left: Brand Side */}
      <div className="auth-visual auth-visual-gradient">
        <div className="auth-visual-content">
          <h2>{t('register.visual.title')}</h2>
          <p className="auth-visual-subtitle">{t('register.subtitle')}</p>
          <ul className="auth-visual-features">
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" x2="19" y1="8" y2="14" /><line x1="22" x2="16" y1="11" y2="11" /></svg>
              {t('register.features.free')}
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              {t('register.features.encrypted')}
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
              {t('register.features.api')}
            </li>
          </ul>
        </div>
      </div>

      {/* Right: Form Side */}
      <div className="auth-form-side">
        <div className="auth-form-container">
          <h1 className="auth-title">{t('register.title')}</h1>
          <p className="auth-subtitle">{t('register.subtitle')}</p>

          {submitted && (
            <div className="form-banner form-banner--success">
              <CheckIcon />
              {t('register.success')}
            </div>
          )}

          {error && (
            <div className="form-banner form-banner--error">
              <AlertIcon />
              {error}
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
                autoComplete="username"
                placeholder={t('register.username.placeholder')}
                value={formData.username}
                onChange={handleChange}
              />
            </div>

            <div className="auth-form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="firstName">{t('register.firstnameLabel')}</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  className="form-input"
                  required
                  autoComplete="given-name"
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
                  autoComplete="family-name"
                  placeholder={t('register.lastname.placeholder')}
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">{t('register.emailLabel')}</label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-input"
                required
                autoComplete="email"
                placeholder={t('register.email.placeholder')}
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="auth-form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="phone">{t('register.phoneLabel')}</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="form-input"
                  required
                  autoComplete="tel"
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
                  autoComplete="organization"
                  placeholder={t('register.company.placeholder')}
                  value={formData.company}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">{t('register.passwordLabel')}</label>
              <div className="form-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className="form-input"
                  required
                  autoComplete="new-password"
                  placeholder={t('register.password.placeholder')}
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">{t('register.confirmLabel')}</label>
              <div className="form-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  className="form-input"
                  required
                  autoComplete="new-password"
                  placeholder={t('register.confirm.placeholder')}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button
              type="submit"
              className={`btn btn-primary btn-lg${loading ? ' btn-loading' : ''}`}
              disabled={loading}
              style={{ width: '100%' }}
            >
              {t('register.btn')}
            </button>
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
