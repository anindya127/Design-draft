'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { apiLogin, isAuthApiEnabled, setAuthToken } from '@/lib/api/authApi';
import { useAuth } from '@/providers/AuthProvider';
import CaptchaWidget, { type CaptchaProvider, type CaptchaValue } from '@/components/ui/CaptchaWidget';

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

export default function LoginPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { refresh } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [captcha, setCaptcha] = useState<CaptchaValue>(null);
  const [captchaNonce, setCaptchaNonce] = useState(0);

  const captchaProvider: CaptchaProvider = useMemo(() => {
    const raw = (process.env.NEXT_PUBLIC_CAPTCHA_PROVIDER || 'none').toLowerCase().trim();
    if (!raw || raw === 'none' || raw === 'off' || raw === 'false' || raw === '0') return 'none';
    if (raw === 'auto') return locale === 'zh' ? 'tencent' : 'turnstile';
    if (raw === 'turnstile') return 'turnstile';
    if (raw === 'tencent') return 'tencent';
    return 'none';
  }, [locale]);

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const tencentAppId = process.env.NEXT_PUBLIC_TENCENT_CAPTCHA_APP_ID;

  const captchaEnabled = useMemo(() => {
    if (captchaProvider === 'turnstile') return !!turnstileSiteKey;
    if (captchaProvider === 'tencent') return !!tencentAppId;
    return false;
  }, [captchaProvider, turnstileSiteKey, tencentAppId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const useApi = isAuthApiEnabled();
    if (!useApi) {
      setSubmitted(true);
      setLoading(false);
      setTimeout(() => setSubmitted(false), 3000);
      return;
    }

    if (captchaEnabled && !captcha) {
      setLoading(false);
      setError(t('login.errors.captchaRequired'));
      return;
    }

    try {
      const { session, user } = await apiLogin({
        identifier: formData.username,
        password: formData.password,
        captcha: captchaEnabled && captcha ? (captcha as any) : undefined,
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
      setError(t('login.errors.invalid'));
      setCaptcha(null);
      setCaptchaNonce((n) => n + 1);
    }
  };

  return (
    <div className="auth-page">

      {/* Left: Brand Side */}
      <div className="auth-visual auth-visual-gradient">
        <div className="auth-visual-content">
          <h2>{t('login.visual.title')}</h2>
          <p className="auth-visual-subtitle">{t('login.subtitle')}</p>
          <ul className="auth-visual-features">
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              {t('login.features.realtime')}
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              {t('login.features.secure')}
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" x2="22" y1="12" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
              {t('login.features.global')}
            </li>
          </ul>
        </div>
      </div>

      {/* Right: Form Side */}
      <div className="auth-form-side">
        <div className="auth-form-container">
          <h1 className="auth-title">{t('login.title')}</h1>
          <p className="auth-subtitle">{t('login.subtitle')}</p>

          {submitted && (
            <div className="form-banner form-banner--success">
              <CheckIcon />
              {t('login.success')}
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
              <label className="form-label" htmlFor="username">{t('login.usernameLabel')}</label>
              <input
                type="text"
                id="username"
                name="username"
                className="form-input"
                required
                autoComplete="username"
                placeholder={t('login.username.placeholder')}
                value={formData.username}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">{t('login.passwordLabel')}</label>
              <div className="form-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className="form-input"
                  required
                  autoComplete="current-password"
                  placeholder={t('login.password.placeholder')}
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

            {captchaEnabled && (
              <div className="form-group">
                <label className="form-label">{t('login.captchaLabel')}</label>
                <CaptchaWidget
                  key={captchaNonce}
                  provider={captchaProvider}
                  turnstileSiteKey={turnstileSiteKey}
                  tencentAppId={tencentAppId}
                  disabled={loading}
                  onChange={setCaptcha}
                  strings={{
                    verify: t('login.captcha.verify'),
                    verified: t('login.captcha.verified'),
                    loading: t('login.captcha.loading'),
                    errorGeneric: t('login.captcha.error'),
                  }}
                />
              </div>
            )}

            <div className="forgot-link">
              <Link href="/forgot-password" className="auth-link">{t('login.forgot')}</Link>
            </div>

            <button
              type="submit"
              className={`btn btn-primary btn-lg btn-full${loading ? ' btn-loading' : ''}`}
              disabled={loading}
            >
              {t('login.btn')}
            </button>
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
