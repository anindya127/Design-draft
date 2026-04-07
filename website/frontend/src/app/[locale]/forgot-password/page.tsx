'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function ForgotPasswordPage() {
  const t = useTranslations();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [vcode, setVcode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSendCode = () => {
    setCodeSent(true);
    setTimeout(() => setCodeSent(false), 3000);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleSetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="auth-page">

      {/* Visual Side */}
      <div className="auth-visual">
        <div className="auth-visual-content">
          <div style={{ width: '100%', maxWidth: 400, aspectRatio: '4/3', borderRadius: 16, background: 'linear-gradient(135deg, #1a1a3e, #0B1120)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 600 }}>Image Placeholder</div>
          <h2 style={{ marginTop: 24 }}>{t('forgot.visual.title')}</h2>
        </div>
      </div>

      {/* Form Side */}
      <div className="auth-form-side glass">
        <div className="auth-form-container">

          {/* Step 1: Email Verification */}
          {step === 1 && (
            <div>
              <h1>{t('forgot.title')}</h1>
              <p className="auth-subtitle">{t('forgot.desc')}</p>
              <form onSubmit={handleVerify}>
                <div className="form-group">
                  <label className="form-label">
                    <span>{t('forgot.emailLabel')}</span>
                    <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder={t('forgot.email.placeholder')}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={t('forgot.code.placeholder')}
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ whiteSpace: 'nowrap', padding: '10px 16px' }}
                    onClick={handleSendCode}
                    disabled={codeSent}
                  >
                    {codeSent ? 'Sent!' : t('forgot.sendcode')}
                  </button>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', marginTop: 8 }}
                >
                  {t('forgot.verify')}
                </button>
              </form>
            </div>
          )}

          {/* Step 2: Set New Password */}
          {step === 2 && (
            <div>
              <h1>{t('forgot.newpwTitle')}</h1>
              <p className="auth-subtitle">{t('forgot.newpwDesc')}</p>

              {submitted && (
                <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid #10B981', borderRadius: 8, marginBottom: 16, color: '#065F46', fontWeight: 600, fontSize: '0.9rem' }}>
                  Password reset successfully! Redirecting to login...
                </div>
              )}

              <form onSubmit={handleSetPassword}>
                <div className="form-group">
                  <label className="form-label">
                    <span>{t('forgot.newpwLabel')}</span>
                    <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder={t('forgot.newpw.placeholder')}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <span>{t('forgot.confirmpwLabel')}</span>
                    <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder={t('forgot.confirmpw.placeholder')}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <span>{t('forgot.vcodeLabel')}</span>
                    <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={t('forgot.vcode.placeholder')}
                    required
                    value={vcode}
                    onChange={(e) => setVcode(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', marginTop: 8 }}
                >
                  {t('forgot.setpw')}
                </button>
              </form>
            </div>
          )}

          <div className="auth-link" style={{ marginTop: 24 }}>
            <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }}>
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>{t('forgot.back')}</span>
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
